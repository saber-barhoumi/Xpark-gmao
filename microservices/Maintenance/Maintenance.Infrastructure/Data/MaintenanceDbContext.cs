using Maintenance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Maintenance.Infrastructure.Data;

public class MaintenanceDbContext(DbContextOptions<MaintenanceDbContext> options) : DbContext(options)
{
    public DbSet<Intervention>      Interventions    => Set<Intervention>();
    public DbSet<InterventionPiece> InterventionPieces => Set<InterventionPiece>();
    public DbSet<PieceRechange>     PiecesRechange   => Set<PieceRechange>();
    public DbSet<OrdreTravail>      OrdresTravail    => Set<OrdreTravail>();
    public DbSet<HistoriqueStatutOT> HistoriqueStatutsOT => Set<HistoriqueStatutOT>();
    public DbSet<Attachment>        Attachments      => Set<Attachment>();
    public DbSet<Commentaire>       Commentaires     => Set<Commentaire>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Intervention>(e =>
        {
            e.ToTable("Interventions");
            e.HasKey(i => i.IdIntervention);
            e.Property(i => i.TypeIntervention).HasConversion<string>();
            e.Property(i => i.Statut).HasConversion<string>();
            e.HasOne(i => i.OrdreTravail).WithMany(o => o.Interventions)
             .HasForeignKey(i => i.OrdreTravailId).IsRequired(false);
        });

        mb.Entity<InterventionPiece>(e =>
        {
            e.ToTable("InterventionPieces");
            e.HasKey(ip => ip.IdInterventionPiece);
            e.HasOne(ip => ip.Intervention).WithMany(i => i.InterventionPieces).HasForeignKey(ip => ip.InterventionId);
            e.HasOne(ip => ip.Piece).WithMany(p => p.InterventionPieces).HasForeignKey(ip => ip.PieceId);
        });

        mb.Entity<PieceRechange>(e =>
        {
            e.ToTable("PiecesRechange");
            e.HasKey(p => p.IdPiece);
            e.Property(p => p.Categorie).HasConversion<string>();
        });

        mb.Entity<OrdreTravail>(e =>
        {
            e.ToTable("OrdresTravail");
            e.HasKey(o => o.IdOrdreTravail);
            e.Property(o => o.Statut).HasConversion<string>();
            // Priorite is stored as integer in DB — no string conversion
        });

        mb.Entity<HistoriqueStatutOT>(e =>
        {
            e.ToTable("HistoriqueStatutsOT");
            e.HasKey(h => h.Id);
            e.HasOne(h => h.OrdreTravail).WithMany(o => o.HistoriqueStatuts).HasForeignKey(h => h.OrdreTravailId);
        });

        mb.Entity<Attachment>(e =>
        {
            e.ToTable("Attachments");
            e.HasKey(a => a.Id);
            e.HasOne(a => a.OrdreTravail).WithMany(o => o.Attachments).HasForeignKey(a => a.OrdreId);
        });

        mb.Entity<Commentaire>(e =>
        {
            e.ToTable("Commentaires");
            e.HasKey(c => c.Id);
            e.HasOne(c => c.OrdreTravail).WithMany(o => o.Commentaires).HasForeignKey(c => c.OrdreId);
        });

        base.OnModelCreating(mb);
    }
}
