using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Finance.API.Entities;

[Table("Factures")]
public class Facture
{
    [Key] public long IdFacture { get; set; }
    public string NumeroFacture { get; set; } = string.Empty;
    [Column("DateEmission")] public DateTime DateFacture { get; set; }
    public DateTime? DateEcheance { get; set; }
    [Column("MontantHT")] public double Montant { get; set; }
    // Colonne NOT NULL en base : doit être renseignée à la création (HT × taux)
    public double MontantTVA { get; set; }
    public double MontantTTC { get; set; }
    public double TauxTVA { get; set; } = 19;
    [Column("Notes")] public string? Description { get; set; }
    public StatutFacture Statut { get; set; } = StatutFacture.EN_ATTENTE;
    public DateTime? DatePaiement { get; set; }
    [NotMapped] public string? MotifAnnulation { get; set; }
    public long ClientId { get; set; }
    public long? MissionId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
}

// ── Projections LECTURE SEULE de la base partagée (pattern du projet) ────────
// Servent uniquement à enrichir les DTOs (nom du client sur la facture,
// référence de mission) — la propriété des données reste à IAM.API / Mission.API.

[Table("Utilisateurs")]
public class UtilisateurRef
{
    [Key] public long IdUtilisateur { get; set; }
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public string? Email { get; set; }
}

[Table("Missions")]
public class MissionRef
{
    [Key] public long IdMission { get; set; }
    public string? VilleDepart { get; set; }
    public string? VilleArrivee { get; set; }
    public string? Destination { get; set; }
}
