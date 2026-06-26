using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionMaintenance
{
    /// <summary>
    /// Représente un commentaire sur un ordre de travail.
    /// </summary>
    public class Commentaire
    {
        public long Id { get; set; }
        public string Contenu { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relation
        public long OrdreId { get; set; }
        public OrdreTravail Ordre { get; set; } = null!;

        public long AuteurId { get; set; }
        public Utilisateur Auteur { get; set; } = null!;
    }
}
