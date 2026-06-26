using System;
using System.Collections.Generic;

namespace XparkGMAO.Core.DTOs.Email
{
    public class EmailListItemDto
    {
        public string Id { get; set; } = string.Empty;   // UniqueId MailKit
        public string De { get; set; } = string.Empty;   // From
        public string DeNom { get; set; } = string.Empty;   // Display name
        public string Sujet { get; set; } = string.Empty;
        public string Apercu { get; set; } = string.Empty;   // 100 premiers chars
        public bool Lu { get; set; }
        public bool Etoile { get; set; }
        public bool APieceJointe { get; set; }
        public int NbPiecesJointes { get; set; }
        public DateTime DateUtc { get; set; }
        public string Boite { get; set; } = string.Empty;   // "INBOX"|"Sent"|"Drafts"...
    }

    public class EmailDetailDto : EmailListItemDto
    {
        public string Corps { get; set; } = string.Empty;  // HTML
        public string A { get; set; } = string.Empty;
        public List<string> Cc { get; set; } = new();
        public List<PieceJointeDto> PiecesJointes { get; set; } = new();
    }

    public class PieceJointeDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;   // MIME type
        public long Taille { get; set; }
        public string Contenu { get; set; } = string.Empty;   // Base64
    }

    public class EmailBoiteDto
    {
        public string Nom { get; set; } = string.Empty;
        public int NonLus { get; set; }
        public int Total { get; set; }
        public string Icone { get; set; } = string.Empty;
    }

    public class EnvoyerEmailDto
    {
        public List<string> A { get; set; } = new();
        public List<string> Cc { get; set; } = new();
        public string Sujet { get; set; } = string.Empty;
        public string Corps { get; set; } = string.Empty;   // HTML
        public string? ReplyTo { get; set; }                   // MessageId original
    }

    public class PagedEmailsDto
    {
        public List<EmailListItemDto> Emails { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
        public int NonLus { get; set; }
    }
}
