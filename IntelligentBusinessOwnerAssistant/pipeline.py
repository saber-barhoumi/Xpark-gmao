"""IBOA processing pipeline (FICHE §2.1) :

Event Receiver → Context Enricher → Analyzer/Scorer → Aggregator
→ Message Formatter → Delivery Engine → Audit Logger
"""

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

import delivery
import formatters
import scorer
import storage
from aggregator import Aggregator
from models import Alert, BusinessEvent, ScoredEvent

logger = logging.getLogger("iboa.pipeline")

aggregator = Aggregator()

BATCH_FLUSH_INTERVAL_S = int(__import__("os").getenv("IBOA_BATCH_INTERVAL_MIN", "60")) * 60


def _in_quiet_hours(prefs) -> bool:
    hour = datetime.now().hour
    start, end = prefs.quietHoursStart, prefs.quietHoursEnd
    return (start <= hour or hour < end) if start > end else (start <= hour < end)


def normalize(routing_key: str, payload: dict) -> BusinessEvent:
    """Accepts full standard events (§3.1) AND raw internal payloads
    (ex: messages de l'OptimisateurFlotteIA) — normalise vers le modèle standard."""
    if "eventType" in payload and "eventData" in payload:
        payload.setdefault("eventId", f"evt-{uuid.uuid4().hex[:12]}")
        payload.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        return BusinessEvent(**payload)

    # Payload brut → encapsuler
    return BusinessEvent(
        eventId=f"evt-{uuid.uuid4().hex[:12]}",
        timestamp=datetime.now(timezone.utc),
        eventType=routing_key,
        severity="LOW",
        sourceService=payload.get("sourceService", "internal"),
        eventData={k: v for k, v in payload.items()
                   if isinstance(v, (str, int, float, bool))},
    )


def process_event(event: BusinessEvent) -> ScoredEvent:
    """Full pipeline for one event. Returns the scored event."""
    started = time.monotonic()

    # ── Context Enricher (§7.2-2): fréquence du même problème sur le même objet
    obj_key = scorer.object_key(event)
    try:
        similar = storage.count_similar_events(event.eventType, obj_key, days=7)
        if similar and "similarEventsLast7Days" not in event.context:
            event.context["similarEventsLast7Days"] = similar
    except Exception:
        logger.exception("Enrichissement historique échoué — best effort (§9.1)")

    # ── Analyzer & Scorer (§5.1)
    scored = scorer.score_event(event)
    storage.save_event(scored, obj_key)

    # ── Aggregator (§5.2)
    prefs = storage.get_preferences()
    sent_today = storage.alerts_sent_today_count()
    decision = aggregator.decide(scored, obj_key, sent_today, prefs)
    storage.audit(None, "DECISION", {
        "eventId": event.eventId, "eventType": event.eventType,
        "score": scored.criticityScore, "classification": scored.classification,
        "decision": decision})

    if decision == "SUPPRESS_DUPLICATE":
        _record_alert(scored, "NONE", "SUPPRESSED", "", "")
    elif decision == "DAILY_REPORT_ONLY":
        pass  # l'événement est en base, il apparaîtra dans le rapport quotidien
    elif decision == "BATCH":
        _record_alert(scored, "BATCH_EMAIL", "BATCHED", prefs.email, "")
    elif decision == "SEND_NOW" and prefs.enabled:
        _deliver_now(scored, prefs)

    elapsed_ms = (time.monotonic() - started) * 1000
    logger.info("Événement %s traité en %.0f ms → score %d (%s), décision %s",
                event.eventType, elapsed_ms, scored.criticityScore,
                scored.classification, decision)
    return scored


def _deliver_now(scored: ScoredEvent, prefs) -> None:
    quiet = _in_quiet_hours(prefs)

    # WhatsApp : CRITIQUE (score >= seuil) — pendant les heures calmes,
    # seul le CRITIQUE passe (FICHE §7.3 quietHours)
    if scored.criticityScore >= prefs.whatsappThreshold:
        body = formatters.format_whatsapp(scored)
        status, retries, err = delivery.send_whatsapp(prefs.whatsappNumber, body)
        _record_alert(scored, "WHATSAPP", status, prefs.whatsappNumber, body,
                      retries, err)

    # Email : IMPORTANT et plus (hors heures calmes, sauf CRITIQUE)
    if scored.criticityScore >= prefs.emailThreshold:
        if quiet and scored.classification != "CRITIQUE":
            _record_alert(scored, "EMAIL", "BATCHED", prefs.email,
                          "(reporté — heures calmes)")
            aggregator.batch_queue.append(scored)
        else:
            subject, html = formatters.format_email(scored)
            status, retries, err = delivery.send_email(prefs.email, subject, html)
            _record_alert(scored, "EMAIL", status, prefs.email,
                          f"{subject}\n{html}", retries, err)


def _record_alert(scored: ScoredEvent, channel: str, status: str,
                  recipient: str, content: str,
                  retries: int = 0, error: Optional[str] = None) -> None:
    alert = Alert(
        alertId=f"alr-{uuid.uuid4().hex[:12]}",
        eventId=scored.event.eventId,
        criticityScore=scored.criticityScore,
        alertStatus=status,
        recipient=recipient,
        deliveryChannel=channel,
        messageContent=content[:4000],
        sentAt=datetime.now(timezone.utc) if status in ("SENT", "SENT_SIMULATED") else None,
        retryCount=retries,
        failureReason=error)
    storage.save_alert(alert)
    storage.audit(alert.alertId, status, {"channel": channel, "score": scored.criticityScore})


# ── Batch horaire (FICHE §5.2 R3) ────────────────────────────────────────────

def flush_batch() -> int:
    """Envoie le résumé groupé des événements NORMAL en attente."""
    batch = aggregator.drain_batch()
    if not batch:
        return 0
    prefs = storage.get_preferences()
    subject, html = formatters.format_batch_email(batch)
    status, retries, err = delivery.send_email(prefs.email, subject, html)
    for scored in batch:
        _record_alert(scored, "BATCH_EMAIL", status, prefs.email, subject, retries, err)
    logger.info("Batch horaire envoyé: %d événements regroupés (%s)", len(batch), status)
    return len(batch)


def start_batch_scheduler() -> threading.Thread:
    def loop():
        while True:
            time.sleep(BATCH_FLUSH_INTERVAL_S)
            try:
                flush_batch()
            except Exception:
                logger.exception("Flush batch échoué")

    t = threading.Thread(target=loop, name="batch-scheduler", daemon=True)
    t.start()
    return t
