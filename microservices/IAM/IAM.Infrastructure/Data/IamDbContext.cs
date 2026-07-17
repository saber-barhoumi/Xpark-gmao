using IAM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IAM.Infrastructure.Data;

public class IamDbContext(DbContextOptions<IamDbContext> options) : DbContext(options)
{
    public DbSet<Utilisateur> Utilisateurs => Set<Utilisateur>();
    public DbSet<Chauffeur>   Chauffeurs   => Set<Chauffeur>();
    public DbSet<Client>      Clients      => Set<Client>();
    public DbSet<Employee>    Employees    => Set<Employee>();

    // ── MFA & sécurité (tables créées au démarrage — SQL idempotent) ──
    public DbSet<UserMfaSettings>   MfaSettings   => Set<UserMfaSettings>();
    public DbSet<EmailOtp>          EmailOtps     => Set<EmailOtp>();
    public DbSet<LoginHistoryEntry> LoginHistory  => Set<LoginHistoryEntry>();
    public DbSet<AuthAuditLog>      AuthAuditLogs => Set<AuthAuditLog>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Utilisateur>(e =>
        {
            e.ToTable("Utilisateurs");
            e.HasKey(u => u.IdUtilisateur);
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
            e.HasDiscriminator<string>("TypeUtilisateur")
             .HasValue<Utilisateur>("Utilisateur")
             .HasValue<Chauffeur>("Chauffeur")
             .HasValue<Client>("Client");
        });

        mb.Entity<Chauffeur>(e =>
        {
            e.Property(c => c.NumeroPermis).HasMaxLength(50);
            e.Property(c => c.CategoriePermis).HasConversion<string>();
            e.Property(c => c.Disponibilite).HasConversion<string>();
        });

        mb.Entity<Client>(e =>
        {
            e.Property(c => c.NomSociete).HasMaxLength(200);
        });

        mb.Entity<Employee>(e =>
        {
            e.ToTable("Employees");
            e.HasKey(em => em.IdEmployee);
            e.Property(em => em.NumeroMatricule).IsRequired().HasMaxLength(50);
            e.HasIndex(em => em.NumeroMatricule).IsUnique();
            e.Property(em => em.Post).HasConversion<string>();
            e.Property(em => em.Service).HasConversion<string>();
            e.Property(em => em.Statut).HasConversion<string>();
            e.Property(em => em.CategoriePermis).HasConversion<string>();
            e.Property(em => em.Specialty).HasConversion<string>();
            e.Property(em => em.Level).HasConversion<string>();
        });

        mb.Entity<UserMfaSettings>(e =>
        {
            e.ToTable("UserMfaSettings");
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.UserId).IsUnique();
        });

        mb.Entity<EmailOtp>(e =>
        {
            e.ToTable("EmailOtps");
            e.HasKey(o => o.Id);
            e.HasIndex(o => new { o.UserId, o.CreatedAt });
        });

        mb.Entity<LoginHistoryEntry>(e =>
        {
            e.ToTable("LoginHistory");
            e.HasKey(h => h.Id);
            e.HasIndex(h => new { h.UserId, h.LoggedInAt });
        });

        mb.Entity<AuthAuditLog>(e =>
        {
            e.ToTable("AuthAuditLogs");
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.UserId, a.CreatedAt });
        });

        base.OnModelCreating(mb);
    }
}
