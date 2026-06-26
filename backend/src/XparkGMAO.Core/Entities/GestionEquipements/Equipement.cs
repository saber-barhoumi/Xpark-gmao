using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Entities.GestionEquipements
{
    public class Equipement
    {
        public long IdEquipement { get; set; }

        public string Nom { get; set; } = string.Empty;

        /// <summary>Format : EQ-2024-0001</summary>
        public string CodeInventaire { get; set; } = string.Empty;

        public TypeEquipement Type { get; set; }

        public CategorieEquipement Categorie { get; set; }

        public EtatEquipement Etat { get; set; } = EtatEquipement.Neuf;

        public string? Marque { get; set; }

        public string? Modele { get; set; }

        public string? NumeroSerie { get; set; }
        public string? Fournisseur { get; set; }
        public string? ImageUrl { get; set; }
        public string? DocumentsUrlsJson { get; set; } // JSON list of strings

        public DateTime? DateAchat { get; set; }                  // UTC

        public decimal? PrixAchat { get; set; }

        public DateTime? DateFinGarantie { get; set; }            // UTC

        /// <summary>Durée de vie théorique en mois</summary>
        public int DureeVieTheoriqueEnMois { get; set; }

        public int NombreUtilisations { get; set; } = 0;

        public decimal HeuresUtilisation { get; set; } = 0;

        /// <summary>Seuil en nb de missions → état Usé</summary>
        public int? SeuilUsureUtilisations { get; set; }

        /// <summary>Seuil en nb de missions → état À remplacer</summary>
        public int? SeuilRemplacementUtilisations { get; set; }

        /// <summary>Null si Mobile (pool partagé)</summary>
        public long? VehiculeId { get; set; }

        public Vehicule? Vehicule { get; set; }

        public ICollection<MouvementEquipement> Mouvements { get; set; } = new List<MouvementEquipement>();
        public ICollection<InspectionEquipement> Inspections { get; set; } = new List<InspectionEquipement>();
        public ICollection<NoteEquipement> Notes { get; set; } = new List<NoteEquipement>();
        public ICollection<ContratFournisseur> Contrats { get; set; } = new List<ContratFournisseur>();

        public string? NotesGenerales { get; set; }

        public bool Actif { get; set; } = true;

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        public DateTime DateModification { get; set; } = DateTime.UtcNow;
    }
}
