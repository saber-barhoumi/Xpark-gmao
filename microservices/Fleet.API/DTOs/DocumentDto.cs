using XparkGMAO.Shared.Enums;

namespace Fleet.API.DTOs;

public record CreateDocumentDto(
    TypeDocument TypeDocument, string NumeroDocument, DateTime DateEmission,
    DateTime DateExpiration, string? Autorite, long VehiculeId
);

public record DocumentDto(
    long IdDocument, string TypeDocument, string NumeroDocument,
    DateTime DateEmission, DateTime DateExpiration, string? Autorite, long VehiculeId
);
