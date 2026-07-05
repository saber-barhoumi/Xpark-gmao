"""Event Analyzer & Scorer (FICHE §5.1 + §7.2-3).

CRITICITÉ = Base(eventType) + Modificateurs(contexte, impact, fréquence, sévérité)
Classification : >=85 CRITIQUE · 60-84 IMPORTANT · 30-59 NORMAL · 0-29 INFO
"""

from typing import List, Tuple

from models import BusinessEvent, ScoredEvent

# Base scores per event type (FICHE §2.2 — 40+ types)
BASE_SCORES = {
    # FLOTTE
    "xpark.fleet.vehicle-breakdown":       70,
    "xpark.fleet.maintenance-due":         45,
    "xpark.fleet.insurance-expired":       60,
    "xpark.fleet.inspection-expired":      60,
    "xpark.fleet.fuel-anomaly":            50,
    "xpark.fleet.vehicle-added":           20,
    "xpark.fleet.vehicle-retired":         35,
    "xpark.fleet.low-readiness":           65,
    # MISSIONS
    "xpark.mission.task-completed":        15,
    "xpark.mission.task-delayed":          55,
    "xpark.mission.task-failed":           75,
    "xpark.mission.task-cancelled":        50,
    "xpark.mission.high-workload":         60,
    "xpark.mission.low-completion-rate":   65,
    # CLIENTS
    "xpark.client.new-client":             30,
    "xpark.client.client-lost":            70,
    "xpark.client.client-upgraded":        35,
    "xpark.client.frequent-complaints":    60,
    "xpark.client.inactive":               35,
    "xpark.client.new-review":             25,
    # FINANCE
    "xpark.finance.new-revenue":           20,
    "xpark.finance.major-expense":         55,
    "xpark.finance.budget-exceeded":       70,
    "xpark.finance.unpaid-invoice":        55,
    "xpark.finance.cash-flow-critical":    90,
    "xpark.finance.profit-decreased":      80,
    "xpark.finance.daily-summary":         10,
    # RH
    "xpark.hr.employee-hired":             25,
    "xpark.hr.employee-departed":          55,
    "xpark.hr.contract-expires":           45,
    "xpark.hr.high-absences":              50,
    "xpark.hr.low-productivity":           45,
    "xpark.hr.promotion-eligible":         30,
    "xpark.hr.probation-ends":             35,
    # OPÉRATIONS
    "xpark.operations.team-overload":      60,
    "xpark.operations.significant-delay":  55,
    "xpark.operations.communication-issue":45,
    "xpark.operations.resource-shortage":  65,
    # IA INSIGHTS
    "xpark.ai.breakdown-prediction":       65,
    "xpark.ai.fuel-anomaly-detected":      55,
    "xpark.ai.maintenance-schedule":       40,
    "xpark.ai.customer-churn-risk":        60,
    "xpark.ai.cost-optimization":          35,
    "xpark.ai.performance-bottleneck":     50,
    # Événements internes des services IA existants (flux xpark.ai)
    "xpark.optimization.plan-generated":       15,
    "xpark.missions.ready-for-optimization":    5,
}

DEFAULT_BASE = 30

SEVERITY_BONUS = {"LOW": 0, "MEDIUM": 0, "HIGH": 10, "CRITICAL": 20}


def _clamp(v: int) -> int:
    return max(1, min(100, v))


def classify(score: int) -> str:
    if score >= 85:
        return "CRITIQUE"
    if score >= 60:
        return "IMPORTANT"
    if score >= 30:
        return "NORMAL"
    return "INFO"


def _num(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def score_event(event: BusinessEvent) -> ScoredEvent:
    """Computes criticality with an explainable breakdown (FICHE §5.1)."""
    data, ctx = event.eventData, event.context
    breakdown: List[Tuple[str, int]] = []

    base = BASE_SCORES.get(event.eventType, DEFAULT_BASE)
    breakdown.append((f"Base {event.eventType}", base))
    score = base

    # Sévérité déclarée par le service source
    sev = SEVERITY_BONUS.get(event.severity.upper(), 0)
    if sev:
        breakdown.append((f"Sévérité {event.severity}", sev))
        score += sev

    # +20 si mission active impactée
    if data.get("currentMission") or data.get("missionImpacted") or ctx.get("serviceImpact") == "CRITICAL":
        breakdown.append(("Mission active impactée", 20))
        score += 20

    # +15 si client PREMIUM/VIP
    if str(ctx.get("clientImportance", "")).upper() in ("PREMIUM", "VIP"):
        breakdown.append(("Client PREMIUM/VIP", 15))
        score += 15

    # +10 si impact financier > 500 TND
    amount = max(_num(data.get("estimatedRepairCost")), _num(data.get("amount")),
                 _num(data.get("cost")), _num(data.get("coutTotal")))
    if amount > 500:
        breakdown.append((f"Impact financier {amount:.0f} TND > 500", 10))
        score += 10

    # +5 si récurrence (3+ événements similaires ce mois / 7 jours)
    freq = max(int(_num(ctx.get("similarEventsLast7Days"))),
               int(_num(ctx.get("sameObjectEventsThisMonth"))))
    if freq >= 3:
        breakdown.append((f"Récurrence ({freq} événements similaires)", 5))
        score += 5

    # Cas particuliers FICHE §5.1
    if event.eventType == "xpark.finance.profit-decreased":
        if _num(data.get("changePercent")) < -20:
            breakdown.append(("Baisse > 20%", 15))
            score += 15
        if _num(data.get("cashPosition"), 1e9) < 5000:
            breakdown.append(("Cash flow < 5000 TND", 20))
            score += 20
    if event.eventType == "xpark.client.new-client":
        if _num(data.get("contractMonthlyValue")) > 5000:
            breakdown.append(("Contrat > 5000 TND/mois", 15))
            score += 15
        if data.get("strategic"):
            breakdown.append(("Client stratégique", 20))
            score += 20

    final = _clamp(score)
    return ScoredEvent(
        event=event,
        criticityScore=final,
        classification=classify(final),
        scoreBreakdown=[f"{label}: +{pts}" if pts >= 0 else f"{label}: {pts}"
                        for label, pts in breakdown],
    )


def object_key(event: BusinessEvent) -> str:
    """Identifies the business object for deduplication (FICHE §5.2 R1)."""
    data = event.eventData
    for key in ("vehicleId", "vehiculeId", "missionId", "clientId", "employeeId",
                "invoiceId", "batchId"):
        if data.get(key) is not None:
            return f"{key}={data[key]}"
    return "global"
