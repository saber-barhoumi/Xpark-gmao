using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.Interfaces.Services;
using System.Security.Claims;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CalendarController : ControllerBase
    {
        private readonly ICalendarService _calendarService;

        public CalendarController(ICalendarService calendarService)
        {
            _calendarService = calendarService;
        }

        [HttpGet("events")]
        public async Task<IActionResult> GetEvents(
            [FromQuery] DateTime? start,
            [FromQuery] DateTime? end)
        {
            var userId = GetUserId();
            var events = await _calendarService.GetEventsAsync(userId, start, end);
            
            // Map to response DTO to match frontend expectation
            var response = events.Select(e => new {
                id = e.Id.ToString(),
                title = e.Title,
                category = e.Category,
                start = e.Start.ToString("o"),
                end = e.End?.ToString("o"),
                typeEvenement = e.TypeEvenement,
                refId = e.RefId,
                description = e.Description
            });
            
            return Ok(response);
        }

        [HttpPost("events")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
            var userId = GetUserId();
            var ev = await _calendarService.CreateEventAsync(userId, dto);
            return Ok(new {
                id = ev.Id.ToString(),
                title = ev.Title,
                category = ev.Category,
                start = ev.Start.ToString("o"),
                end = ev.End?.ToString("o"),
                typeEvenement = ev.TypeEvenement,
                refId = ev.RefId,
                description = ev.Description
            });
        }

        [HttpPut("events/{id}")]
        public async Task<IActionResult> UpdateEvent(long id, [FromBody] UpdateEventDto dto)
        {
            var ev = await _calendarService.UpdateEventAsync(id, dto);
            return Ok(new {
                id = ev.Id.ToString(),
                title = ev.Title,
                category = ev.Category,
                start = ev.Start.ToString("o"),
                end = ev.End?.ToString("o"),
                typeEvenement = ev.TypeEvenement,
                refId = ev.RefId,
                description = ev.Description
            });
        }

        [HttpDelete("events/{id}")]
        public async Task<IActionResult> DeleteEvent(long id)
        {
            await _calendarService.DeleteEventAsync(id);
            return NoContent();
        }

        private long GetUserId() =>
            long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}
