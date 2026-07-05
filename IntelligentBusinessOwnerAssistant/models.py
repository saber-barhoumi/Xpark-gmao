"""Pydantic models for IBOA — mirrors FICHE §3.1 (standard event) and §7.3 (schema)."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Incoming event (FICHE §3.1) ───────────────────────────────────────────────

class BusinessEvent(BaseModel):
    eventId: str
    timestamp: datetime
    eventType: str                              # RabbitMQ routing key (xpark.fleet.…)
    severity: str = "MEDIUM"                    # LOW | MEDIUM | HIGH | CRITICAL
    sourceService: str = "unknown"
    sourceUserId: Optional[str] = None
    eventData: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ── Scored event ──────────────────────────────────────────────────────────────

class ScoredEvent(BaseModel):
    event: BusinessEvent
    criticityScore: int                         # 1-100 (FICHE §5.1)
    classification: str                         # CRITIQUE | IMPORTANT | NORMAL | INFO
    scoreBreakdown: List[str]                   # explainability of the score


# ── Alert (FICHE §7.3 TABLE Alerts) ──────────────────────────────────────────

class Alert(BaseModel):
    alertId: str
    eventId: str
    criticityScore: int
    alertStatus: str                            # PENDING | SENT | SENT_SIMULATED | FAILED | SUPPRESSED | BATCHED
    recipient: str = ""
    deliveryChannel: str                        # WHATSAPP | EMAIL | BATCH_EMAIL | NONE
    messageContent: str = ""
    sentAt: Optional[datetime] = None
    retryCount: int = 0
    failureReason: Optional[str] = None


# ── Owner preferences (FICHE §7.3 TABLE UserAlertPreferences) ────────────────

class OwnerPreferences(BaseModel):
    ownerName: str = "Propriétaire XPARK"
    whatsappNumber: str = ""                    # ex: +216XXXXXXXX
    email: str = ""
    whatsappThreshold: int = 85                 # score >= → WhatsApp (CRITIQUE)
    emailThreshold: int = 60                    # score >= → Email (IMPORTANT)
    quietHoursStart: int = 22                   # 22h → 07h : WhatsApp seulement si CRITIQUE
    quietHoursEnd: int = 7
    maxAlertsPerDay: int = 20                   # fatigue guard (FICHE §5.2 R4)
    enabled: bool = True


# ── Test event shorthand (POST /test-event) ──────────────────────────────────

class TestEventRequest(BaseModel):
    eventType: str = "xpark.fleet.vehicle-breakdown"
    severity: str = "HIGH"
    eventData: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
