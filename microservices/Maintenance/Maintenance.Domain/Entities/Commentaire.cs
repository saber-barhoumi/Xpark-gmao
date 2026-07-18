namespace Maintenance.Domain.Entities;

public class Commentaire
{
    public long      Id        { get; set; }
    public long      OrdreId   { get; set; }
    public string    Contenu   { get; set; } = string.Empty;
    public long      AuteurId  { get; set; }
    public DateTime  CreatedAt { get; set; } = DateTime.UtcNow;

    public OrdreTravail OrdreTravail { get; set; } = null!;
}
