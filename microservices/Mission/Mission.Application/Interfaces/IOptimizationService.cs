using Mission.Application.DTOs;

namespace Mission.Application.Interfaces;

/// <summary>Cas d'usage OptimisateurFlotteIA — extrait de OptimizationService.cs
/// (Clean Architecture : le contrat appartient à l'Application).</summary>
public interface IOptimizationService
{
    /// <summary>Publishes xpark.missions.ready-for-optimization; returns the batchId to poll.</summary>
    Task<string> RequestOptimizationAsync(OptimizeRequestDto dto);

    /// <summary>Plan JSON received on xpark.optimization.plan-generated, or null while pending.</summary>
    string? GetPlan(string batchId);
}
