using System.Collections.Concurrent;

namespace Mission.API.Messaging;

/// <summary>
/// In-memory store for optimization plans received on
/// `xpark.optimization.plan-generated`. The frontend polls
/// GET /api/missions/optimize/{batchId} until its plan arrives.
/// Entries expire after 30 minutes.
/// </summary>
public class OptimizationPlanStore
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(30);
    private readonly ConcurrentDictionary<string, (DateTime StoredAt, string PlanJson)> _plans = new();

    public void Store(string batchId, string planJson)
    {
        foreach (var (key, entry) in _plans)
            if (DateTime.UtcNow - entry.StoredAt > Ttl)
                _plans.TryRemove(key, out _);

        _plans[batchId] = (DateTime.UtcNow, planJson);
    }

    public string? Get(string batchId)
        => _plans.TryGetValue(batchId, out var entry) ? entry.PlanJson : null;
}
