namespace Maintenance.API.Entities;

public class PieceRechange
{
    public long          IdPiece                     { get; set; }
    public string        Reference                   { get; set; } = string.Empty;
    public string        Designation                 { get; set; } = string.Empty;
    public CategoriePiece Categorie                  { get; set; }
    public int           StockActuel                 { get; set; }
    public int           StockMinimum                { get; set; }
    public int           StockMaximum                { get; set; }
    public double        PrixUnitaire                { get; set; }
    public string?       Fournisseur                 { get; set; }
    public string?       Emplacement                 { get; set; }
    public string?       Description                 { get; set; }
    public string?       ImageUrl                    { get; set; }
    public bool          Actif                       { get; set; } = true;
    public DateTime      DateCreation                { get; set; } = DateTime.UtcNow;
    public DateTime?     DateDernierApprovisionnement { get; set; }

    public ICollection<InterventionPiece> InterventionPieces { get; set; } = new List<InterventionPiece>();
}
