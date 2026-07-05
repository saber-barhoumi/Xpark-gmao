"""PostgreSQL persistence (FICHE §7.3) — shared xpark_gmao database.

Tables (created at startup, idempotent — same pattern as the .NET services):
  IboaEvents, IboaAlerts, IboaPreferences, IboaAuditLog
"""

import json
import logging
import os
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import psycopg2
from psycopg2.pool import SimpleConnectionPool

from models import Alert, BusinessEvent, OwnerPreferences, ScoredEvent

logger = logging.getLogger("iboa.storage")

DSN = os.getenv(
    "DATABASE_URL",
    "host=postgres port=5432 dbname=xpark_gmao user=xpark_user password=xpark_password_2026",
)

_pool: Optional[SimpleConnectionPool] = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS "IboaEvents" (
    "EventId"        VARCHAR(80) PRIMARY KEY,
    "Timestamp"      TIMESTAMPTZ NOT NULL,
    "EventType"      VARCHAR(120) NOT NULL,
    "Severity"       VARCHAR(20) NOT NULL,
    "SourceService"  VARCHAR(80) NOT NULL,
    "EventData"      JSONB NOT NULL DEFAULT '{}',
    "Context"        JSONB NOT NULL DEFAULT '{}',
    "Metadata"       JSONB NOT NULL DEFAULT '{}',
    "CriticityScore" INT NOT NULL,
    "Classification" VARCHAR(20) NOT NULL,
    "ScoreBreakdown" JSONB NOT NULL DEFAULT '[]',
    "ObjectKey"      VARCHAR(120) NOT NULL DEFAULT 'global',
    "CreatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IX_IboaEvents_Type_Time" ON "IboaEvents" ("EventType", "Timestamp");

CREATE TABLE IF NOT EXISTS "IboaAlerts" (
    "AlertId"         VARCHAR(80) PRIMARY KEY,
    "EventId"         VARCHAR(80) NOT NULL,
    "CriticityScore"  INT NOT NULL,
    "AlertStatus"     VARCHAR(30) NOT NULL,
    "Recipient"       VARCHAR(200) NOT NULL DEFAULT '',
    "DeliveryChannel" VARCHAR(30) NOT NULL,
    "MessageContent"  TEXT NOT NULL DEFAULT '',
    "SentAt"          TIMESTAMPTZ,
    "RetryCount"      INT NOT NULL DEFAULT 0,
    "FailureReason"   TEXT,
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "IboaPreferences" (
    "Id"                 INT PRIMARY KEY DEFAULT 1,
    "OwnerName"          VARCHAR(120) NOT NULL DEFAULT 'Propriétaire XPARK',
    "WhatsappNumber"     VARCHAR(30) NOT NULL DEFAULT '',
    "Email"              VARCHAR(200) NOT NULL DEFAULT '',
    "WhatsappThreshold"  INT NOT NULL DEFAULT 85,
    "EmailThreshold"     INT NOT NULL DEFAULT 60,
    "QuietHoursStart"    INT NOT NULL DEFAULT 22,
    "QuietHoursEnd"      INT NOT NULL DEFAULT 7,
    "MaxAlertsPerDay"    INT NOT NULL DEFAULT 20,
    "Enabled"            BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO "IboaPreferences" ("Id") VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "IboaAuditLog" (
    "LogId"     BIGSERIAL PRIMARY KEY,
    "AlertId"   VARCHAR(80),
    "Action"    VARCHAR(40) NOT NULL,
    "Details"   JSONB NOT NULL DEFAULT '{}',
    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


def init_db(max_wait_s: int = 60) -> None:
    """Connects (with retry while postgres boots) and creates the schema."""
    global _pool
    deadline = time.monotonic() + max_wait_s
    while True:
        try:
            _pool = SimpleConnectionPool(1, 5, DSN)
            break
        except psycopg2.OperationalError as exc:
            if time.monotonic() > deadline:
                raise
            logger.warning("PostgreSQL pas encore prêt (%s) — retry 3s", exc)
            time.sleep(3)
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA)
    logger.info("Schéma IBOA prêt (IboaEvents, IboaAlerts, IboaPreferences, IboaAuditLog)")


@contextmanager
def _conn():
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


# ── Events ────────────────────────────────────────────────────────────────────

def save_event(scored: ScoredEvent, object_key: str) -> None:
    e = scored.event
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''INSERT INTO "IboaEvents"
               ("EventId","Timestamp","EventType","Severity","SourceService",
                "EventData","Context","Metadata","CriticityScore","Classification",
                "ScoreBreakdown","ObjectKey")
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON CONFLICT ("EventId") DO NOTHING''',
            (e.eventId, e.timestamp, e.eventType, e.severity, e.sourceService,
             json.dumps(e.eventData, default=str), json.dumps(e.context, default=str),
             json.dumps(e.metadata, default=str), scored.criticityScore,
             scored.classification, json.dumps(scored.scoreBreakdown), object_key))


def count_similar_events(event_type: str, object_key: str, days: int = 7) -> int:
    """Context Enricher (§7.2-2): frequency of the same problem on the same object."""
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''SELECT COUNT(*) FROM "IboaEvents"
               WHERE "EventType"=%s AND "ObjectKey"=%s AND "Timestamp" > %s''',
            (event_type, object_key,
             datetime.now(timezone.utc) - timedelta(days=days)))
        return cur.fetchone()[0]


def recent_events(limit: int = 50) -> List[dict]:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''SELECT "EventId","Timestamp","EventType","Severity","SourceService",
                      "CriticityScore","Classification","ScoreBreakdown","EventData"
               FROM "IboaEvents" ORDER BY "Timestamp" DESC LIMIT %s''', (limit,))
        return [{"eventId": r[0], "timestamp": r[1].isoformat(), "eventType": r[2],
                 "severity": r[3], "sourceService": r[4], "criticityScore": r[5],
                 "classification": r[6], "scoreBreakdown": r[7], "eventData": r[8]}
                for r in cur.fetchall()]


def events_today() -> List[dict]:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''SELECT "EventId","Timestamp","EventType","Severity","SourceService",
                      "CriticityScore","Classification","EventData"
               FROM "IboaEvents"
               WHERE "Timestamp" >= date_trunc('day', now())
               ORDER BY "CriticityScore" DESC''')
        return [{"eventId": r[0], "timestamp": r[1].isoformat(), "eventType": r[2],
                 "severity": r[3], "sourceService": r[4], "criticityScore": r[5],
                 "classification": r[6], "eventData": r[7]} for r in cur.fetchall()]


# ── Alerts ────────────────────────────────────────────────────────────────────

def save_alert(alert: Alert) -> None:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''INSERT INTO "IboaAlerts"
               ("AlertId","EventId","CriticityScore","AlertStatus","Recipient",
                "DeliveryChannel","MessageContent","SentAt","RetryCount","FailureReason")
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON CONFLICT ("AlertId") DO UPDATE SET
                 "AlertStatus"=EXCLUDED."AlertStatus", "SentAt"=EXCLUDED."SentAt",
                 "RetryCount"=EXCLUDED."RetryCount", "FailureReason"=EXCLUDED."FailureReason"''',
            (alert.alertId, alert.eventId, alert.criticityScore, alert.alertStatus,
             alert.recipient, alert.deliveryChannel, alert.messageContent,
             alert.sentAt, alert.retryCount, alert.failureReason))


def recent_alerts(limit: int = 50) -> List[dict]:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''SELECT a."AlertId",a."EventId",a."CriticityScore",a."AlertStatus",
                      a."Recipient",a."DeliveryChannel",a."MessageContent",a."SentAt",
                      a."RetryCount",a."FailureReason",a."CreatedAt",e."EventType"
               FROM "IboaAlerts" a
               LEFT JOIN "IboaEvents" e ON e."EventId" = a."EventId"
               ORDER BY a."CreatedAt" DESC LIMIT %s''', (limit,))
        return [{"alertId": r[0], "eventId": r[1], "criticityScore": r[2],
                 "alertStatus": r[3], "recipient": r[4], "deliveryChannel": r[5],
                 "messageContent": r[6], "sentAt": r[7].isoformat() if r[7] else None,
                 "retryCount": r[8], "failureReason": r[9],
                 "createdAt": r[10].isoformat(), "eventType": r[11]}
                for r in cur.fetchall()]


