"""
Logging JSON structuré — un événement par ligne, prêt pour Loki/ELK.

Pourquoi JSON : les logs d'un service conversationnel sont exploités pour le
monitoring (latence, langue détectée, provider utilisé) ; un format structuré
évite le parsing fragile. Aucune donnée personnelle : les messages utilisateur
ne sont JAMAIS loggés en clair (seulement leur longueur et la langue).
"""
import json
import logging
import sys
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "ts": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Champs structurés additionnels via logger.info("...", extra={"extra_fields": {...}})
        extra = getattr(record, "extra_fields", None)
        if isinstance(extra, dict):
            payload.update(extra)
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)
    root.setLevel(level.upper())
    # Bruit des libs tierces
    for noisy in ("httpx", "httpcore", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def log_event(logger: logging.Logger, msg: str, **fields) -> None:
    """Log structuré : log_event(log, "chat_answered", lang="fr", latency_ms=120)."""
    logger.info(msg, extra={"extra_fields": fields})
