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
