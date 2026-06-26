using XparkGMAO.Core.DTOs;
using XparkGMAO.Core.Entities.GestionEquipements;
using XparkGMAO.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;

namespace XparkGMAO.Infrastructure.Repositories
{
    public class EquipementRepository : IEquipementRepository
    {
        private readonly XparkDbContext _ctx;

        public EquipementRepository(XparkDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<XparkGMAO.Core.Entities.GestionEquipements.Equipement?> GetByIdAsync(long id, bool includeRelations = false)
        {
            var query = _ctx.Equipements.AsQueryable();

            if (includeRelations)
            {
                query = query
                    .Include(e => e.Vehicule)
                    .Include(e => e.Mouvements)
                        .ThenInclude(m => m.Mission)
                    .Include(e => e.Mouvements)
                        .ThenInclude(m => m.Utilisateur)
                    .Include(e => e.Inspections)
                        .ThenInclude(i => i.Technicien)
                    .Include(e => e.Notes)
                        .ThenInclude(n => n.Auteur)
                    .Include(e => e.Contrats);
            }

            return await query.FirstOrDefaultAsync(e => e.IdEquipement == id && e.Actif);
        }

        public async Task<XparkGMAO.Core.Entities.GestionEquipements.Equipement?> GetByCodeInventaireAsync(string code)
            => await _ctx.Equipements.FirstOrDefaultAsync(e => e.CodeInventaire == code && e.Actif);

        public async Task<XparkGMAO.Core.DTOs.PagedResult<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetAllAsync(FilterEquipementsDto filters)
        {
            var query = _ctx.Equipements
                .Include(e => e.Vehicule)
                .Where(e => e.Actif)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filters.Type) && Enum.TryParse<XparkGMAO.Core.Entities.GestionEquipements.TypeEquipement>(filters.Type, out var type))
                query = query.Where(e => e.Type == type);

            if (!string.IsNullOrEmpty(filters.Etat) && Enum.TryParse<XparkGMAO.Core.Entities.GestionEquipements.EtatEquipement>(filters.Etat, out var etat))
                query = query.Where(e => e.Etat == etat);

            if (!string.IsNullOrEmpty(filters.Categorie) && Enum.TryParse<XparkGMAO.Core.Entities.GestionEquipements.CategorieEquipement>(filters.Categorie, out var cat))
                query = query.Where(e => e.Categorie == cat);

            if (filters.VehiculeId.HasValue)
                query = query.Where(e => e.VehiculeId == filters.VehiculeId.Value);

            if (filters.DisponiblePool == true)
            {
                var enMissionIds = await GetEquipementsEnMissionAsync();
                query = query.Where(e =>
                    e.Type == XparkGMAO.Core.Entities.GestionEquipements.TypeEquipement.Mobile &&
                    !enMissionIds.Contains(e.IdEquipement));
            }

            if (!string.IsNullOrEmpty(filters.Search))
            {
                var s = filters.Search.ToLower();
                query = query.Where(e =>
                    e.Nom.ToLower().Contains(s) ||
                    e.CodeInventaire.ToLower().Contains(s) ||
                    (e.Marque != null && e.Marque.ToLower().Contains(s)));
            }

            // Dynamic sort (System.Linq.Dynamic.Core)
            try
            {
                var sortExpr = $"{filters.SortBy} {filters.SortOrder}";
                query = query.OrderBy(sortExpr);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SORT_ERROR] Using fallback sort: {ex.Message}");
                query = query.OrderByDescending(e => e.DateCreation);
            }

            var total = await query.CountAsync();
            var data = await query
                .Skip((filters.Page - 1) * filters.Limit)
                .Take(filters.Limit)
                .ToListAsync();

