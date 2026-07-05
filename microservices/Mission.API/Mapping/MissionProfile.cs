using AutoMapper;
using Mission.API.DTOs;
using MissionEntity = Mission.API.Entities.Mission;

namespace Mission.API.Mapping;

public class MissionProfile : Profile
{
    public MissionProfile()
    {
        CreateMap<MissionEntity, MissionResponseDto>()
            .ForMember(d => d.VehiculeImmatriculation, o => o.MapFrom(s => s.VehiculeImmatriculation))
            .ForMember(d => d.ChauffeurNom,            o => o.MapFrom(s => s.ChauffeurNom))
            .ForMember(d => d.Statut,                  o => o.MapFrom(s => s.Statut.ToString()));
    }
}
