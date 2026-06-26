namespace XparkGMAO.Core.Entities.GestionMaintenance
{
    /// <summary>
    /// Représente une pièce jointe (image, PDF, etc.) pour un ordre de travail.
    /// </summary>
    public class Attachment
    {
        public long Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public long Taille { get; set; }
        public string Type { get; set; } = string.Empty; // Mime type or extension
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relation
        public long OrdreId { get; set; }
        public OrdreTravail Ordre { get; set; } = null!;
    }
}
