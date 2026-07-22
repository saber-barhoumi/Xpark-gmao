using Microsoft.EntityFrameworkCore;
using PredictionPanne.Domain.Entities;

namespace PredictionPanne.Infrastructure.Data;

/// <summary>
/// Contexte du service de prédiction sur la base partagée xpark_gmao.
///
/// Il POSSÈDE la table PredictionsPanne (écriture) et se contente de LIRE les
/// tables Vehicules et Interventions, projetées en lecture seule — même parti
/// pris que Finance avec UtilisateurRef/MissionRef.
/// </summary>
public class PredictionDbContext(DbContextOptions<PredictionDbContext> options) : DbContext(options)
{
    public DbSet<Prediction>      Predictions   => Set<Prediction>();
    public DbSet<VehiculeRef>     Vehicules     => Set<VehiculeRef>();
    public DbSet<InterventionRef> Interventions => Set<InterventionRef>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ── Table possédée par ce service ────────────────────────────────────
        mb.Entity<Prediction>(e =>
        {
            e.ToTable("PredictionsPanne");
            e.HasKey(p => p.IdPrediction);
            // Enums en texte : lisibles directement en SQL, cohérent avec le
            // reste du système (Mission.Statut, Alerte.Type…).
            e.Property(p => p.TypePanne).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.NiveauRisque).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Source).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.VersionModele).HasMaxLength(50);
            e.HasIndex(p => new { p.VehiculeId, p.DateCalcul });
        });

        // ── Projections LECTURE SEULE (jamais écrites depuis ce service) ─────
        mb.Entity<VehiculeRef>(e =>
        {
            e.ToTable("Vehicules");
            e.HasKey(v => v.IdVehicule);
            e.Metadata.SetIsTableExcludedFromMigrations(true);
        });

        mb.Entity<InterventionRef>(e =>
        {
            e.ToTable("Interventions");
            e.HasKey(i => i.IdIntervention);
            e.Property(i => i.TypeIntervention).HasConversion<string>();
            e.Property(i => i.Statut).HasConversion<string>();
            e.Metadata.SetIsTableExcludedFromMigrations(true);
        });
    }
}
