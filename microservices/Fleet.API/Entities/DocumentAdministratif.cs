using XparkGMAO.Shared.Enums;

namespace Fleet.API.Entities;

public class DocumentAdministratif
{
    public long         IdDocument     { get; set; }
    public TypeDocument TypeDocument   { get; set; }
    public string       NumeroDocument { get; set; } = string.Empty;
    public DateTime     DateEmission   { get; set; }
    public DateTime     DateExpiration { get; set; }
    public string?      Autorite       { get; set; }
    public string?      FichierPath    { get; set; }
    public string?      Observations   { get; set; }
    public long         VehiculeId     { get; set; }
    public DateTime     DateCreation   { get; set; } = DateTime.UtcNow;

    public Vehicule Vehicule { get; set; } = null!;
}
