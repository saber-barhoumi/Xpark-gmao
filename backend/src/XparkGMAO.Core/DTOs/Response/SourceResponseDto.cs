namespace XparkGMAO.Core.DTOs.Response;

public class SourceResponseDto
{
    public long IdSource { get; set; }
    public string NomSource { get; set; } = string.Empty;
    public string TypeSource { get; set; } = string.Empty;
    public string? Adresse { get; set; }
    public string? Ville { get; set; }
    public double? Longitude { get; set; }
    public double? Latitude { get; set; }
    public double? PrixMoyen { get; set; }
    public double? RemiseFiotte { get; set; }
    public string? CodeCarte { get; set; }
    public bool Actif { get; set; }
    public DateTime DateCreation { get; set; }
    public int NombreConsommations { get; set; }
}
