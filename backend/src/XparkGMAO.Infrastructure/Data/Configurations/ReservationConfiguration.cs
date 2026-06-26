using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.FrontOffice;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.HasKey(r => r.IdReservation);

        builder.Property(r => r.Destination).HasMaxLength(300);
        builder.Property(r => r.Observations).HasMaxLength(1000);

        builder.Property(r => r.Statut).HasConversion<string>();

        builder.HasOne(r => r.Vehicule)
               .WithMany()
               .HasForeignKey(r => r.VehiculeId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable("Reservations");
    }
}

public class DevisConfiguration : IEntityTypeConfiguration<Devis>
{
    public void Configure(EntityTypeBuilder<Devis> builder)
    {
        builder.HasKey(d => d.IdDevis);

        builder.Property(d => d.NumeroDevis).IsRequired().HasMaxLength(50);
        builder.Property(d => d.Description).HasMaxLength(2000);
        builder.Property(d => d.Conditions).HasMaxLength(2000);

        builder.HasIndex(d => d.NumeroDevis).IsUnique();

        builder.Property(d => d.Statut).HasConversion<string>();

        builder.ToTable("Devis");
    }
}

public class DemandeServiceConfiguration : IEntityTypeConfiguration<DemandeService>
{
    public void Configure(EntityTypeBuilder<DemandeService> builder)
    {
        builder.HasKey(d => d.IdDemande);

        builder.Property(d => d.Description).IsRequired().HasMaxLength(2000);
        builder.Property(d => d.Reponse).HasMaxLength(2000);

        builder.Property(d => d.TypeDemande).HasConversion<string>();
        builder.Property(d => d.Statut).HasConversion<string>();

        builder.ToTable("DemandesServices");
    }
}

public class NotificationClientConfiguration : IEntityTypeConfiguration<NotificationClient>
{
    public void Configure(EntityTypeBuilder<NotificationClient> builder)
    {
        builder.HasKey(n => n.IdNotification);

        builder.Property(n => n.Message).IsRequired().HasMaxLength(1000);
        builder.Property(n => n.Type).HasConversion<string>();

        builder.ToTable("NotificationsClients");
    }
}
