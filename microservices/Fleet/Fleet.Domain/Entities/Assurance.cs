namespace Fleet.Domain.Entities;

public class Assurance
{
    public long     IdAssurance      { get; set; }
    public string   Compagnie        { get; set; } = string.Empty;
    public string   NumeroPolice     { get; set; } = string.Empty;
    public DateTime DateDebut        { get; set; }
    public DateTime DateFin          { get; set; }
    public double   Prime            { get; set; }
    public string   TypeAssurance    { get; set; } = string.Empty;
    public string?  ContactCompagnie { get; set; }
    public string?  Observations     { get; set; }
    public bool     Actif            { get; set; } = true;
    public long     VehiculeId       { get; set; }
    public DateTime DateCreation     { get; set; } = DateTime.UtcNow;

    public Vehicule Vehicule { get; set; } = null!;
}
