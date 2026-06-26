using XparkGMAO.Core.Entities.GestionMaintenance;

namespace XparkGMAO.Core.Interfaces.Services
{
    public interface ICalendarService
    {
        Task<IEnumerable<CalendarEvent>> GetEventsAsync(long userId, DateTime? start, DateTime? end);
        Task<CalendarEvent> GetEventByIdAsync(long id);
        Task<CalendarEvent> CreateEventAsync(long userId, CreateEventDto dto);
        Task<CalendarEvent> UpdateEventAsync(long id, UpdateEventDto dto);
        Task DeleteEventAsync(long id);
    }

    public class CreateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }
        public DateTime Start { get; set; }
        public DateTime? End { get; set; }
        public string? TypeEvenement { get; set; }
        public long? RefId { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateEventDto : CreateEventDto
    {
        public long Id { get; set; }
    }
}