            return new XparkGMAO.Core.DTOs.PagedResult<XparkGMAO.Core.Entities.GestionEquipements.Equipement>
            {
                Data = data,
                Total = total,
                Page = filters.Page,
                Limit = filters.Limit,
                TotalPages = (int)Math.Ceiling((double)total / filters.Limit)
            };
        }

        public async Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetByVehiculeAsync(long vehiculeId)
            => await _ctx.Equipements
                .Where(e => e.VehiculeId == vehiculeId && e.Actif)
                .ToListAsync();

        public async Task<List<long>> GetEquipementsEnMissionAsync()
            => await _ctx.MouvementsEquipements
                .Where(m => m.Type == XparkGMAO.Core.Entities.GestionEquipements.TypeMouvement.CheckOut && m.DateFinUtc == null)
                .Select(m => m.EquipementId)
                .ToListAsync();

        public async Task AddAsync(XparkGMAO.Core.Entities.GestionEquipements.Equipement equipement)
            => await _ctx.Equipements.AddAsync(equipement);

        public async Task UpdateAsync(XparkGMAO.Core.Entities.GestionEquipements.Equipement equipement)
        {
            equipement.DateModification = DateTime.UtcNow;
            _ctx.Equipements.Update(equipement);
        }

        public async Task DeleteAsync(long id)
        {
            var eq = await GetByIdAsync(id);
            if (eq != null)
            {
                eq.Actif = false;
                eq.Etat = EtatEquipement.HorsService;
                eq.DateModification = DateTime.UtcNow;
                _ctx.Equipements.Update(eq);
            }
        }

        public async Task<List<MouvementEquipement>> GetMouvementsOuvertsByEquipementAsync(long equipementId)
            => await _ctx.MouvementsEquipements
                .Where(m => m.EquipementId == equipementId
                    && m.Type == TypeMouvement.CheckOut
                    && m.DateFinUtc == null)
                .ToListAsync();

        public async Task<List<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement>> GetMouvementsOuvertsByMissionAsync(long missionId)
            => await _ctx.MouvementsEquipements
                .Include(m => m.Equipement)
                .Where(m =>
                    m.MissionId == missionId &&
                    m.Type      == XparkGMAO.Core.Entities.GestionEquipements.TypeMouvement.CheckOut &&
                    m.DateFinUtc == null)
                .ToListAsync();

        public async Task<XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement?> GetMouvementByIdAsync(long id)
            => await _ctx.MouvementsEquipements
                .Include(m => m.Equipement)
                .FirstOrDefaultAsync(m => m.IdMouvement == id);

        public async Task AddMouvementAsync(XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement mouvement)
            => await _ctx.MouvementsEquipements.AddAsync(mouvement);

        public async Task UpdateMouvementAsync(XparkGMAO.Core.Entities.GestionEquipements.MouvementEquipement mouvement)
            => _ctx.MouvementsEquipements.Update(mouvement);

        public async Task<XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement?> GetInspectionByIdAsync(long id)
            => await _ctx.InspectionsEquipements.FindAsync(id);

        public async Task UpdateInspectionAsync(XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement inspection)
            => _ctx.InspectionsEquipements.Update(inspection);

        public async Task AddInspectionAsync(XparkGMAO.Core.Entities.GestionEquipements.InspectionEquipement inspection)
            => await _ctx.InspectionsEquipements.AddAsync(inspection);

        public async Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetEquipementsARemplacerAsync()
            => await _ctx.Equipements
                .Where(e => e.Actif && e.Etat == XparkGMAO.Core.Entities.GestionEquipements.EtatEquipement.ARemplacer)
                .Include(e => e.Vehicule)
                .ToListAsync();

        public async Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetEquipementsGarantieExpiranteAsync(int joursAvant = 30)
        {
            var limite = DateTime.UtcNow.AddDays(joursAvant);
            return await _ctx.Equipements
                .Where(e => e.Actif &&
                            e.DateFinGarantie.HasValue &&
                            e.DateFinGarantie.Value <= limite &&
                            e.DateFinGarantie.Value >= DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task<List<XparkGMAO.Core.Entities.GestionEquipements.Equipement>> GetEquipementsRotationFaibleAsync(int moisSansUtilisation = 6)
        {
            var dateMin = DateTime.UtcNow.AddMonths(-moisSansUtilisation);
            return await _ctx.Equipements
                .Where(e => e.Actif &&
                            e.Type == XparkGMAO.Core.Entities.GestionEquipements.TypeEquipement.Mobile &&
                            e.NombreUtilisations == 0 &&
                            e.DateCreation < dateMin)
                .ToListAsync();
        }

        // Notes
        public async Task<NoteEquipement?> GetNoteByIdAsync(long id)
            => await _ctx.NotesEquipements.Include(n => n.Auteur).FirstOrDefaultAsync(n => n.IdNote == id);

        public async Task AddNoteAsync(NoteEquipement note)
            => await _ctx.NotesEquipements.AddAsync(note);

        public async Task UpdateNoteAsync(NoteEquipement note)
        {
            note.DateModification = DateTime.UtcNow;
            _ctx.NotesEquipements.Update(note);
        }

        public async Task RemoveNoteAsync(NoteEquipement note)
            => _ctx.NotesEquipements.Remove(note);

        // Contrats
        public async Task<ContratFournisseur?> GetContratByIdAsync(long id)
            => await _ctx.ContratsFournisseurs.FindAsync(id);

        public async Task AddContratAsync(ContratFournisseur contrat)
            => await _ctx.ContratsFournisseurs.AddAsync(contrat);

        public async Task UpdateContratAsync(ContratFournisseur contrat)
        {
            contrat.DateModification = DateTime.UtcNow;
            _ctx.ContratsFournisseurs.Update(contrat);
        }

        public async Task RemoveContratAsync(ContratFournisseur contrat)
            => _ctx.ContratsFournisseurs.Remove(contrat);

        public void Remove(XparkGMAO.Core.Entities.GestionEquipements.Equipement equipement)
            => _ctx.Equipements.Remove(equipement);

        public async Task SaveChangesAsync()
            => await _ctx.SaveChangesAsync();
    }
}
