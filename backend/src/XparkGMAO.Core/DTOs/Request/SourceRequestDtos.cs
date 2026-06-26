using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.DTOs.Request;

public class CreateSourceDto
{
    public string NomSource { get; set; } = string.Empty;
    public TypeSource TypeSource { get; set; }
    public string? Adresse { get; set; }
    public string? Ville { get; set; }
    public double? Longitude { get; set; }
    public double? Latitude { get; set; }
    public double? PrixMoyen { get; set; }
    public double? RemiseFiotte { get; set; }
    public string? CodeCarte { get; set; }
}

public class UpdateSourceDto
{
    public string? NomSource { get; set; }
    public string? Adresse { get; set; }
    public string? Ville { get; set; }
    public double? Longitude { get; set; }
    public double? Latitude { get; set; }
    public double? PrixMoyen { get; set; }
    public double? RemiseFiotte { get; set; }
    public string? CodeCarte { get; set; }
    public bool? Actif { get; set; }
}
