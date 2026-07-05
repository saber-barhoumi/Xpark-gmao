"""Alert Aggregator (FICHE §5.2) — anti-spam intelligence.

R1 DÉDUPLICATION   : même (type, objet) dans les 15 min → supprimé
R2 REGROUPEMENT    : 3+ événements même type en 30 min → 1 méta-alerte batch
R3 TIMING SMART    : CRITIQUE immédiat · IMPORTANT immédiat (déjà dédupliqué)
                     NORMAL → batch horaire · INFO → rapport quotidien seulement
R4 FATIGUE ALERTES : > maxAlertsPerDay → tout passe en batch sauf CRITIQUE
"""

import logging
import threading
import time
from collections import defaultdict
from typing import Dict, List, Tuple

from models import OwnerPreferences, ScoredEvent

logger = logging.getLogger("iboa.aggregator")

DEDUP_WINDOW_S = 15 * 60          # R1
GROUP_WINDOW_S = 30 * 60          # R2
GROUP_THRESHOLD = 3


class Aggregator:
    def __init__(self):
        self._lock = threading.Lock()
        self._last_sent: Dict[Tuple[str, str], float] = {}   # (type, objet) → ts
        self._type_history: Dict[str, List[float]] = defaultdict(list)
        self.batch_queue: List[ScoredEvent] = []              # NORMAL → batch horaire

    def decide(self, scored: ScoredEvent, object_key: str,
               alerts_sent_today: int, prefs: OwnerPreferences) -> str:
        """Returns the routing decision:
        SEND_NOW | BATCH | SUPPRESS_DUPLICATE | DAILY_REPORT_ONLY
        """
        now = time.monotonic()
        etype = scored.event.eventType

        with self._lock:
            # R1 — déduplication même objet
            key = (etype, object_key)
            last = self._last_sent.get(key)
            if last is not None and now - last < DEDUP_WINDOW_S:
                logger.info("R1 dédup: %s %s (déjà alerté il y a %.0fs)",
                            etype, object_key, now - last)
                return "SUPPRESS_DUPLICATE"

            # INFO → rapport quotidien uniquement (R3)
            if scored.classification == "INFO":
                return "DAILY_REPORT_ONLY"

            # R4 — fatigue: trop d'alertes aujourd'hui → batch sauf CRITIQUE
            if (alerts_sent_today >= prefs.maxAlertsPerDay
                    and scored.classification != "CRITIQUE"):
                logger.info("R4 fatigue: %d alertes déjà envoyées → batch", alerts_sent_today)
                self.batch_queue.append(scored)
                self._last_sent[key] = now
                return "BATCH"

            # R2 — regroupement thématique (3+ même type en 30 min)
            history = self._type_history[etype]
            history[:] = [t for t in history if now - t < GROUP_WINDOW_S]
            history.append(now)
            if (len(history) >= GROUP_THRESHOLD
                    and scored.classification != "CRITIQUE"):
                logger.info("R2 regroupement: %d × %s en 30 min → batch",
                            len(history), etype)
                self.batch_queue.append(scored)
                self._last_sent[key] = now
                return "BATCH"

            # R3 — timing par criticité
            if scored.classification in ("CRITIQUE", "IMPORTANT"):
                self._last_sent[key] = now
                return "SEND_NOW"

            # NORMAL → batch horaire
            self.batch_queue.append(scored)
            self._last_sent[key] = now
            return "BATCH"

    def drain_batch(self) -> List[ScoredEvent]:
        with self._lock:
            batch, self.batch_queue = self.batch_queue, []
        return batch
