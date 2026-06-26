using System.ComponentModel.DataAnnotations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Dashboard
{
    public class TableauDeBord
    {
        [Key]
        public long IdDashboard { get; set; }

        [Required]
        public long UtilisateurId { get; set; }
        public Utilisateur Utilisateur { get; set; }

        /// <summary>
        /// Configuration du layout (JSON avec positions des widgets)
        /// Format: { "layout": [{ "i": "kpi-1", "x": 0, "y": 0, "w": 3, "h": 2 }] }
        /// </summary>
        public string Configuration { get; set; }

        /// <summary>
        /// Liste des widgets actifs (JSON)
        /// Format: { "widgets": ["missions-actives", "cout-mensuel", "graphique-carburant"] }
        /// </summary>
        public string Widgets { get; set; }

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        public DateTime? DateModification { get; set; }

        /// <summary>
        /// Nom du dashboard (si l'utilisateur en a plusieurs)
        /// </summary>
        [MaxLength(200)]
        public string Nom { get; set; }

        /// <summary>
        /// Est-ce le dashboard par défaut ?
        /// </summary>
        public bool EstParDefaut { get; set; }
    }
}
