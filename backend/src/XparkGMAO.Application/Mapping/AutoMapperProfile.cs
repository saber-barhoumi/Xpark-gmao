using AutoMapper;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Entities.FrontOffice;

namespace XparkGMAO.Application.Mapping;

/// <summary>
/// Profil AutoMapper pour tous les mappings entité ↔ DTO
/// </summary>
public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // ===== VEHICULE =====
        CreateMap<Vehicule, VehiculeResponseDto>()
            .ForMember(d => d.TypeVehicule, o => o.MapFrom(s => s.TypeVehicule.ToString()))
            .ForMember(d => d.TypeCarburant, o => o.MapFrom(s => s.TypeCarburant.ToString()))
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString()));

        CreateMap<CreateVehiculeDto, Vehicule>();
        CreateMap<UpdateVehiculeDto, Vehicule>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<AssuranceDto, Assurance>();
        CreateMap<DocumentAdministratifDto, DocumentAdministratif>();

        // ===== CHAUFFEUR =====
        CreateMap<Chauffeur, ChauffeurResponseDto>()
            .ForMember(d => d.CategoriePermis, o => o.MapFrom(s => s.CategoriePermis.ToString()))
            .ForMember(d => d.Disponibilite, o => o.MapFrom(s => s.Disponibilite.ToString()));

        // ===== CLIENT =====
        CreateMap<Client, ClientResponseDto>();
        CreateMap<CreateClientDto, Client>();

        // ===== MISSION =====
        CreateMap<Mission, MissionResponseDto>()
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.VehiculeImmatriculation, o => o.MapFrom(s => s.Vehicule != null ? s.Vehicule.Immatriculation : null))
            .ForMember(d => d.ChauffeurNom, o => o.MapFrom(s => s.Employee != null ? $"{s.Employee.Prenom} {s.Employee.Name}" : null));

        CreateMap<CreateMissionDto, Mission>();
        CreateMap<UpdateMissionDto, Mission>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // ===== INTERVENTION =====
        CreateMap<Intervention, InterventionResponseDto>()
            .ForMember(d => d.TypeIntervention, o => o.MapFrom(s => s.TypeIntervention.ToString()))
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.VehiculeImmatriculation, o => o.MapFrom(s => s.Vehicule != null ? s.Vehicule.Immatriculation : null));

        // ===== FACTURE =====
        CreateMap<Facture, FactureResponseDto>()
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.ClientNom, o => o.MapFrom(s => s.Client != null ? $"{s.Client.Prenom} {s.Client.Nom}" : null));

        // ===== ALERTE =====
        CreateMap<Alerte, AlerteResponseDto>()
            .ForMember(d => d.TypeAlerte, o => o.MapFrom(s => s.TypeAlerte.ToString()))
            .ForMember(d => d.Priorite, o => o.MapFrom(s => s.Priorite.ToString()))
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.EquipementId, o => o.MapFrom(s => s.EquipementId))
            .ForMember(d => d.NomEquipement, o => o.MapFrom(s => s.Equipement != null ? s.Equipement.Nom : null))
            .ForMember(d => d.MissionId, o => o.MapFrom(s => s.MissionId))
            .ForMember(d => d.ReferenceMission, o => o.MapFrom(s => s.Mission != null ? s.Mission.ObjetMission : null))
            .ForMember(d => d.EntiteReference, o => o.MapFrom(s => s.EntiteReference));

        // ===== RESERVATION =====
        CreateMap<Reservation, ReservationResponseDto>()
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString()))
            .ForMember(d => d.ClientNom, o => o.MapFrom(s => s.Client != null ? $"{s.Client.Prenom} {s.Client.Nom}" : null))
            .ForMember(d => d.VehiculeImmatriculation, o => o.MapFrom(s => s.Vehicule != null ? s.Vehicule.Immatriculation : null));

        CreateMap<CreateReservationDto, Reservation>();
    }
}
