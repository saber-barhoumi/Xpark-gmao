using AutoMapper;
using Fleet.API.DTOs;
using Fleet.API.Entities;

namespace Fleet.API.Mapping;

public class FleetProfile : Profile
{
    public FleetProfile()
    {
        CreateMap<Vehicule, VehiculeDto>()
            .ForMember(d => d.TypeCarburant, o => o.MapFrom(s => s.TypeCarburant.ToString()))
            .ForMember(d => d.TypeVehicule,  o => o.MapFrom(s => s.TypeVehicule.ToString()))
            .ForMember(d => d.Statut,        o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.Photo,         o => o.MapFrom(s => s.Photo));

        CreateMap<Carburant, CarburantDto>()
            .ForMember(d => d.MontantTotal,    o => o.MapFrom(s => s.MontantTotal))
            .ForMember(d => d.TypeCarburant,   o => o.MapFrom(s => s.TypeCarburant));

        CreateMap<Source, SourceDto>()
            .ForMember(d => d.TypeSource,          o => o.MapFrom(s => s.TypeSource.ToString()))
            .ForMember(d => d.NombreConsommations, o => o.Ignore());

        CreateMap<Assurance, AssuranceDto>();

        CreateMap<DocumentAdministratif, DocumentDto>()
            .ForMember(d => d.TypeDocument, o => o.MapFrom(s => s.TypeDocument.ToString()));

        CreateMap<Equipement, EquipementDto>()
            .ForMember(d => d.Type,      o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.Categorie, o => o.MapFrom(s => s.Categorie.ToString()))
            .ForMember(d => d.Etat,      o => o.MapFrom(s => s.Etat.ToString()));
    }
}
