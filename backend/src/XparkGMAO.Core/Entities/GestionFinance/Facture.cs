using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.Core.Entities.GestionFinance;

/// <summary>
/// Statut d'une facture
/// </summary>
public enum StatutFacture
{
    BROUILLON,
    EMISE,
    PAYEE,
    ANNULEE,
    EN_RETARD
}

/// <summary>
/// Entité représentant une facture
/// </summary>
public class Facture
{
    public long IdFacture { get; set; }
    public string NumeroFacture { get; set; } = string.Empty;
    public DateTime DateEmission { get; set; }
    public DateTime? DateEcheance { get; set; }
    public DateTime? DatePaiement { get; set; }
    public double MontantHT { get; set; }
    public double MontantTVA { get; set; }
    public double MontantTTC { get; set; }
    public double TauxTVA { get; set; } = 19.0;
    public StatutFacture Statut { get; set; } = StatutFacture.BROUILLON;
    public string? ModePaiement { get; set; }
    public string? Notes { get; set; }
    public long? ClientId { get; set; }
    public long? MissionId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Client? Client { get; set; }
    public Mission? Mission { get; set; }
}
