using XparkGMAO.Core.DTOs;
using XparkGMAO.Core.Entities.GestionEquipements;
using XparkGMAO.Infrastructure.Repositories;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace XparkGMAO.Application.Services
{
    public class EquipementsService : IEquipementsService
    {
        private readonly IEquipementRepository _repo;
        private readonly ILogger<EquipementsService> _logger;

        public EquipementsService(
            IEquipementRepository repo,
            ILogger<EquipementsService> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task<EquipementDetailDto> CreateAsync(CreateEquipementDto dto)
        {
            var existant = await _repo.GetByCodeInventaireAsync(dto.CodeInventaire);
            if (existant != null)
                throw new InvalidOperationException($"Code inventaire '{dto.CodeInventaire}' déjà utilisé.");

            var eq = new Equipement
            {
                Nom                      = dto.Nom,
                CodeInventaire           = dto.CodeInventaire,
                Type                     = dto.Type,
                Categorie                = dto.Categorie,
                Etat                     = dto.Etat,
                Marque                   = dto.Marque,
                Modele                   = dto.Modele,
                NumeroSerie              = dto.NumeroSerie,
                Fournisseur              = dto.Fournisseur,
                ImageUrl                 = dto.ImageUrl,
                DocumentsUrlsJson        = dto.DocumentsUrls != null ? JsonSerializer.Serialize(dto.DocumentsUrls) : null,
                DateAchat                = EnsureUtc(dto.DateAchat),
                PrixAchat                = dto.PrixAchat,
                DateFinGarantie          = EnsureUtc(dto.DateFinGarantie),
                DureeVieTheoriqueEnMois  = dto.DureeVieTheoriqueEnMois,
                SeuilUsureUtilisations   = dto.SeuilUsureUtilisations,
                SeuilRemplacementUtilisations = dto.SeuilRemplacementUtilisations,
                VehiculeId               = dto.VehiculeId,
                NotesGenerales           = dto.Notes,
            };

            await _repo.AddAsync(eq);
            await _repo.SaveChangesAsync();

            return await GetByIdAsync(eq.IdEquipement);
        }

        public async Task<PagedResult<EquipementListItemDto>> GetAllAsync(FilterEquipementsDto filters)
        {
            var paged = await _repo.GetAllAsync(filters);
            return new PagedResult<EquipementListItemDto>
            {
                Data       = paged.Data.Select(MapToListItem).ToList(),
                Total      = paged.Total,
                Page       = paged.Page,
                Limit      = paged.Limit,
                TotalPages = paged.TotalPages,
            };
        }

        public async Task<EquipementDetailDto> GetByIdAsync(long id)
        {
            var eq = await _repo.GetByIdAsync(id, includeRelations: true)
                ?? throw new KeyNotFoundException($"Équipement {id} introuvable.");
            return MapToDetail(eq);
        }

        public async Task<EquipementDetailDto> UpdateAsync(long id, UpdateEquipementDto dto)
        {
            var eq = await _repo.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Équipement {id} introuvable.");

            eq.Nom                     = dto.Nom;
            eq.Type                    = dto.Type;
            eq.Categorie               = dto.Categorie;
            eq.Etat                    = dto.Etat;
            eq.Marque                  = dto.Marque;
            eq.Modele                  = dto.Modele;
            eq.NumeroSerie             = dto.NumeroSerie;
            eq.Fournisseur             = dto.Fournisseur;
            eq.ImageUrl                = dto.ImageUrl;
            eq.DocumentsUrlsJson       = dto.DocumentsUrls != null ? JsonSerializer.Serialize(dto.DocumentsUrls) : null;
            eq.DateAchat               = EnsureUtc(dto.DateAchat);
            eq.PrixAchat               = dto.PrixAchat;
            eq.DateFinGarantie         = EnsureUtc(dto.DateFinGarantie);
            eq.DureeVieTheoriqueEnMois = dto.DureeVieTheoriqueEnMois;
            eq.SeuilUsureUtilisations  = dto.SeuilUsureUtilisations;
            eq.SeuilRemplacementUtilisations = dto.SeuilRemplacementUtilisations;
            eq.VehiculeId              = dto.VehiculeId;
            eq.NotesGenerales          = dto.Notes;

            await _repo.UpdateAsync(eq);
            await _repo.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task DeleteAsync(long id)
        {
            // Vérifier si l'équipement possède des mouvements ouverts (en mission)
            var mouvementsOuverts = await _repo.GetMouvementsOuvertsByEquipementAsync(id);
            if (mouvementsOuverts.Any())
                throw new InvalidOperationException(
                    $"Impossible de désactiver cet équipement : il est actuellement utilisé dans {mouvementsOuverts.Count} mission(s) en cours.");

            await _repo.DeleteAsync(id);
            await _repo.SaveChangesAsync();
        }

        public async Task<VerificationMissionDto> VerifierEquipementsAvantMissionAsync(long vehiculeId)
        {
            var equipements = await _repo.GetByVehiculeAsync(vehiculeId);

            var fixesEtObligatoires = equipements
                .Where(e => e.Type == TypeEquipement.Fixe || e.Type == TypeEquipement.Obligatoire)
                .ToList();

            var problemes = new List<ProblemeEquipementDto>();
            var fixesOk   = new List<EquipementListItemDto>();
            var obligOk   = new List<EquipementListItemDto>();

            foreach (var eq in fixesEtObligatoires)
            {
                if (eq.Etat == EtatEquipement.HorsService)
                {
                    problemes.Add(new ProblemeEquipementDto
                    {
                        Equipement = MapToListItem(eq),
                        Raison     = $"{eq.Nom} est HORS SERVICE",
                        Bloquant   = true
                    });
                }
                else if (eq.Etat == EtatEquipement.ARemplacer)
                {
                    problemes.Add(new ProblemeEquipementDto
                    {
                        Equipement = MapToListItem(eq),
                        Raison     = $"{eq.Nom} doit être remplacé",
                        Bloquant   = eq.Type == TypeEquipement.Obligatoire
                    });
                }
                else
                {
                    if (eq.Type == TypeEquipement.Fixe)       fixesOk.Add(MapToListItem(eq));
                    if (eq.Type == TypeEquipement.Obligatoire) obligOk.Add(MapToListItem(eq));
                }
            }

            var bloquant = problemes.Any(p => p.Bloquant);

            return new VerificationMissionDto
            {
                Status                       = bloquant ? "BLOCAGE" : "OK",
                EquipementsFixesOk           = fixesOk,
                EquipementsObligatoiresOk    = obligOk,
                Problemes                    = problemes
            };
        }

        public async Task<MouvementDto> CheckOutAsync(CheckOutDto dto)
        {
            var eq = await _repo.GetByIdAsync(dto.EquipementId)
                ?? throw new KeyNotFoundException($"Équipement {dto.EquipementId} introuvable.");

            if (eq.Etat == EtatEquipement.HorsService)
                throw new InvalidOperationException($"L'équipement '{eq.Nom}' est HORS SERVICE.");

            var enMissionIds = await _repo.GetEquipementsEnMissionAsync();
            if (enMissionIds.Contains(dto.EquipementId))
                throw new InvalidOperationException($"L'équipement '{eq.Nom}' est déjà en mission.");

            var mouvement = new MouvementEquipement
            {
                Type           = TypeMouvement.CheckOut,
                EquipementId   = dto.EquipementId,
                MissionId      = dto.MissionId,
                IdUtilisateur  = dto.UserId,
                DateDebutUtc   = DateTime.UtcNow,
                Observations   = dto.Observations,
            };

            await _repo.AddMouvementAsync(mouvement);
            await _repo.SaveChangesAsync();

            return MapToMouvementDto(mouvement);
        }

        public async Task<MouvementDto> CheckInAsync(CheckInDto dto)
        {
            var mouvement = await _repo.GetMouvementByIdAsync(dto.MouvementId)
                ?? throw new KeyNotFoundException($"Mouvement {dto.MouvementId} introuvable.");

            if (mouvement.Type != TypeMouvement.CheckOut)
                throw new InvalidOperationException("Ce mouvement n'est pas un CHECK_OUT.");

            if (mouvement.DateFinUtc.HasValue)
                throw new InvalidOperationException("Ce mouvement est déjà clôturé.");

            if (!Enum.TryParse<EtatApresRetour>(dto.EtatApresRetour, out var etatRetour))
                throw new ArgumentException($"EtatApresRetour '{dto.EtatApresRetour}' invalide.");

            // Clôturer le mouvement
            mouvement.DateFinUtc      = DateTime.UtcNow;
            mouvement.EtatApresRetour = etatRetour;
            mouvement.CoutReparation  = dto.CoutReparation;
            mouvement.Observations    = dto.Observations;
            mouvement.PhotosJson      = dto.PhotosUrls != null
                                         ? JsonSerializer.Serialize(dto.PhotosUrls)
                                         : null;

            // Mettre à jour l'équipement
            var eq = mouvement.Equipement;
            eq.NombreUtilisations += 1;

            var dureeHeures = (decimal)(mouvement.DateFinUtc.Value - mouvement.DateDebutUtc).TotalHours;
            eq.HeuresUtilisation += dureeHeures;

            eq.Etat = CalculerNouvelEtat(eq, etatRetour);

            await _repo.UpdateMouvementAsync(mouvement);
            await _repo.UpdateAsync(eq);
            await _repo.SaveChangesAsync();

            return MapToMouvementDto(mouvement);
        }

        private static EtatEquipement CalculerNouvelEtat(Equipement eq, EtatApresRetour etatRetour)
        {
            if (etatRetour == EtatApresRetour.Perdu)     return EtatEquipement.HorsService;
            if (etatRetour == EtatApresRetour.Endommage)  return EtatEquipement.ARemplacer;

            if (eq.SeuilRemplacementUtilisations.HasValue && eq.NombreUtilisations >= eq.SeuilRemplacementUtilisations.Value)
                return EtatEquipement.ARemplacer;

            if (eq.SeuilUsureUtilisations.HasValue && eq.NombreUtilisations >= eq.SeuilUsureUtilisations.Value)
                return EtatEquipement.Use;

            return etatRetour switch
            {
                EtatApresRetour.Use => EtatEquipement.Use,
                EtatApresRetour.Bon => eq.Etat == EtatEquipement.Neuf ? EtatEquipement.Neuf : EtatEquipement.Bon,
                _                   => eq.Etat
            };
        }

        public async Task<InspectionDto> CreerInspectionAsync(
            long equipementId, long technicienId, InspectionCreateDto dto)
        {
            var eq = await _repo.GetByIdAsync(equipementId)
                ?? throw new KeyNotFoundException($"Équipement {equipementId} introuvable.");

            var inspection = new InspectionEquipement
            {
                EquipementId             = equipementId,
                TechnicienId             = technicienId,
                EtatConstate             = dto.EtatConstate,
                ScoreEtat                = dto.ScoreEtat,
                ChecklistJson            = dto.ChecklistJson,
                Observations             = dto.Observations,
                PhotosJson               = dto.PhotosJson,
                CoutEstimeRemplacement   = dto.CoutEstimeRemplacement,
                RecommandeRemplacement   = dto.RecommandeRemplacement,
            };

            await _repo.AddInspectionAsync(inspection);

            eq.Etat = dto.EtatConstate;
            await _repo.UpdateAsync(eq);
            await _repo.SaveChangesAsync();

            return MapToInspectionDto(inspection);
        }

        public async Task<KpiEquipementsDto> GetKpisAsync()
        {
            var paged = await _repo.GetAllAsync(new FilterEquipementsDto { Limit = 10000, Page = 1 });
            var equipements = paged.Data;

            var total = equipements.Count;
            var horsService = equipements.Count(e => e.Etat == EtatEquipement.HorsService);
            var tauxDisponibilite = total > 0 ? ((double)(total - horsService) / total) * 100 : 100;

            return new KpiEquipementsDto
            {
                TauxDisponibilite = Math.Round(tauxDisponibilite, 1),
                CoutRemplacementMoyenParCategorie = new List<CoutCategorieDto>(),
                DureeVieMoyenneVsTheorique        = new List<DureeVieDto>(),
            };
        }

        // Notes
        public async Task<NoteEquipementDto> AjouterNoteAsync(CreateNoteEquipementDto dto, long auteurId)
        {
            var note = new NoteEquipement
            {
                EquipementId      = dto.EquipementId,
                AuteurId          = auteurId,
                Priorite          = dto.Priorite,
                Contenu           = dto.Contenu,
                TagsJson          = dto.Tags != null ? JsonSerializer.Serialize(dto.Tags) : null,
                PiecesJointesJson = dto.PiecesJointes != null ? JsonSerializer.Serialize(dto.PiecesJointes) : null,
                IsEpingle         = dto.IsEpingle,
                DateCreation      = DateTime.UtcNow,
                DateModification  = DateTime.UtcNow
            };

            await _repo.AddNoteAsync(note);
            await _repo.SaveChangesAsync();

            // Reload to get Auteur name
            var nodeDb = await _repo.GetNoteByIdAsync(note.IdNote);
            return MapToNoteDto(nodeDb!);
        }

        public async Task<NoteEquipementDto> ModifierNoteAsync(long noteId, CreateNoteEquipementDto dto, long auteurId)
        {
            var note = await _repo.GetNoteByIdAsync(noteId)
                ?? throw new KeyNotFoundException($"Note {noteId} introuvable.");

            note.Priorite          = dto.Priorite;
            note.Contenu           = dto.Contenu;
            note.TagsJson          = dto.Tags != null ? JsonSerializer.Serialize(dto.Tags) : null;
            note.PiecesJointesJson = dto.PiecesJointes != null ? JsonSerializer.Serialize(dto.PiecesJointes) : null;
            note.IsEpingle         = dto.IsEpingle;

            await _repo.UpdateNoteAsync(note);
            await _repo.SaveChangesAsync();

            return MapToNoteDto(note);
        }

        public async Task SupprimerNoteAsync(long noteId)
        {
            var note = await _repo.GetNoteByIdAsync(noteId)
                ?? throw new KeyNotFoundException($"Note {noteId} introuvable.");

            await _repo.RemoveNoteAsync(note);
            await _repo.SaveChangesAsync();
        }

        // Contrats
        public async Task<ContratFournisseurDto> AjouterContratAsync(CreateContratFournisseurDto dto)
        {
            if (!Enum.TryParse<TypeContrat>(dto.Type, out var typeContrat))
                throw new ArgumentException($"Type contrat '{dto.Type}' invalide.");

            var contrat = new ContratFournisseur
            {
                EquipementId       = dto.EquipementId,
                Type               = typeContrat,
                NomFournisseur     = dto.NomFournisseur,
                NumeroContrat      = dto.NumeroContrat,
                ContactFournisseur = dto.ContactFournisseur,
                TelephoneSAV       = dto.TelephoneSAV,
                DateDebutUtc       = EnsureUtc(dto.DateDebutUtc) ?? DateTime.UtcNow,
                DateFinUtc         = EnsureUtc(dto.DateFinUtc) ?? DateTime.UtcNow,
                MontantAnnuel      = dto.MontantAnnuel,
                DocumentUrl        = dto.DocumentUrl,
                Notes              = dto.Notes,
                IsActif            = true,
                DateCreation       = DateTime.UtcNow,
                DateModification   = DateTime.UtcNow
            };

            await _repo.AddContratAsync(contrat);
            await _repo.SaveChangesAsync();

            return MapToContratDto(contrat);
        }

        public async Task<ContratFournisseurDto> ModifierContratAsync(long contratId, CreateContratFournisseurDto dto)
        {
            var contrat = await _repo.GetContratByIdAsync(contratId)
                ?? throw new KeyNotFoundException($"Contrat {contratId} introuvable.");

            if (Enum.TryParse<TypeContrat>(dto.Type, out var typeContrat))
                contrat.Type = typeContrat;

            contrat.NomFournisseur     = dto.NomFournisseur;
            contrat.NumeroContrat      = dto.NumeroContrat;
            contrat.ContactFournisseur = dto.ContactFournisseur;
            contrat.TelephoneSAV       = dto.TelephoneSAV;
            contrat.DateDebutUtc       = EnsureUtc(dto.DateDebutUtc) ?? contrat.DateDebutUtc;
            contrat.DateFinUtc         = EnsureUtc(dto.DateFinUtc) ?? contrat.DateFinUtc;
            contrat.MontantAnnuel      = dto.MontantAnnuel;
            contrat.DocumentUrl        = dto.DocumentUrl;
            contrat.Notes              = dto.Notes;

            await _repo.UpdateContratAsync(contrat);
            await _repo.SaveChangesAsync();

            return MapToContratDto(contrat);
        }

        public async Task SupprimerContratAsync(long contratId)
        {
            var contrat = await _repo.GetContratByIdAsync(contratId)
                ?? throw new KeyNotFoundException($"Contrat {contratId} introuvable.");

            await _repo.RemoveContratAsync(contrat);
            await _repo.SaveChangesAsync();
        }

        public async Task CheckOutAutomatiqueAsync(long vehiculeId, long missionId, long chauffeurId)
        {
            var equipements = await _repo.GetByVehiculeAsync(vehiculeId);
            var enMission   = await _repo.GetEquipementsEnMissionAsync();

            foreach (var eq in equipements)
            {
                // Ignorer : HorsService, déjà en mission
                if (eq.Etat == EtatEquipement.HorsService) continue;
                if (enMission.Contains(eq.IdEquipement)) continue;

                var mouvement = new MouvementEquipement
                {
                    Type           = TypeMouvement.CheckOut,
                    EquipementId   = eq.IdEquipement,
                    MissionId      = missionId,
                    IdUtilisateur  = chauffeurId,
                    DateDebutUtc   = DateTime.UtcNow,
                };

                await _repo.AddMouvementAsync(mouvement);
            }

            await _repo.SaveChangesAsync();

            _logger.LogInformation(
                "[CheckOut Auto] Mission {MissionId} — {Count} équipement(s) du véhicule {VehiculeId}",
                missionId, equipements.Count, vehiculeId);
        }

        public async Task CheckInAutomatiqueAsync(long missionId, long chauffeurId)
        {
            var mouvementsOuverts = await _repo.GetMouvementsOuvertsByMissionAsync(missionId);

            foreach (var mv in mouvementsOuverts)
            {
                mv.DateFinUtc      = DateTime.UtcNow;
                mv.EtatApresRetour = EtatApresRetour.Bon; // Default to Good
                mv.IdUtilisateur   = chauffeurId;

                await _repo.UpdateMouvementAsync(mv);

                var eq = mv.Equipement;
                if (eq != null)
                {
                    eq.NombreUtilisations += 1;

                    var dureeHeures = (decimal)(mv.DateFinUtc.Value - mv.DateDebutUtc).TotalHours;
                    eq.HeuresUtilisation += dureeHeures;

                    eq.Etat = CalculerNouvelEtat(eq, EtatApresRetour.Bon);

                    await _repo.UpdateAsync(eq);
                }
            }

            await _repo.SaveChangesAsync();

            _logger.LogInformation(
                "[CheckIn Auto] Mission {MissionId} — {Count} mouvement(s) clôturé(s)",
                missionId, mouvementsOuverts.Count);
        }

        public async Task<int> RecalculerCompteursEquipementsAsync()
        {
            // This is a more complex recalculation from all movements
            var allEquipements = await _repo.GetAllAsync(new FilterEquipementsDto { Limit = 10000 });
            int updatedCount = 0;

            foreach (var eq in allEquipements.Data)
            {
                // Logic to sum up from movements
                // We need to reload with movements to be accurate
                var eqFull = await _repo.GetByIdAsync(eq.IdEquipement, includeRelations: true);
                if (eqFull == null) continue;

                var closedMouvements = eqFull.Mouvements
                    .Where(m => m.Type == TypeMouvement.CheckOut && m.DateFinUtc.HasValue)
                    .ToList();

                eqFull.NombreUtilisations = closedMouvements.Count;
                eqFull.HeuresUtilisation  = closedMouvements.Sum(m => 
                    (decimal)(m.DateFinUtc!.Value - m.DateDebutUtc).TotalHours);

                await _repo.UpdateAsync(eqFull);
                updatedCount++;
            }

            await _repo.SaveChangesAsync();
            return updatedCount;
        }

        private static EquipementListItemDto MapToListItem(Equipement eq) => new()
        {
            Id                        = eq.IdEquipement,
            Nom                       = eq.Nom,
            CodeInventaire            = eq.CodeInventaire,
            Type                      = eq.Type.ToString(),
            Categorie                 = eq.Categorie.ToString(),
            Etat                      = eq.Etat.ToString(),
            Marque                    = eq.Marque,
            Modele                    = eq.Modele,
            NomVehicule               = eq.Vehicule?.Immatriculation, // Using immat as name if available
            ImmatriculationVehicule   = eq.Vehicule?.Immatriculation,
            NombreUtilisations        = eq.NombreUtilisations,
            HeuresUtilisation         = eq.HeuresUtilisation,
            DateFinGarantie           = eq.DateFinGarantie,
            Fournisseur               = eq.Fournisseur,
            ImageUrl                  = eq.ImageUrl,
            Actif                     = eq.Actif,
            DateCreation              = eq.DateCreation,
        };

        private static EquipementDetailDto MapToDetail(Equipement eq) => new()
        {
            Id                        = eq.IdEquipement,
            Nom                       = eq.Nom,
            CodeInventaire            = eq.CodeInventaire,
            Type                      = eq.Type.ToString(),
            Categorie                 = eq.Categorie.ToString(),
            Etat                      = eq.Etat.ToString(),
            Marque                    = eq.Marque,
            Modele                    = eq.Modele,
            NumeroSerie               = eq.NumeroSerie,
            Fournisseur               = eq.Fournisseur,
            ImageUrl                  = eq.ImageUrl,
            DocumentsUrls             = !string.IsNullOrEmpty(eq.DocumentsUrlsJson) 
                                        ? JsonSerializer.Deserialize<List<string>>(eq.DocumentsUrlsJson) ?? new()
                                        : new(),
            NomVehicule               = eq.Vehicule?.Immatriculation,
            ImmatriculationVehicule   = eq.Vehicule?.Immatriculation,
            NombreUtilisations        = eq.NombreUtilisations,
            HeuresUtilisation         = eq.HeuresUtilisation,
            DateAchat                 = eq.DateAchat,
            PrixAchat                 = eq.PrixAchat,
            DateFinGarantie           = eq.DateFinGarantie,
            DureeVieTheoriqueEnMois   = eq.DureeVieTheoriqueEnMois,
            SeuilUsureUtilisations    = eq.SeuilUsureUtilisations,
            SeuilRemplacementUtilisations = eq.SeuilRemplacementUtilisations,
            DateEstimationRemplacement = CalculerEstimationRemplacement(eq),
            NotesGenerales            = eq.NotesGenerales,
            Actif                     = eq.Actif,
            DateCreation              = eq.DateCreation,
            Mouvements                = eq.Mouvements?.Select(MapToMouvementDto).ToList() ?? new(),
            Inspections               = eq.Inspections?.Select(MapToInspectionDto).ToList() ?? new(),
            Notes                     = eq.Notes?.OrderByDescending(n => n.IsEpingle).ThenByDescending(n => n.DateCreation).Select(MapToNoteDto).ToList() ?? new(),
            Contrats                  = eq.Contrats?.Where(c => c.IsActif).OrderBy(c => c.DateFinUtc).Select(MapToContratDto).ToList() ?? new(),
        };

        private static DateTime? CalculerEstimationRemplacement(Equipement eq)
        {
            if (!eq.SeuilRemplacementUtilisations.HasValue || eq.SeuilRemplacementUtilisations == 0) return null;
            if (eq.NombreUtilisations == 0) return null;

            // Usage rate: uses per day since creation
            var ageDays = (DateTime.UtcNow - eq.DateCreation).TotalDays;
            if (ageDays < 1) ageDays = 1; // Avoid div by zero or extreme rates for brand new items

            var usageRatePerDay = (double)eq.NombreUtilisations / ageDays;
            if (usageRatePerDay <= 0) return null;

            var remainingUses = eq.SeuilRemplacementUtilisations.Value - eq.NombreUtilisations;
            if (remainingUses <= 0) return DateTime.UtcNow;

            var daysToReplacement = remainingUses / usageRatePerDay;
            return DateTime.UtcNow.AddDays(daysToReplacement);
        }

        private static MouvementDto MapToMouvementDto(MouvementEquipement m) => new()
        {
            Id              = m.IdMouvement,
            Type            = m.Type.ToString(),
            MissionId       = m.MissionId,
            ReferenceMission = m.Mission?.Destination, // Fallback if no ref
            NomUtilisateur  = m.Utilisateur?.Nom,
            DateDebutUtc    = m.DateDebutUtc,
            DateFinUtc      = m.DateFinUtc,
            EtatApresRetour = m.EtatApresRetour?.ToString(),
            CoutReparation  = m.CoutReparation,
            Observations    = m.Observations,
        };

        private static InspectionDto MapToInspectionDto(InspectionEquipement i) => new()
        {
            Id                      = i.IdInspection,
            NomTechnicien           = i.Technicien?.Nom ?? "Technicien",
            EtatConstate            = i.EtatConstate.ToString(),
            ScoreEtat               = i.ScoreEtat,
            Observations            = i.Observations,
            RecommandeRemplacement  = i.RecommandeRemplacement,
            CoutEstimeRemplacement  = i.CoutEstimeRemplacement,
            DateCreation            = i.DateCreation,
        };

        private static NoteEquipementDto MapToNoteDto(NoteEquipement n) => new()
        {
            Id               = n.IdNote,
            NomAuteur        = n.Auteur?.Nom ?? "Utilisateur",
            Priorite         = n.Priorite,
            Contenu          = n.Contenu,
            Tags             = !string.IsNullOrEmpty(n.TagsJson) ? JsonSerializer.Deserialize<List<string>>(n.TagsJson) ?? new() : new(),
            PiecesJointes    = !string.IsNullOrEmpty(n.PiecesJointesJson) ? JsonSerializer.Deserialize<List<string>>(n.PiecesJointesJson) ?? new() : new(),
            IsEpingle        = n.IsEpingle,
            DateCreation     = n.DateCreation,
            DateModification = n.DateModification
        };

        private static ContratFournisseurDto MapToContratDto(ContratFournisseur c) => new()
        {
            Id                 = c.IdContrat,
            Type               = c.Type.ToString(),
            NomFournisseur     = c.NomFournisseur,
            NumeroContrat      = c.NumeroContrat,
            ContactFournisseur = c.ContactFournisseur,
            TelephoneSAV       = c.TelephoneSAV,
            DateDebutUtc       = c.DateDebutUtc,
            DateFinUtc         = c.DateFinUtc,
            MontantAnnuel      = c.MontantAnnuel,
            DocumentUrl        = c.DocumentUrl,
            Notes              = c.Notes,
            IsActif            = c.IsActif,
            EstExpire          = c.DateFinUtc < DateTime.UtcNow,
            JoursRestants      = Math.Max(0, (int)(c.DateFinUtc - DateTime.UtcNow).TotalDays),
            DateCreation       = c.DateCreation,
        };

        private static DateTime? EnsureUtc(DateTime? dt)
        {
            if (!dt.HasValue) return null;
            if (dt.Value.Kind == DateTimeKind.Utc) return dt;
            return DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc);
        }
    }
}
