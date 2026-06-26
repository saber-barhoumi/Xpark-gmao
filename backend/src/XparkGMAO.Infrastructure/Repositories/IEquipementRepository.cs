using XparkGMAO.Core.DTOs;
using XparkGMAO.Core.Entities.GestionEquipements;

namespace XparkGMAO.Infrastructure.Repositories
{
    public interface IEquipementRepository
    {
        Task<XparkGMAO.Core.Entities.GestionEquipements.Equipement?> GetByIdAsync(long id, bool includeRelations = false);
        Task<XparkGMAO.Core.Entities.GestionEquipements.Equipement?> GetByCodeInventaireAsync(string code);
        Task<XparkGMAO.Core.DTOs.PagedResult<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetAllAsync(FilterEquipementsDto filters);
        Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetByVehiculeAsync(long vehiculeId);
        Task<List<long>> GetEquipementsEnMissionAsync();   // IDs actuellement en CHECK_OUT
        Task AddAsync(XparkGMAO.Core.Entities.GestionEquipements.Equipement equipement);
        Task UpdateAsync(XparkGMAO.Core.Entities.GestionEquipements.Equipement equipement);
        Task DeleteAsync(long id);
        Task<List<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement>> GetMouvementsOuvertsByEquipementAsync(long equipementId);
        Task<List<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement>> GetMouvementsOuvertsByMissionAsync(long missionId);
        Task<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement?> GetMouvementByIdAsync(long id);
        Task AddMouvementAsync(XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement mouvement);
        Task UpdateMouvementAsync(XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement mouvement);
        Task<XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement?> GetInspectionByIdAsync(long id);
        Task UpdateInspectionAsync(XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement inspection);
        Task AddInspectionAsync(XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement inspection);
        Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetEquipementsARemplacerAsync();
        Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetEquipementsGarantieExpiranteAsync(int joursAvant = 30);
        Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetEquipementsRotationFaibleAsync(int moisSansUtilisation = 6);

        // Notes
        Task<NoteEquipement?> GetNoteByIdAsync(long id);
        Task AddNoteAsync(NoteEquipement note);
        Task UpdateNoteAsync(NoteEquipement note);
        Task RemoveNoteAsync(NoteEquipement note);

        // Contrats
        Task<ContratFournisseur?> GetContratByIdAsync(long id);
        Task AddContratAsync(ContratFournisseur contrat);
        Task UpdateContratAsync(ContratFournisseur contrat);
        Task RemoveContratAsync(ContratFournisseur contrat);

        void Remove(XparkGMAO.Core.Entities.GestionEquipements.Equipement equipement);
        Task SaveChangesAsync();
    }
}
