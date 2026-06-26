using Fleet.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fleet.API.Data;

public class FleetDbContext(DbContextOptions<FleetDbContext> options) : DbContext(options)
{
    public DbSet<Vehicule>              Vehicules               => Set<Vehicule>();
    public DbSet<Source>                Sources                 => Set<Source>();
    public DbSet<Carburant>             Carburants              => Set<Carburant>();
    public DbSet<Assurance>             Assurances              => Set<Assurance>();
    public DbSet<DocumentAdministratif> DocumentsAdministratifs => Set<DocumentAdministratif>();
    public DbSet<Equipement>            Equipements             => Set<Equipement>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.HasDefaultSchema("fleet");

        mb.Entity<Vehicule>(e =>
        {
            e.ToTable("Vehicules");
            e.HasKey(v => v.IdVehicule);
            e.HasIndex(v => v.Immatriculation).IsUnique();
            e.HasIndex(v => v.NumeroChassis).IsUnique();
            e.Property(v => v.Statut).HasConversion<string>();
            e.Property(v => v.TypeCarburant).HasConversion<string>();
            e.Property(v => v.TypeVehicule).HasConversion<string>();
            e.HasMany(v => v.Assurances).WithOne(a => a.Vehicule).HasForeignKey(a => a.VehiculeId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(v => v.Documents).WithOne(d => d.Vehicule).HasForeignKey(d => d.VehiculeId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(v => v.Carburants).WithOne(c => c.Vehicule).HasForeignKey(c => c.VehiculeId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(v => v.Equipements).WithOne(eq => eq.Vehicule).HasForeignKey(eq => eq.VehiculeId).OnDelete(DeleteBehavior.SetNull);
        });

        mb.Entity<Assurance>(e =>
        {
            e.ToTable("Assurances");
            e.HasKey(a => a.IdAssurance);
            e.HasIndex(a => a.NumeroPolice).IsUnique();
        });

        mb.Entity<DocumentAdministratif>(e =>
        {
            e.ToTable("DocumentsAdministratifs");
            e.HasKey(d => d.IdDocument);
            e.Property(d => d.TypeDocument).HasConversion<string>();
        });

        mb.Entity<Source>(e =>
        {
            e.ToTable("Sources");
            e.HasKey(s => s.IdSource);
            e.Property(s => s.TypeSource).HasConversion<string>();
        });

        mb.Entity<Carburant>(e =>
        {
            e.ToTable("Carburants");
            e.HasKey(c => c.IdCarburant);
            e.HasOne(c => c.Source).WithMany(s => s.ConsommationsCarburant)
             .HasForeignKey(c => c.SourceId).IsRequired(false);
        });

        mb.Entity<Equipement>(e =>
        {
            e.ToTable("Equipements");
            e.HasKey(eq => eq.IdEquipement);
            e.HasIndex(eq => eq.CodeInventaire).IsUnique();
            e.Property(eq => eq.Type).HasConversion<string>();
            e.Property(eq => eq.Categorie).HasConversion<string>();
            e.Property(eq => eq.Etat).HasConversion<string>();
        });

        base.OnModelCreating(mb);
    }
}
