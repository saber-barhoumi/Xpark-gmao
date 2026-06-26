using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using XparkGMAO.Core.Config;
using XparkGMAO.Core.DTOs.Email;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Infrastructure.Services
{
    public class ImapEmailService : IImapEmailService
    {
        private readonly EmailConfig _config;
        private readonly ILogger<ImapEmailService> _logger;

        // Mapping nom lisible → dossier IMAP Gmail
        private static readonly Dictionary<string, string> DOSSIERS = new()
        {
            { "INBOX",     "INBOX" },
            { "Sent",      "[Gmail]/Sent Mail" },
            { "Drafts",    "[Gmail]/Drafts" },
            { "Spam",      "[Gmail]/Spam" },
            { "Trash",     "[Gmail]/Trash" },
            { "Starred",   "[Gmail]/Starred" },
            { "All",       "[Gmail]/All Mail" },
        };

        public ImapEmailService(IOptions<EmailConfig> config, ILogger<ImapEmailService> logger)
        {
            _config = config.Value;
            _logger = logger;
        }

        private async Task<ImapClient> ConnectAsync()
        {
            var client = new ImapClient();
            await client.ConnectAsync(_config.ImapHost, _config.ImapPort, _config.ImapSsl);
            await client.AuthenticateAsync(_config.Username, _config.Password);
            return client;
        }

        public async Task<List<EmailBoiteDto>> GetBoitesAsync()
        {
            using var client = await ConnectAsync();
            var result = new List<EmailBoiteDto>();

            var boitesConfig = new[]
            {
                new { Cle = "INBOX",  Nom = "Inbox",      Icone = "solar:inbox-outline" },
                new { Cle = "Sent",   Nom = "Envoyés",    Icone = "solar:map-arrow-right-outline" },
                new { Cle = "Drafts", Nom = "Brouillons", Icone = "solar:clapperboard-edit-outline" },
                new { Cle = "Spam",   Nom = "Spam",       Icone = "solar:info-square-outline" },
                new { Cle = "Trash",  Nom = "Corbeille",  Icone = "solar:trash-bin-trash-outline" },
            };

            foreach (var b in boitesConfig)
            {
                try
                {
                    var folder = await client.GetFolderAsync(DOSSIERS[b.Cle]);
                    await folder.OpenAsync(FolderAccess.ReadOnly);
                    result.Add(new EmailBoiteDto
                    {
                        Nom = b.Nom,
                        NonLus = folder.Unread,
                        Total = folder.Count,
                        Icone = b.Icone,
                    });
                    await folder.CloseAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Boîte {Boite} inaccessible : {Err}", b.Cle, ex.Message);
                }
            }

            await client.DisconnectAsync(true);
            return result;
        }

        public async Task<PagedEmailsDto> GetEmailsAsync(string boite, int page, int limit, string? search)
        {
            using var client = await ConnectAsync();
            var dossierImap = DOSSIERS.GetValueOrDefault(boite, "INBOX");
            IMailFolder folder;
            try {
                folder = await client.GetFolderAsync(dossierImap);
            } catch {
                folder = client.Inbox; 
            }
            
            await folder.OpenAsync(FolderAccess.ReadOnly);

            IList<UniqueId> uids;
            if (!string.IsNullOrEmpty(search))
            {
                var query = SearchQuery.SubjectContains(search)
                    .Or(SearchQuery.FromContains(search))
                    .Or(SearchQuery.BodyContains(search));
                uids = await folder.SearchAsync(query);
            }
            else
            {
                uids = await folder.SearchAsync(SearchQuery.All);
            }

            var uidsSorted = uids.Reverse().ToList();
            var total = uidsSorted.Count;
            var nonLus = (await folder.SearchAsync(SearchQuery.NotSeen)).Count;

            var paged = uidsSorted
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToList();

            var fetchItems = MessageSummaryItems.UniqueId 
                         | MessageSummaryItems.Envelope 
                         | MessageSummaryItems.Flags 
                         | MessageSummaryItems.Size;

            var summaries = await folder.FetchAsync(paged, fetchItems);

            var emails = summaries.Select(s => new EmailListItemDto
            {
                Id = s.UniqueId.ToString(),
                De = s.Envelope.From.Mailboxes.FirstOrDefault()?.Address ?? "",
                DeNom = s.Envelope.From.Mailboxes.FirstOrDefault()?.Name ?? "Inconnu",
                Sujet = s.Envelope.Subject ?? "(Sans objet)",
                Apercu = "",
                Lu = s.Flags.HasValue && s.Flags.Value.HasFlag(MessageFlags.Seen),
                Etoile = s.Flags.HasValue && s.Flags.Value.HasFlag(MessageFlags.Flagged),
                APieceJointe = false,
                DateUtc = s.Envelope.Date?.UtcDateTime ?? DateTime.UtcNow,
                Boite = boite,
            }).ToList();

            await folder.CloseAsync();
            await client.DisconnectAsync(true);

            return new PagedEmailsDto
            {
                Emails = emails,
                Total = total,
                Page = page,
                Limit = limit,
                TotalPages = (int)Math.Ceiling((double)total / limit),
                NonLus = nonLus,
            };
        }

        public async Task<EmailDetailDto> GetEmailByIdAsync(string boite, string uid)
        {
            using var client = await ConnectAsync();
            var dossierImap = DOSSIERS.GetValueOrDefault(boite, "INBOX");
            var folder = await client.GetFolderAsync(dossierImap);
            await folder.OpenAsync(FolderAccess.ReadWrite);

            var uniqueId = new UniqueId(uint.Parse(uid));
            var message = await folder.GetMessageAsync(uniqueId);

            await folder.AddFlagsAsync(uniqueId, MessageFlags.Seen, true);

            var piecesJointes = new List<PieceJointeDto>();
            foreach (var part in message.Attachments)
            {
                if (part is MimePart mimePart)
                {
                    using var ms = new MemoryStream();
                    await mimePart.Content.DecodeToAsync(ms);
                    piecesJointes.Add(new PieceJointeDto
                    {
                        Nom = mimePart.FileName ?? "fichier",
                        Type = mimePart.ContentType.MimeType,
                        Taille = ms.Length,
                        Contenu = Convert.ToBase64String(ms.ToArray()),
                    });
                }
            }

            var corps = message.HtmlBody
                     ?? message.TextBody?.Replace("\n", "<br>")
                     ?? "(Aucun contenu)";

            var detail = new EmailDetailDto
            {
                Id = uid,
                De = message.From.Mailboxes.FirstOrDefault()?.Address ?? "",
                DeNom = message.From.Mailboxes.FirstOrDefault()?.Name ?? "Inconnu",
                A = string.Join(", ", message.To.Mailboxes.Select(m => m.Address)),
                Sujet = message.Subject ?? "(Sans objet)",
                Corps = corps,
                Lu = true,
                Etoile = false,
                APieceJointe = piecesJointes.Any(),
                NbPiecesJointes = piecesJointes.Count,
                DateUtc = message.Date.UtcDateTime,
                Boite = boite,
                PiecesJointes = piecesJointes,
                Cc = message.Cc.Mailboxes.Select(m => m.Address).ToList(),
            };

            await folder.CloseAsync();
            await client.DisconnectAsync(true);
            return detail;
        }

        public async Task MarquerLuAsync(string boite, string uid, bool lu)
        {
            using var client = await ConnectAsync();
            var folder = await client.GetFolderAsync(DOSSIERS.GetValueOrDefault(boite, "INBOX"));
            await folder.OpenAsync(FolderAccess.ReadWrite);
            var uniqueId = new UniqueId(uint.Parse(uid));
            if (lu)
                await folder.AddFlagsAsync(uniqueId, MessageFlags.Seen, true);
            else
                await folder.RemoveFlagsAsync(uniqueId, MessageFlags.Seen, true);
            await folder.CloseAsync();
            await client.DisconnectAsync(true);
        }

        public async Task EtoilerAsync(string boite, string uid, bool etoile)
        {
            using var client = await ConnectAsync();
            var folder = await client.GetFolderAsync(DOSSIERS.GetValueOrDefault(boite, "INBOX"));
            await folder.OpenAsync(FolderAccess.ReadWrite);
            var uniqueId = new UniqueId(uint.Parse(uid));
            if (etoile)
                await folder.AddFlagsAsync(uniqueId, MessageFlags.Flagged, true);
            else
                await folder.RemoveFlagsAsync(uniqueId, MessageFlags.Flagged, true);
            await folder.CloseAsync();
            await client.DisconnectAsync(true);
        }

        public async Task<bool> DeplacerVersCorbeille(string boite, string uid)
        {
            using var client = await ConnectAsync();
            var source = await client.GetFolderAsync(DOSSIERS.GetValueOrDefault(boite, "INBOX"));
            await source.OpenAsync(FolderAccess.ReadWrite);
            var trash = await client.GetFolderAsync(DOSSIERS["Trash"]);
            var uniqueId = new UniqueId(uint.Parse(uid));
            await source.MoveToAsync(uniqueId, trash);
            await source.CloseAsync();
            await client.DisconnectAsync(true);
            return true;
        }

        public async Task SupprimerAsync(string boite, string uid)
        {
            using var client = await ConnectAsync();
            var folder = await client.GetFolderAsync(DOSSIERS.GetValueOrDefault(boite, "INBOX"));
            await folder.OpenAsync(FolderAccess.ReadWrite);
            var uniqueId = new UniqueId(uint.Parse(uid));
            await folder.AddFlagsAsync(uniqueId, MessageFlags.Deleted, true);
            await folder.ExpungeAsync();
            await folder.CloseAsync();
            await client.DisconnectAsync(true);
        }
    }
}
