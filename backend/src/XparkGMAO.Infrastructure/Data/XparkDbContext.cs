using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.IntelligenceArtificielle;
using XparkGMAO.Core.Entities.Reporting;
using XparkGMAO.Core.Entities.FrontOffice;
using XparkGMAO.Core.Entities.Dashboard;
using XparkGMAO.Core.Entities.GestionEquipements;
using XparkGMAO.Core.Entities.Chat;

namespace XparkGMAO.Infrastructure.Data;

/// <summary>
/// DbContext principal de l'application XPARK GMAO
/// </summary>
public class XparkDbContext : DbContext
{
    public XparkDbContext(DbContextOptions<XparkDbContext> options) : base(options) { }

    // Security
    public DbSet<Utilisateur> Utilisateurs { get; set; } = null!;

    // Flotte
    public DbSet<Vehicule> Vehicules { get; set; } = null!;
    public DbSet<Chauffeur> Chauffeurs { get; set; } = null!;

    // Administration
    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<Employee> Employees { get; set; } = null!;
    public DbSet<Assurance> Assurances { get; set; } = null!;
    public DbSet<DocumentAdministratif> DocumentsAdministratifs { get; set; } = null!;

    // Alertes
    public DbSet<Alerte> Alertes { get; set; } = null!;

    // Finance
    public DbSet<Facture> Factures { get; set; } = null!;
    public DbSet<Carburant> Carburants { get; set; } = null!;
    public DbSet<Source> Sources { get; set; } = null!;

    // Maintenance
    public DbSet<OrdreTravail> OrdresTravail { get; set; } = null!;
    public DbSet<Intervention> Interventions { get; set; } = null!;
    public DbSet<InterventionPiece> InterventionPieces { get; set; } = null!;
    public DbSet<PieceRechange> PiecesRechange { get; set; } = null!;
    public DbSet<CalendarEvent> CalendarEvents { get; set; } = null!;
    public DbSet<Attachment> Attachments { get; set; } = null!;
    public DbSet<Commentaire> Commentaires { get; set; } = null!;
    public DbSet<HistoriqueStatutOT> HistoriqueStatutsOT { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    // Operations
    public DbSet<Mission> Missions { get; set; } = null!;
    public DbSet<XparkGMAO.Core.Entities.GestionEquipements.Equipement> Equipements { get; set; } = null!;
    public DbSet<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement> MouvementsEquipements { get; set; } = null!;
    public DbSet<XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement> InspectionsEquipements { get; set; } = null!;
    public DbSet<XparkGMAO.Core.Entities.GestionEquipements.NoteEquipement> NotesEquipements { get; set; } = null!;
    public DbSet<XparkGMAO.Core.Entities.GestionEquipements.ContratFournisseur> ContratsFournisseurs { get; set; } = null!;

    // Intelligence Artificielle
    public DbSet<TrajetCalcule> TrajetsCalcules { get; set; } = null!;
    public DbSet<PredictionPanne> PredictionsPannes { get; set; } = null!;
    public DbSet<CalculateurPrixTrajetIA> CalculateursPrixTrajet { get; set; } = null!;

    // Front Office
    public DbSet<Reservation> Reservations { get; set; } = null!;
    public DbSet<Devis> Devis { get; set; } = null!;
    public DbSet<DemandeService> DemandesServices { get; set; } = null!;
    public DbSet<NotificationClient> NotificationsClients { get; set; } = null!;

    // Reporting
    public DbSet<TableauDeBord> TableauxDeBord { get; set; } = null!;
    public DbSet<KPI> KPIs { get; set; } = null!;
    public DbSet<RapportIA> RapportsIA { get; set; } = null!;

    // Chat
    public DbSet<Conversation> Conversations { get; set; } = null!;
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; } = null!;
    public DbSet<Message> ChatMessages { get; set; } = null!;
    public DbSet<MessageReaction> MessageReactions { get; set; } = null!;
    public DbSet<UtilisateurStatut> UtilisateurStatuts { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(XparkDbContext).Assembly);
    }
}