def alerts_sent_today_count() -> int:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''SELECT COUNT(*) FROM "IboaAlerts"
               WHERE "CreatedAt" >= date_trunc('day', now())
                 AND "AlertStatus" IN ('SENT','SENT_SIMULATED')''')
        return cur.fetchone()[0]


def stats_today() -> dict:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute('''SELECT "Classification", COUNT(*) FROM "IboaEvents"
                       WHERE "Timestamp" >= date_trunc('day', now())
                       GROUP BY "Classification"''')
        by_class = {r[0]: r[1] for r in cur.fetchall()}
        cur.execute('''SELECT "DeliveryChannel", "AlertStatus", COUNT(*) FROM "IboaAlerts"
                       WHERE "CreatedAt" >= date_trunc('day', now())
                       GROUP BY "DeliveryChannel","AlertStatus"''')
        alerts = [{"channel": r[0], "status": r[1], "count": r[2]} for r in cur.fetchall()]
        cur.execute('''SELECT "EventType", COUNT(*) FROM "IboaEvents"
                       WHERE "Timestamp" >= date_trunc('day', now())
                       GROUP BY "EventType" ORDER BY COUNT(*) DESC LIMIT 5''')
        top_types = [{"eventType": r[0], "count": r[1]} for r in cur.fetchall()]
    return {"eventsByClassification": by_class, "alerts": alerts, "topEventTypes": top_types}


# ── Preferences ───────────────────────────────────────────────────────────────

def get_preferences() -> OwnerPreferences:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute('''SELECT "OwnerName","WhatsappNumber","Email","WhatsappThreshold",
                              "EmailThreshold","QuietHoursStart","QuietHoursEnd",
                              "MaxAlertsPerDay","Enabled"
                       FROM "IboaPreferences" WHERE "Id"=1''')
        r = cur.fetchone()
    return OwnerPreferences(
        ownerName=r[0], whatsappNumber=r[1], email=r[2], whatsappThreshold=r[3],
        emailThreshold=r[4], quietHoursStart=r[5], quietHoursEnd=r[6],
        maxAlertsPerDay=r[7], enabled=r[8])


def save_preferences(p: OwnerPreferences) -> None:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            '''UPDATE "IboaPreferences" SET
               "OwnerName"=%s,"WhatsappNumber"=%s,"Email"=%s,"WhatsappThreshold"=%s,
               "EmailThreshold"=%s,"QuietHoursStart"=%s,"QuietHoursEnd"=%s,
               "MaxAlertsPerDay"=%s,"Enabled"=%s WHERE "Id"=1''',
            (p.ownerName, p.whatsappNumber, p.email, p.whatsappThreshold,
             p.emailThreshold, p.quietHoursStart, p.quietHoursEnd,
             p.maxAlertsPerDay, p.enabled))


# ── Audit (FICHE §7.2-7) ─────────────────────────────────────────────────────

def audit(alert_id: Optional[str], action: str, details: dict) -> None:
    try:
        with _conn() as conn, conn.cursor() as cur:
            cur.execute(
                '''INSERT INTO "IboaAuditLog" ("AlertId","Action","Details")
                   VALUES (%s,%s,%s)''',
                (alert_id, action, json.dumps(details, default=str)))
    except Exception:  # l'audit ne doit jamais casser le pipeline
        logger.exception("Audit log failed")
