using System.Text.Json;

namespace Mission.API.DTOs;

/// <summary>
/// Trigger for an OptimisateurFlotteIA run. The backoffice sends the available
/// vehicles (Fleet.API) and drivers (IAM.API) it fetched with the admin's JWT;
/// Mission.API adds its own pending missions + 7-day history, then publishes
/// the event on RabbitMQ.
/// Vehicles/drivers are passed through verbatim (JsonElement) — their shape is
/// owned by the optimizer's Pydantic contract, not by this service.
/// </summary>
public class OptimizeRequestDto
{
    public List<JsonElement> Vehicles { get; set; } = [];
    public List<JsonElement> Drivers  { get; set; } = [];
}
