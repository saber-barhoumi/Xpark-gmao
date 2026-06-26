using XparkGMAO.Core.Entities.GestionEquipements;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace XparkGMAO.Infrastructure.Data.Configurations
{
    public class EquipementConfiguration : IEntityTypeConfiguration<XparkGMAO.Core.Entities.GestionEquipements.Equipement>
    {
        public void Configure(EntityTypeBuilder<XparkGMAO.Core.Entities.GestionEquipements.Equipement> builder)
        {
            builder.ToTable("Equipements");
            builder.HasKey(e => e.IdEquipement);

            builder.Property(e => e.Nom).IsRequired().HasMaxLength(100);
            builder.Property(e => e.CodeInventaire).IsRequired().HasMaxLength(50);
            builder.HasIndex(e => e.CodeInventaire).IsUnique();

            builder.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(30);

            builder.Property(e => e.Categorie)
                .HasConversion<string>()
                .HasMaxLength(30);

            builder.Property(e => e.Etat)
                .HasConversion<string>()
                .HasMaxLength(30);

            builder.Property(e => e.PrixAchat).HasColumnType("numeric(10,2)");
            builder.Property(e => e.HeuresUtilisation).HasColumnType("numeric(10,2)");
            builder.Property(e => e.Fournisseur).HasMaxLength(150);
            builder.Property(e => e.ImageUrl).HasMaxLength(500);
            builder.Property(e => e.DocumentsUrlsJson).HasColumnType("text");

            // Toutes les dates sont UTC
            builder.Property(e => e.DateAchat)
                .HasColumnType("timestamp with time zone");
            builder.Property(e => e.DateFinGarantie)
                .HasColumnType("timestamp with time zone");
            builder.Property(e => e.DateCreation)
                .HasColumnType("timestamp with time zone");
            builder.Property(e => e.DateModification)
                .HasColumnType("timestamp with time zone");

            builder.HasOne(e => e.Vehicule)
                .WithMany()
                .HasForeignKey(e => e.VehiculeId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(e => e.Mouvements)
                .WithOne(m => m.Equipement)
                .HasForeignKey(m => m.EquipementId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(e => e.Inspections)
                .WithOne(i => i.Equipement)
                .HasForeignKey(i => i.EquipementId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(e => e.Notes)
                .WithOne(n => n.Equipement)
                .HasForeignKey(n => n.EquipementId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(e => e.Contrats)
                .WithOne(c => c.Equipement)
                .HasForeignKey(c => c.EquipementId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(e => e.NotesGenerales).HasColumnType("text");
        }
    }

    public class MouvementEquipementConfiguration : IEntityTypeConfiguration<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement>
    {
        public void Configure(EntityTypeBuilder<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement> builder)
        {
            builder.ToTable("MouvementsEquipements");
            builder.HasKey(m => m.IdMouvement);

            builder.Property(m => m.Type).HasConversion<string>().HasMaxLength(30);
            builder.Property(m => m.EtatApresRetour).HasConversion<string>().HasMaxLength(30);
            builder.Property(m => m.CoutReparation).HasColumnType("numeric(10,2)");

            builder.Property(m => m.DateDebutUtc).HasColumnType("timestamp with time zone");
            builder.Property(m => m.DateFinUtc).HasColumnType("timestamp with time zone");
            builder.Property(m => m.DateCreation).HasColumnType("timestamp with time zone");

            builder.HasOne(m => m.Mission)
                .WithMany()
                .HasForeignKey(m => m.MissionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(m => m.Utilisateur)
                .WithMany()
                .HasForeignKey(m => m.IdUtilisateur)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class InspectionEquipementConfiguration : IEntityTypeConfiguration<XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement>
    {
        public void Configure(EntityTypeBuilder<XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement> builder)
        {
            builder.ToTable("InspectionsEquipements");
            builder.HasKey(i => i.IdInspection);

            builder.Property(i => i.EtatConstate)
                .HasConversion<string>()
                .HasMaxLength(30);

            builder.Property(i => i.CoutEstimeRemplacement).HasColumnType("numeric(10,2)");

            builder.Property(i => i.DateCreation).HasColumnType("timestamp with time zone");

            builder.HasOne(i => i.Technicien)
                .WithMany()
                .HasForeignKey(i => i.TechnicienId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class NoteEquipementConfiguration : IEntityTypeConfiguration<NoteEquipement>
    {
        public void Configure(EntityTypeBuilder<NoteEquipement> builder)
        {
            builder.ToTable("NotesEquipements");
            builder.HasKey(n => n.IdNote);

            builder.Property(n => n.Priorite).HasMaxLength(20).HasDefaultValue("info");
            builder.Property(n => n.Contenu).IsRequired().HasColumnType("text");
            builder.Property(n => n.TagsJson).HasColumnType("text");
            builder.Property(n => n.PiecesJointesJson).HasColumnType("text");

            builder.Property(n => n.DateCreation).HasColumnType("timestamp with time zone");
            builder.Property(n => n.DateModification).HasColumnType("timestamp with time zone");

            builder.HasOne(n => n.Auteur)
                .WithMany()
                .HasForeignKey(n => n.AuteurId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class ContratFournisseurConfiguration : IEntityTypeConfiguration<ContratFournisseur>
    {
        public void Configure(EntityTypeBuilder<ContratFournisseur> builder)
        {
            builder.ToTable("ContratsFournisseurs");
            builder.HasKey(c => c.IdContrat);

            builder.Property(c => c.Type).HasConversion<string>().HasMaxLength(40);
            builder.Property(c => c.NomFournisseur).IsRequired().HasMaxLength(150);
            builder.Property(c => c.NumeroContrat).HasMaxLength(100);
            builder.Property(c => c.ContactFournisseur).HasMaxLength(200);
            builder.Property(c => c.TelephoneSAV).HasMaxLength(50);
            builder.Property(c => c.ConditionsJson).HasColumnType("text");
            builder.Property(c => c.DocumentUrl).HasMaxLength(500);
            builder.Property(c => c.Notes).HasColumnType("text");
            builder.Property(c => c.MontantAnnuel).HasColumnType("numeric(10,2)");

            builder.Property(c => c.DateDebutUtc).HasColumnType("timestamp with time zone");
            builder.Property(c => c.DateFinUtc).HasColumnType("timestamp with time zone");
            builder.Property(c => c.DateCreation).HasColumnType("timestamp with time zone");
            builder.Property(c => c.DateModification).HasColumnType("timestamp with time zone");
        }
    }
}
