using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionAdministrative;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class UtilisateurConfiguration : IEntityTypeConfiguration<Utilisateur>
{
    public void Configure(EntityTypeBuilder<Utilisateur> builder)
    {
        builder.HasKey(u => u.IdUtilisateur);

        builder.Property(u => u.Nom).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Prenom).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(200);
        builder.Property(u => u.MotDePasse).IsRequired().HasMaxLength(500);
        builder.Property(u => u.Telephone).HasMaxLength(30);
        builder.Property(u => u.RefreshToken).HasMaxLength(500);

        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.Role).HasConversion<string>();

        // TPH (Table Per Hierarchy) - tous les types dans une seule table
        builder.HasDiscriminator<string>("TypeUtilisateur")
               .HasValue<Utilisateur>("Utilisateur")
               .HasValue<Chauffeur>("Chauffeur")
               .HasValue<Client>("Client");

        builder.ToTable("Utilisateurs");
    }
}

public class ChauffeurInheritanceConfiguration : IEntityTypeConfiguration<Chauffeur>
{
    public void Configure(EntityTypeBuilder<Chauffeur> builder)
    {
        builder.Property(c => c.NumeroPermis).HasMaxLength(50);
        builder.Property(c => c.Photo).HasMaxLength(500);
        builder.Property(c => c.CategoriePermis).HasConversion<string>();
        builder.Property(c => c.Disponibilite).HasConversion<string>();
    }
}

public class ClientInheritanceConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.Property(c => c.NomSociete).HasMaxLength(200);
        builder.Property(c => c.SecteurActivite).HasMaxLength(100);
        builder.Property(c => c.Adresse).HasMaxLength(300);
        builder.Property(c => c.Ville).HasMaxLength(100);
        builder.Property(c => c.CodePostal).HasMaxLength(20);
        builder.Property(c => c.Pays).HasMaxLength(100);
        builder.Property(c => c.NumeroFiscal).HasMaxLength(50);
        builder.Property(c => c.SiteWeb).HasMaxLength(200);

        builder.HasMany(c => c.Factures)
               .WithOne(f => f.Client)
               .HasForeignKey(f => f.ClientId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Reservations)
               .WithOne(r => r.Client)
               .HasForeignKey(r => r.ClientId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Devis)
               .WithOne(d => d.Client)
               .HasForeignKey(d => d.ClientId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
