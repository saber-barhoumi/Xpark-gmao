using IAM.Application.DTOs;
using IAM.Application.Interfaces;
using IAM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using XparkGMAO.Shared.Enums;

namespace IAM.Infrastructure.Services;

/// <summary>
/// Archivage intelligent des comptes.
///
/// Règle métier : un compte qui porte un HISTORIQUE (missions, factures,
/// maintenance, suivi, notifications, messagerie…) ne doit jamais être détruit
/// — l'historique appartient à l'entreprise, pas au compte. Il est donc
/// ARCHIVÉ : il disparaît des écrans actifs, toutes ses relations restent
/// intactes, et il peut être restauré. Un compte sans aucune trace métier
/// (créé par erreur, jamais utilisé) est réellement supprimé.
///
/// La détection s'appuie sur la base PostgreSQL partagée du système : chaque
/// table métier est interrogée par un COUNT ciblé. Les tables absentes (module
/// non déployé) sont simplement ignorées, ce qui rend le service tolérant à
/// l'évolution du schéma — y compris pour de futurs rôles ou modules.
/// </summary>
public class UserArchiveService(IamDbContext db) : IUserArchiveService
{
    /// <summary>
    /// Tables métier à inspecter : (table, colonne, libellé lisible).
    /// Les tables purement techniques (journaux d'authentification, OTP,
    /// réglages MFA) sont volontairement EXCLUES : elles n'ont aucune valeur
    /// d'historique et ne doivent pas empêcher une suppression définitive.
    /// </summary>
    private static readonly (string Table, string Colonne, string Libelle)[] SourcesMetier =
    [
        ("Missions",              "ClientIdUtilisateur",  "Missions (client)"),
        ("Missions",              "EmployeeId",           "Missions (chauffeur)"),
        ("Factures",              "ClientId",             "Factures"),
        ("Reservations",          "ClientId",             "Réservations"),
        ("Devis",                 "ClientId",             "Devis"),
        ("DemandesServices",      "ClientId",             "Demandes de service"),
        ("TransportRequests",     "ClientIdUtilisateur",  "Demandes de transport"),
        ("TransportRequests",     "QuotedByUserId",       "Devis établis"),
        ("SupportTickets",        "ClientIdUtilisateur",  "Tickets de support"),
        ("Interventions",         "TechnicienId",         "Interventions"),
        ("OrdresTravail",         "TechnicienId",         "Ordres de travail"),
        ("HistoriqueStatutsOT",   "UtilisateurId",        "Historique des ordres de travail"),
        ("InspectionsEquipements","TechnicienId",         "Inspections d'équipements"),
        ("MouvementsEquipements", "IdUtilisateur",        "Mouvements d'équipements"),
        ("NotesEquipements",      "AuteurId",             "Notes d'équipements"),
        ("Commentaires",          "AuteurId",             "Commentaires"),
        ("Alertes",               "UtilisateurId",        "Alertes"),
        ("NotificationsClients",  "ClientId",             "Notifications"),
        ("Conversations",         "CreatedByUserId",      "Conversations"),
        ("ConversationParticipants","UtilisateurId",      "Participations aux conversations"),
        ("MessageReactions",      "UtilisateurId",        "Réactions aux messages"),
        ("TableauxDeBord",        "UtilisateurId",        "Tableaux de bord"),
        ("TrajetsCalcules",       "UtilisateurId",        "Trajets calculés"),
        ("CalendarEvents",        "UserId",               "Événements de calendrier"),
    ];

    public async Task<UserDependenciesDto> GetDependenciesAsync(long userId)
    {
        var details = new List<UserDependencyDto>();

        foreach (var (table, colonne, libelle) in SourcesMetier)
        {
            var n = await CompterAsync(table, colonne, userId);
            if (n > 0) details.Add(new UserDependencyDto(libelle, n));
        }

        // Deux entrées peuvent porter le même libellé (ex. Missions client +
        // chauffeur) : on regroupe pour un affichage lisible.
        var regroupes = details
            .GroupBy(d => d.Libelle)
            .Select(g => new UserDependencyDto(g.Key, g.Sum(x => x.Nombre)))
            .OrderByDescending(d => d.Nombre)
            .ToList();

        var total = regroupes.Sum(d => d.Nombre);
        return new UserDependenciesDto(userId, total > 0, total, regroupes);
    }

    /// <summary>
    /// COUNT tolérant : une table ou une colonne absente (module non déployé,
    /// schéma plus ancien) renvoie 0 au lieu de faire échouer l'opération.
    /// </summary>
    private async Task<int> CompterAsync(string table, string colonne, long userId)
    {
        try
        {
            var sql = $"SELECT COUNT(*) FROM \"{table}\" WHERE \"{colonne}\" = @id";
            await using var cmd = db.Database.GetDbConnection().CreateCommand();
            if (cmd.Connection!.State != System.Data.ConnectionState.Open)
                await cmd.Connection.OpenAsync();
            cmd.CommandText = sql;
            var p = new NpgsqlParameter("@id", userId);
            cmd.Parameters.Add(p);
            var res = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(res ?? 0);
        }
        catch
        {
            return 0;   // table/colonne inexistante → aucune dépendance de ce côté
        }
    }

