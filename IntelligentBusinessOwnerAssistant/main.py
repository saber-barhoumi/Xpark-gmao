"""IntelligentBusinessOwnerAssistant (IBOA) — Port 5008 (FICHE §1).

Monitoring temps réel de l'entreprise : consomme les événements métier de tous
les microservices via RabbitMQ, score la criticité (1-100), agrège
intelligemment (anti-spam) et alerte le propriétaire via WhatsApp / Email /
PDF / Excel — sans qu'il ait à consulter l'application.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

import delivery
import formatters
import pipeline
import rabbitmq_consumer
import storage
from models import DeleteIdsRequest, OwnerPreferences, TestEventRequest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%H:%M:%S")
logger = logging.getLogger("iboa")

app = FastAPI(title="XparkGMAO — IntelligentBusinessOwnerAssistant", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"])


@app.on_event("startup")
def startup():
    storage.init_db()
    rabbitmq_consumer.start_consumer_thread()
    pipeline.start_batch_scheduler()
    logger.info("IBOA démarré — pipeline complet actif (receiver → scorer → aggregator → delivery)")


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "IntelligentBusinessOwnerAssistant",
        "rabbitmqConnected": rabbitmq_consumer.connected,
        "whatsappMode": "TWILIO" if delivery.whatsapp_configured() else "SIMULATION",
        "emailMode": "SMTP" if delivery.email_configured() else "SIMULATION",
    }


# ── Monitoring dashboard data ────────────────────────────────────────────────

@app.get("/events")
def get_events(limit: int = 50):
    return {"events": storage.recent_events(min(limit, 200))}


@app.post("/events/delete")
def delete_events(req: DeleteIdsRequest):
    """Suppression ciblée d'événements depuis le dashboard (sélection)."""
    count = storage.delete_events(req.ids)
    logger.info("Dashboard: %d événement(s) supprimé(s)", count)
    return {"count": count}


@app.delete("/events")
def delete_all_events():
    """Purge complète du flux d'événements (dashboard)."""
    count = storage.delete_all_events()
    logger.info("Dashboard: purge des événements (%d)", count)
    return {"count": count}


@app.get("/alerts")
def get_alerts(limit: int = 50):
    return {"alerts": storage.recent_alerts(min(limit, 200))}


@app.post("/alerts/delete")
def delete_alerts(req: DeleteIdsRequest):
    """Suppression ciblée d'alertes depuis le dashboard (sélection)."""
    count = storage.delete_alerts(req.ids)
    logger.info("Dashboard: %d alerte(s) supprimée(s)", count)
    return {"count": count}


@app.delete("/alerts")
def delete_all_alerts():
    """Purge complète de l'historique d'alertes (dashboard)."""
    count = storage.delete_all_alerts()
    logger.info("Dashboard: purge des alertes (%d)", count)
    return {"count": count}


@app.get("/stats")
def get_stats():
    return storage.stats_today()


# ── Owner preferences (FICHE §7.3) ───────────────────────────────────────────

@app.get("/preferences", response_model=OwnerPreferences)
def get_preferences():
    return storage.get_preferences()


@app.put("/preferences", response_model=OwnerPreferences)
def put_preferences(prefs: OwnerPreferences):
    storage.save_preferences(prefs)
    logger.info("Préférences mises à jour: whatsapp=%s email=%s seuils=%d/%d",
                prefs.whatsappNumber or "-", prefs.email or "-",
                prefs.whatsappThreshold, prefs.emailThreshold)
    return prefs


# ── Rapports (FICHE §4.3 / §4.4) ─────────────────────────────────────────────

@app.get("/reports/daily.pdf")
def daily_pdf():
    pdf = formatters.build_daily_pdf(
        storage.events_today(), storage.recent_alerts(100), storage.stats_today())
    return Response(pdf, media_type="application/pdf", headers={
        "Content-Disposition":
            f"attachment; filename=XPARK_Daily_Report_{datetime.now():%Y-%m-%d}.pdf"})


@app.get("/reports/daily.xlsx")
def daily_excel():
    xlsx = formatters.build_daily_excel(
        storage.events_today(), storage.recent_alerts(100), storage.stats_today())
    return Response(
        xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition":
                 f"attachment; filename=XPARK_Daily_Report_{datetime.now():%Y-%m-%d}.xlsx"})


# ── Batch & test ─────────────────────────────────────────────────────────────

@app.post("/batch/flush")
def force_flush_batch():
    """Force l'envoi immédiat du résumé groupé (normalement horaire)."""
    count = pipeline.flush_batch()
    return {"flushed": count}


@app.post("/test-event")
def post_test_event(req: TestEventRequest):
    """Injecte un événement de test dans le VRAI bus RabbitMQ (parcours complet)."""
    # Scénario de démo (panne critique FICHE §3.1) UNIQUEMENT si la requête
    # est vide — un eventData/context explicite est transmis tel quel.
    demo = not req.eventData and not req.context
    payload = {
        "eventId": f"evt-test-{uuid.uuid4().hex[:10]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "eventType": req.eventType,
        "severity": req.severity,
        "sourceService": "TestConsole",
        "eventData": {
            "vehicleId": 45, "vehicleImmatriculation": "TN-1234-ABC",
            "breakdownDescription": "Moteur ne démarre plus (événement de test)",
            "estimatedRepairCost": 450.0, "currentDriver": "Ahmed Karim",
            "currentMission": {"missionId": 9876, "clientName": "TransFlow Logistics"},
        } if demo else req.eventData,
        "context": {"clientImportance": "PREMIUM"} if demo else req.context,
        "metadata": {"tags": ["test"]},
    }
    try:
        rabbitmq_consumer.publish_event(req.eventType, payload)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"RabbitMQ indisponible: {exc}")
    return {"published": True, "eventId": payload["eventId"], "eventType": req.eventType}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
