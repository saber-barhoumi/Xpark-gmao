namespace Maintenance.Application.DTOs;

public class CreatePieceRechangeDto
{
    public string  Reference   { get; set; } = string.Empty;
    public string  Designation { get; set; } = string.Empty;
    public string  Categorie   { get; set; } = string.Empty;
    public int     StockActuel { get; set; }
    public int     StockMinimum { get; set; }
    public int     StockMaximum { get; set; }
    public double  PrixUnitaire { get; set; }
    public string? Fournisseur  { get; set; }
    public string? ImageUrl     { get; set; }
}
