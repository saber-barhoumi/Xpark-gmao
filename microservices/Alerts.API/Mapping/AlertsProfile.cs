using Alerts.API.DTOs;
using Alerts.API.Entities;
using AutoMapper;

namespace Alerts.API.Mapping;

public class AlertsProfile : Profile
{
    public AlertsProfile()
    {
        CreateMap<Alerte, AlerteResponseDto>()
            .ForMember(d => d.TypeAlerte,              o => o.MapFrom(s => s.TypeAlerte.ToString()))
            .ForMember(d => d.Priorite,                o => o.MapFrom(s => s.Priorite.ToString()))
            .ForMember(d => d.Statut,                  o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.VehiculeImmatriculation, o => o.Ignore());
    }
}
