namespace Mission.API.Entities;

/// <summary>
/// Ticket de support créé par un client depuis le portail frontoffice.
/// Statuts : OUVERT → EN_COURS (pris en charge) → RESOLU / FERME.
/// </summary>
public class SupportTicket
{
    public long      IdTicket            { get; set; }
    public long      ClientIdUtilisateur { get; set; }
    public string?   ClientNom           { get; set; }   // dénormalisé (affichage backoffice)
    public string    Sujet               { get; set; } = string.Empty;
    public string    Categorie           { get; set; } = "AUTRE";   // MISSION, FACTURATION, TECHNIQUE, AUTRE
    public string    Message             { get; set; } = string.Empty;
    public string    Statut              { get; set; } = "OUVERT";  // OUVERT, EN_COURS, RESOLU, FERME
    public string?   Reponse             { get; set; }   // réponse du support (staff)
    public long?     MissionId           { get; set; }   // mission concernée (optionnel)
    public DateTime  DateCreation        { get; set; } = DateTime.UtcNow;
    public DateTime  DateMaj             { get; set; } = DateTime.UtcNow;
}
