namespace Maintenance.API.Entities;

public class InterventionPiece
{
    public long         IdInterventionPiece { get; set; }
    public long         InterventionId      { get; set; }
    public long         PieceId             { get; set; }
    public int          Quantite            { get; set; }
    public double       PrixUnitaire        { get; set; }

    public Intervention  Intervention { get; set; } = null!;
    public PieceRechange Piece        { get; set; } = null!;
}
