using AutoMapper;
using Maintenance.Application.DTOs;
using Maintenance.Domain.Entities;

namespace Maintenance.Application.Mapping;

public class MaintenanceProfile : Profile
{
    public MaintenanceProfile()
    {
        CreateMap<Intervention, InterventionResponseDto>()
            .ForMember(d => d.TypeIntervention,        o => o.MapFrom(s => s.TypeIntervention.ToString()))
            .ForMember(d => d.Statut,                  o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.VehiculeImmatriculation, o => o.Ignore());
    }
}
