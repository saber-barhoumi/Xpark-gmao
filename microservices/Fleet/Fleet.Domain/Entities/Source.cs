using XparkGMAO.Shared.Enums;

namespace Fleet.Domain.Entities;

public class Source
{
    public long      IdSource     { get; set; }
    public string    NomSource    { get; set; } = string.Empty;
    public TypeSource TypeSource  { get; set; }
    public string?   Adresse      { get; set; }
    public string?   Ville        { get; set; }
    public double?   Longitude    { get; set; }
    public double?   Latitude     { get; set; }
    public double?   PrixMoyen    { get; set; }
    public double?   RemiseFiotte { get; set; }
    public string?   CodeCarte    { get; set; }
    public bool      Actif        { get; set; } = true;
    public DateTime  DateCreation { get; set; } = DateTime.UtcNow;

    public ICollection<Carburant> ConsommationsCarburant { get; set; } = [];
}
