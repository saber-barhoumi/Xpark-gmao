using System.ComponentModel.DataAnnotations;

namespace XparkGMAO.Core.Entities.Dashboard
{
    public class KPI
    {
        [Key]
        public long IdKPI { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nom { get; set; }

        [Required]
        public double Valeur { get; set; }

        [MaxLength(50)]
        public string Unite { get; set; }

        public double? Objectif { get; set; }

        public TendanceKPI Tendance { get; set; }

        public DateTime DateCalcul { get; set; }

        public CategorieKPI Categorie { get; set; }

        /// <summary>
        /// Icône à afficher (classe Remix Icon)
        /// </summary>
        [MaxLength(100)]
        public string Icone { get; set; }

        /// <summary>
        /// Couleur du KPI (success, warning, danger, info, primary)
        /// </summary>
        [MaxLength(50)]
        public string Couleur { get; set; }

        /// <summary>
        /// Description courte du KPI
        /// </summary>
        [MaxLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Code unique du KPI pour le calcul automatique
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string CodeKPI { get; set; }

        /// <summary>
        /// Données additionnelles en JSON (pour graphiques)
        /// </summary>
        public string DonneesJson { get; set; }

        // Propriétés calculées
        public double PourcentageObjectif => Objectif.HasValue && Objectif.Value > 0 
            ? Math.Round((Valeur / Objectif.Value) * 100, 2) 
            : 0;

        public bool ObjectifAtteint => Objectif.HasValue && Valeur >= Objectif.Value;
    }
}
