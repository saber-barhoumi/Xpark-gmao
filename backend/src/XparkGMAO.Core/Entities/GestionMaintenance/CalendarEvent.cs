using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionMaintenance
{
    /// <summary>
    /// Entité représentant un événement dans le calendrier (Intervention, OT, Mission, etc.)
    /// </summary>
    public class CalendarEvent
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }  // bg-warning, bg-success, bg-info, etc.
        public DateTime Start { get; set; }
        public DateTime? End { get; set; }
        public string? TypeEvenement { get; set; } // INTERVENTION, ORDRE, MISSION, PREVENTIF
        public long? RefId { get; set; }  // ID de l'objet lié
        public string? Description { get; set; }
        
        public long UserId { get; set; }
        public Utilisateur User { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
