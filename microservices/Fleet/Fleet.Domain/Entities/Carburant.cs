namespace Fleet.Domain.Entities;

public class Carburant
{
    public long     IdCarburant     { get; set; }
    public DateTime DateRemplissage { get; set; }
    public double   Quantite        { get; set; }
    public double   PrixUnitaire    { get; set; }
    public double   MontantTotal    { get; set; }
    public double   Kilometrage     { get; set; }
    public string?  Station         { get; set; }
    public string?  NumeroBon       { get; set; }
    public string   TypeCarburant   { get; set; } = "Diesel";
    public long     VehiculeId      { get; set; }
    public long?    ChauffeurId     { get; set; }
    public long?    SourceId        { get; set; }
    public string?  JustificatifUrl { get; set; }
    public DateTime DateCreation    { get; set; } = DateTime.UtcNow;

    public Vehicule  Vehicule { get; set; } = null!;
    public Source?   Source   { get; set; }
}
