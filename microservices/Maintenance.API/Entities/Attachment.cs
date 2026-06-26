namespace Maintenance.API.Entities;

public class Attachment
{
    public long         Id          { get; set; }
    public long         OrdreId     { get; set; }
    public string       Nom         { get; set; } = string.Empty;
    public string       Url         { get; set; } = string.Empty;
    public long         Taille      { get; set; }
    public string       Type        { get; set; } = string.Empty;
    public DateTime     CreatedAt   { get; set; } = DateTime.UtcNow;

    public OrdreTravail OrdreTravail { get; set; } = null!;
}
