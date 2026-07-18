namespace Mission.Domain.Entities;

/// <summary>
/// Position GPS temps réel envoyée par l'application XPARK Driver (téléphone du
/// chauffeur) pendant une mission. Historisée (une ligne par « ping ») ; le
/// front-office client consomme la dernière position pour animer le camion.
///
/// Boucle : téléphone chauffeur → POST /api/tracking/ping → LivePositions
///          → GET /api/tracking/mission/{id}/live → carte client.
/// </summary>
public class LivePosition
{
    public long      IdPosition  { get; set; }
    public long      MissionId   { get; set; }
    public long      DriverId    { get; set; }   // IdUtilisateur du chauffeur (claim JWT)
    public long?     VehiculeId  { get; set; }
    public double    Latitude    { get; set; }
    public double    Longitude   { get; set; }
    public double?   SpeedKmh    { get; set; }   // vitesse instantanée
    public double?   Heading     { get; set; }   // cap 0..360 (direction de conduite)
    public double?   Accuracy    { get; set; }   // précision GPS (m)
    public DateTime  RecordedAt  { get; set; }   // horodatage côté appareil
    public DateTime  ReceivedAt  { get; set; } = DateTime.UtcNow; // horodatage serveur
}
