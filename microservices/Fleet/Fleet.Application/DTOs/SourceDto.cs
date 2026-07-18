using XparkGMAO.Shared.Enums;

namespace Fleet.Application.DTOs;

public record CreateSourceDto(
    string NomSource, TypeSource TypeSource, string? Adresse, string? Ville,
    double? Longitude, double? Latitude, double? PrixMoyen, double? RemiseFiotte, string? CodeCarte
);

public record UpdateSourceDto(
    string? NomSource, string? TypeSource, string? Adresse, string? Ville,
    double? Longitude, double? Latitude, double? PrixMoyen, double? RemiseFiotte,
    string? CodeCarte, bool? Actif
);

public class SourceDto
{
    public long     IdSource            { get; init; }
    public string   NomSource           { get; init; } = string.Empty;
    public string   TypeSource          { get; init; } = string.Empty;
    public string?  Adresse             { get; init; }
    public string?  Ville               { get; init; }
    public double?  Longitude           { get; init; }
    public double?  Latitude            { get; init; }
    public double?  PrixMoyen           { get; init; }
    public double?  RemiseFiotte        { get; init; }
    public string?  CodeCarte           { get; init; }
    public bool     Actif               { get; init; }
    public DateTime DateCreation        { get; init; }
    public int      NombreConsommations { get; set; }
}
