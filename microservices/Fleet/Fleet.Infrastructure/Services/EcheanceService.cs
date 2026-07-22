using Fleet.Application.DTOs;
using Fleet.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Infrastructure.Services;

/// <summary>
/// Projection en lecture seule des échéances de flotte : fusionne les documents
/// administratifs (visite technique, carte grise, vignette…) et les assurances
/// actives en une seule liste triée par date d'expiration.
/// Deux requêtes SQL au total, quel que soit le nombre de véhicules — c'est tout
/// l'intérêt par rapport à un appel « par véhicule » côté client.
/// </summary>
public class EcheanceService(FleetDbContext context) : IEcheanceService
{
    public async Task<IEnumerable<EcheanceDto>> GetEcheancesAsync(DateTime? start, DateTime? end)
    {
        // Npgsql exige des DateTime en UTC pour les colonnes « timestamp with time zone ».
        var from = Normaliser(start);
        var to   = Normaliser(end);

        // ── Documents administratifs ──────────────────────────────────────────
        var docsQuery = context.DocumentsAdministratifs
            .AsNoTracking()
            .Include(d => d.Vehicule)
            .AsQueryable();

        if (from.HasValue) docsQuery = docsQuery.Where(d => d.DateExpiration >= from.Value);
        if (to.HasValue)   docsQuery = docsQuery.Where(d => d.DateExpiration <= to.Value);

        var documents = await docsQuery.ToListAsync();

        // ── Assurances (seules les polices actives portent une échéance) ──────
        var assurancesQuery = context.Assurances
            .AsNoTracking()
            .Include(a => a.Vehicule)
            .Where(a => a.Actif)
            .AsQueryable();

        if (from.HasValue) assurancesQuery = assurancesQuery.Where(a => a.DateFin >= from.Value);
        if (to.HasValue)   assurancesQuery = assurancesQuery.Where(a => a.DateFin <= to.Value);

        var assurances = await assurancesQuery.ToListAsync();

        var aujourdhui = DateTime.UtcNow.Date;

        var echeances = documents.Select(d => new EcheanceDto(
                Source:          "DOCUMENT",
                RefId:           d.IdDocument,
                Type:            d.TypeDocument.ToString(),
                Libelle:         $"{Humaniser(d.TypeDocument.ToString())} — {d.Vehicule.Immatriculation}",
                Reference:       d.NumeroDocument,
                DateExpiration:  d.DateExpiration,
                JoursRestants:   (int)(d.DateExpiration.Date - aujourdhui).TotalDays,
                VehiculeId:      d.VehiculeId,
                Immatriculation: d.Vehicule.Immatriculation,
                Marque:          d.Vehicule.Marque,
                Modele:          d.Vehicule.Modele))
            .Concat(assurances.Select(a => new EcheanceDto(
                Source:          "ASSURANCE",
                RefId:           a.IdAssurance,
                Type:            "ASSURANCE",
                Libelle:         $"Assurance {a.Compagnie} — {a.Vehicule.Immatriculation}",
                Reference:       a.NumeroPolice,
                DateExpiration:  a.DateFin,
                JoursRestants:   (int)(a.DateFin.Date - aujourdhui).TotalDays,
                VehiculeId:      a.VehiculeId,
                Immatriculation: a.Vehicule.Immatriculation,
                Marque:          a.Vehicule.Marque,
                Modele:          a.Vehicule.Modele)))
            .OrderBy(e => e.DateExpiration)
            .ToList();

        return echeances;
    }

    private static DateTime? Normaliser(DateTime? d)
        => d is null ? null : DateTime.SpecifyKind(d.Value, DateTimeKind.Utc);

    /// <summary>VISITE_TECHNIQUE → « Visite technique ».</summary>
    private static string Humaniser(string type)
    {
        var mots = type.Split('_', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(' ', mots.Select((m, i) =>
            i == 0 ? char.ToUpperInvariant(m[0]) + m[1..].ToLowerInvariant()
                   : m.ToLowerInvariant()));
    }
}