    public async Task<DeleteOrArchiveResultDto> DeleteOrArchiveAsync(long adminId, long userId)
    {
        if (adminId == userId)
            throw new InvalidOperationException("Vous ne pouvez pas supprimer votre propre compte.");

        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (user.Statut == StatutUtilisateur.ARCHIVE)
            throw new InvalidOperationException("Ce compte est déjà archivé.");

        var deps = await GetDependenciesAsync(userId);

        // Historique métier présent → archivage (jamais de destruction).
        if (deps.ADesDonneesMetier)
        {
            user.Statut           = StatutUtilisateur.ARCHIVE;
            user.Actif            = false;
            user.DateModification = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return new DeleteOrArchiveResultDto(userId, true,
                $"Compte archivé : {deps.TotalReferences} donnée(s) métier conservée(s).",
                deps.Details);
        }

        // Aucune trace métier → suppression définitive. Les enregistrements
        // purement techniques (journaux d'authentification, OTP, MFA) sont
        // retirés d'abord : ce ne sont pas des données d'entreprise.
        foreach (var (table, colonne) in new[]
                 {
                     ("AuthAuditLogs", "UserId"), ("LoginHistory", "UserId"),
                     ("EmailOtps", "UserId"), ("UserMfaSettings", "UserId"),
                     ("UtilisateurStatuts", "UtilisateurId"), ("AuditLogs", "UtilisateurId"),
                 })
        {
            await SupprimerTechniqueAsync(table, colonne, userId);
        }

        try
        {
            db.Utilisateurs.Remove(user);
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Filet de sécurité : une contrainte inattendue (table non
            // inventoriée) ne doit pas casser l'opération — on archive.
            user.Statut           = StatutUtilisateur.ARCHIVE;
            user.Actif            = false;
            user.DateModification = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return new DeleteOrArchiveResultDto(userId, true,
                "Compte archivé : des données liées empêchent la suppression définitive.",
                deps.Details);
        }

        return new DeleteOrArchiveResultDto(userId, false,
            "Compte supprimé définitivement (aucune donnée métier associée).",
            deps.Details);
    }

    private async Task SupprimerTechniqueAsync(string table, string colonne, long userId)
    {
        try
        {
            await using var cmd = db.Database.GetDbConnection().CreateCommand();
            if (cmd.Connection!.State != System.Data.ConnectionState.Open)
                await cmd.Connection.OpenAsync();
            cmd.CommandText = $"DELETE FROM \"{table}\" WHERE \"{colonne}\" = @id";
            cmd.Parameters.Add(new NpgsqlParameter("@id", userId));
            await cmd.ExecuteNonQueryAsync();
        }
        catch { /* table absente → rien à faire */ }
    }

    public async Task<IEnumerable<ArchivedUserDto>> GetArchivedAsync()
    {
        var archives = await db.Utilisateurs
            .AsNoTracking()
            .Where(u => u.Statut == StatutUtilisateur.ARCHIVE)
            .OrderByDescending(u => u.DateModification)
            .ToListAsync();

        var resultat = new List<ArchivedUserDto>();
        foreach (var u in archives)
        {
            var deps = await GetDependenciesAsync(u.IdUtilisateur);
            resultat.Add(new ArchivedUserDto(
                u.IdUtilisateur, u.Nom, u.Prenom, u.Email, u.Telephone,
                u.Role.ToString(), u.DateCreation, u.DateModification, deps.TotalReferences));
        }
        return resultat;
    }

    public async Task RestoreAsync(long userId)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (user.Statut != StatutUtilisateur.ARCHIVE)
            throw new InvalidOperationException("Ce compte n'est pas archivé.");

        // Restauration en SUSPENDU et non ACTIF : un administrateur relit le
        // compte et le réactive explicitement — on ne redonne pas l'accès
        // automatiquement à un compte qui avait été retiré.
        user.Statut           = StatutUtilisateur.SUSPENDU;
        user.Actif            = false;
        user.DateModification = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task PurgeAsync(long userId)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (user.Statut != StatutUtilisateur.ARCHIVE)
            throw new InvalidOperationException("Seul un compte archivé peut être purgé.");

        var deps = await GetDependenciesAsync(userId);
        if (deps.ADesDonneesMetier)
            throw new InvalidOperationException(
                $"Purge impossible : {deps.TotalReferences} donnée(s) métier sont rattachées à ce compte. " +
                "L'historique de l'entreprise doit être préservé.");

        foreach (var (table, colonne) in new[]
                 {
                     ("AuthAuditLogs", "UserId"), ("LoginHistory", "UserId"),
                     ("EmailOtps", "UserId"), ("UserMfaSettings", "UserId"),
                     ("UtilisateurStatuts", "UtilisateurId"), ("AuditLogs", "UtilisateurId"),
                 })
        {
            await SupprimerTechniqueAsync(table, colonne, userId);
        }

        db.Utilisateurs.Remove(user);
        await db.SaveChangesAsync();
    }
}
