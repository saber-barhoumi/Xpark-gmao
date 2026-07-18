using AutoMapper;
using Finance.Application.DTOs;
using Finance.Domain.Entities;

namespace Finance.Application.Mapping;

public class FinanceProfile : Profile
{
    public FinanceProfile()
    {
        CreateMap<Facture, FactureResponseDto>()
            .ForMember(d => d.Statut,          o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.ClientNom,        o => o.Ignore())
            .ForMember(d => d.ClientPrenom,     o => o.Ignore())
            .ForMember(d => d.ClientEmail,      o => o.Ignore())
            .ForMember(d => d.MissionReference, o => o.Ignore());
    }
}
