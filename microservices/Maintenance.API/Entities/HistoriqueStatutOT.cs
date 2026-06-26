namespace Maintenance.API.Entities;

public class HistoriqueStatutOT
{
    public long      Id             { get; set; }
    public long      OrdreTravailId { get; set; }
    public string    AncienStatut   { get; set; } = string.Empty;
    public string    NouveauStatut  { get; set; } = string.Empty;
    public string?   Commentaire    { get; set; }
    public long?     UtilisateurId  { get; set; }
    public DateTime  DateChangement { get; set; } = DateTime.UtcNow;

    public OrdreTravail OrdreTravail { get; set; } = null!;
}
