namespace Alerts.API.DTOs;

public class VehiculeAlertDto
{
    public long     IdVehicule                      { get; set; }
    public string   Immatriculation                 { get; set; } = string.Empty;
    public DateTime? DateAssurance                  { get; set; }
    public DateTime? DateVignette                   { get; set; }
    public DateTime? DateVisiteTechnique            { get; set; }
    public double?  KilometrageActuel               { get; set; }
    public double?  KilometrageProchaineMaintenance { get; set; }
}
