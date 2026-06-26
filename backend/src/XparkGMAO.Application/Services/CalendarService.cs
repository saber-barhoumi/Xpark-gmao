using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services
{
    public class CalendarService : ICalendarService
    {
        private readonly XparkDbContext _context;

        public CalendarService(XparkDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CalendarEvent>> GetEventsAsync(long userId, DateTime? start, DateTime? end)
        {
            var query = _context.CalendarEvents
                .Where(e => e.UserId == userId);

            if (start.HasValue)
                query = query.Where(e => e.Start >= start.Value);

            if (end.HasValue)
                query = query.Where(e => e.Start <= end.Value);

            return await query.OrderBy(e => e.Start).ToListAsync();
        }

        public async Task<CalendarEvent> GetEventByIdAsync(long id)
        {
            return await _context.CalendarEvents.FindAsync(id) 
                ?? throw new KeyNotFoundException($"Événement {id} introuvable");
        }

        public async Task<CalendarEvent> CreateEventAsync(long userId, CreateEventDto dto)
        {
            var ev = new CalendarEvent
            {
                Title = dto.Title,
                Category = dto.Category,
                Start = dto.Start,
                End = dto.End,
                TypeEvenement = dto.TypeEvenement,
                RefId = dto.RefId,
                Description = dto.Description,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CalendarEvents.Add(ev);
            await _context.SaveChangesAsync();
            return ev;
        }

        public async Task<CalendarEvent> UpdateEventAsync(long id, UpdateEventDto dto)
        {
            var ev = await _context.CalendarEvents.FindAsync(id);
            if (ev == null) throw new KeyNotFoundException($"Événement {id} introuvable");

            ev.Title = dto.Title;
            ev.Category = dto.Category;
            ev.Start = dto.Start;
            ev.End = dto.End;
            ev.TypeEvenement = dto.TypeEvenement;
            ev.RefId = dto.RefId;
            ev.Description = dto.Description;

            await _context.SaveChangesAsync();
            return ev;
        }

        public async Task DeleteEventAsync(long id)
        {
            var ev = await _context.CalendarEvents.FindAsync(id);
            if (ev != null)
            {
                _context.CalendarEvents.Remove(ev);
                await _context.SaveChangesAsync();
            }
        }
    }
}
