namespace Finance.Application.DTOs;

public class CreateFactureDto
{
    public long ClientId { get; set; }
    public long? MissionId { get; set; }
    public double Montant { get; set; }
    public double TauxTVA { get; set; } = 19;
    public string? Description { get; set; }
    public DateTime? DateEcheance { get; set; }
}

public class FactureResponseDto
{
    public long IdFacture { get; set; }
    public string NumeroFacture { get; set; } = string.Empty;
    public DateTime DateFacture { get; set; }
    public DateTime? DateEcheance { get; set; }
    public double Montant { get; set; }
    public double MontantTTC { get; set; }
    public double TauxTVA { get; set; }
    public string? Description { get; set; }
    public string Statut { get; set; } = string.Empty;
    public DateTime? DatePaiement { get; set; }
    public long ClientId { get; set; }
    public string? ClientNom { get; set; }
    public string? ClientPrenom { get; set; }
    public string? ClientEmail { get; set; }
    public long? MissionId { get; set; }
    public string? MissionReference { get; set; }
}

public class MarquerPayeeRequest { public string? MethodePaiement { get; set; } }
public class AnnulerFactureRequest { public string Motif { get; set; } = string.Empty; }
