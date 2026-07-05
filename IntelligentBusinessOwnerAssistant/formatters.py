"""Message Formatter (FICHE §7.2-5 / §4) — WhatsApp, Email HTML, PDF, Excel."""

import io
from datetime import datetime
from typing import List

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from models import ScoredEvent

CLASS_EMOJI = {"CRITIQUE": "🚨", "IMPORTANT": "⚠️", "NORMAL": "ℹ️", "INFO": "📋"}

# Libellés français par type d'événement
TYPE_LABELS = {
    "xpark.fleet.vehicle-breakdown":     "PANNE VÉHICULE",
    "xpark.fleet.maintenance-due":       "MAINTENANCE DUE",
    "xpark.fleet.vehicle-added":         "NOUVEAU VÉHICULE",
    "xpark.mission.task-completed":      "MISSION TERMINÉE",
    "xpark.mission.task-cancelled":      "MISSION ANNULÉE",
    "xpark.mission.task-failed":         "MISSION ÉCHOUÉE",
    "xpark.mission.task-delayed":        "MISSION RETARDÉE",
    "xpark.finance.cash-flow-critical":  "TRÉSORERIE CRITIQUE",
    "xpark.finance.profit-decreased":    "BAISSE DE PROFIT",
    "xpark.finance.unpaid-invoice":      "FACTURE IMPAYÉE",
    "xpark.client.new-client":           "NOUVEAU CLIENT",
    "xpark.client.client-lost":          "CLIENT PERDU",
    "xpark.optimization.plan-generated": "PLAN D'OPTIMISATION GÉNÉRÉ",
    "xpark.ai.breakdown-prediction":     "PRÉDICTION DE PANNE (IA)",
}


def type_label(event_type: str) -> str:
    return TYPE_LABELS.get(event_type, event_type.replace("xpark.", "").replace(".", " › ").upper())


def _interesting_fields(data: dict, limit: int = 8) -> List[tuple]:
    """Picks the most human-relevant eventData fields for display."""
    preferred = ["vehicleImmatriculation", "vehiculeImmatriculation", "immatriculation",
                 "breakdownDescription", "description", "missionId", "vehicleId",
                 "vehiculeId", "destination", "chauffeurNom", "currentDriver",
                 "clientName", "amount", "cost", "coutTotal", "estimatedRepairCost",
                 "reason", "statut", "marque", "modele"]
    rows = [(k, data[k]) for k in preferred if data.get(k) not in (None, "", [])]
    for k, v in data.items():
        if len(rows) >= limit:
            break
        if all(k != rk for rk, _ in rows) and isinstance(v, (str, int, float, bool)):
            rows.append((k, v))
    return rows[:limit]


# ── WhatsApp (FICHE §4.1) — concis, emojis, action ───────────────────────────

def format_whatsapp(scored: ScoredEvent) -> str:
    e = scored.event
    lines = [
        f"{CLASS_EMOJI[scored.classification]} ALERTE {scored.classification} — {type_label(e.eventType)}",
        "",
    ]
    for key, value in _interesting_fields(e.eventData, limit=6):
        lines.append(f"• {key}: {value}")
    lines += [
        "",
        f"📊 Criticité: {scored.criticityScore}/100",
        f"🕐 {e.timestamp:%d/%m/%Y %H:%M}",
        f"👉 http://localhost:3000/monitoring/iboa (détails)",
    ]
    return "\n".join(lines)


# ── Email HTML (FICHE §4.2) ──────────────────────────────────────────────────

def format_email(scored: ScoredEvent) -> tuple:
    """Returns (subject, html_body)."""
    e = scored.event
    subject = (f"[{scored.classification}] {type_label(e.eventType)} "
               f"— criticité {scored.criticityScore}/100")

    rows = "".join(
        f"<tr><td style='padding:4px 10px;border:1px solid #ddd'><b>{k}</b></td>"
        f"<td style='padding:4px 10px;border:1px solid #ddd'>{v}</td></tr>"
        for k, v in _interesting_fields(e.eventData))
    breakdown = "".join(f"<li>{b}</li>" for b in scored.scoreBreakdown)

    html = f"""
<h2>{CLASS_EMOJI[scored.classification]} {type_label(e.eventType)}</h2>
<p><b>Classification:</b> {scored.classification} — score {scored.criticityScore}/100<br>
<b>Service source:</b> {e.sourceService} · <b>Horodatage:</b> {e.timestamp:%d/%m/%Y %H:%M}</p>
<table style="border-collapse:collapse">{rows}</table>
<h3>Calcul de la criticité</h3><ul>{breakdown}</ul>
<hr><p><em>Alerte générée automatiquement par XPARK IntelligentBusinessOwnerAssistant</em></p>
"""
    return subject, html


# ── Batch / méta-alerte (FICHE §5.2 R2) ──────────────────────────────────────

def format_batch_email(batch: List[ScoredEvent]) -> tuple:
    subject = f"[RÉSUMÉ] {len(batch)} événements XPARK regroupés"
    items = "".join(
        f"<li>{CLASS_EMOJI[s.classification]} <b>{type_label(s.event.eventType)}</b> "
        f"(score {s.criticityScore}) — {s.event.timestamp:%H:%M}</li>"
        for s in sorted(batch, key=lambda s: -s.criticityScore))
    html = (f"<h2>📦 Résumé groupé — {len(batch)} événements</h2><ul>{items}</ul>"
            f"<p><em>Regroupés pour éviter la surcharge d'alertes (règle anti-spam IBOA)</em></p>")
    return subject, html


# ── Rapport PDF quotidien (FICHE §4.3) ───────────────────────────────────────

def build_daily_pdf(events: List[dict], alerts: List[dict], stats: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = getSampleStyleSheet()
    h1 = styles["Title"]
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=colors.HexColor("#1f3b57"))
    body = styles["BodyText"]
    story = []

    story.append(Paragraph(f"RAPPORT QUOTIDIEN XPARK — {datetime.now():%d/%m/%Y}", h1))
    story.append(Paragraph(f"Généré à {datetime.now():%H:%M} par IntelligentBusinessOwnerAssistant", body))
    story.append(Spacer(1, 12))

    # Résumé exécutif
    story.append(Paragraph("📊 RÉSUMÉ EXÉCUTIF", h2))
    by_class = stats.get("eventsByClassification", {})
    summary = [["Classification", "Événements"]] + [
        [c, str(by_class.get(c, 0))] for c in ("CRITIQUE", "IMPORTANT", "NORMAL", "INFO")]
    t = Table(summary, colWidths=[8 * cm, 4 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f3b57")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9)]))
    story.append(t)
    story.append(Spacer(1, 14))

    # Événements critiques & importants
    story.append(Paragraph("🚨 ÉVÉNEMENTS CRITIQUES & IMPORTANTS", h2))
    hot = [e for e in events if e["classification"] in ("CRITIQUE", "IMPORTANT")]
    if hot:
        rows = [["Heure", "Type", "Score", "Source"]] + [
            [e["timestamp"][11:16], type_label(e["eventType"]),
             str(e["criticityScore"]), e["sourceService"]] for e in hot[:20]]
        t = Table(rows, colWidths=[2 * cm, 9 * cm, 2 * cm, 4 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8b0000")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8)]))
        story.append(t)
    else:
        story.append(Paragraph("Aucun événement critique aujourd'hui ✅", body))
    story.append(Spacer(1, 14))

    # Alertes envoyées
    story.append(Paragraph("📤 ALERTES ENVOYÉES", h2))
    if alerts:
        rows = [["Heure", "Canal", "Statut", "Score"]] + [
            [(a["sentAt"] or a["createdAt"])[11:16], a["deliveryChannel"],
             a["alertStatus"], str(a["criticityScore"])] for a in alerts[:25]]
        t = Table(rows, colWidths=[2.5 * cm, 4 * cm, 5 * cm, 2 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f6f43")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8)]))
        story.append(t)
    else:
        story.append(Paragraph("Aucune alerte envoyée aujourd'hui.", body))

    doc.build(story)
    return buf.getvalue()


# ── Export Excel (FICHE §4.4) ────────────────────────────────────────────────

def build_daily_excel(events: List[dict], alerts: List[dict], stats: dict) -> bytes:
    wb = Workbook()
    header_fill = PatternFill("solid", fgColor="1F3B57")
    header_font = Font(color="FFFFFF", bold=True)

    def style_header(ws):
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font

    # 1. SUMMARY
    ws = wb.active
    ws.title = "SUMMARY"
    ws.append(["Indicateur", "Valeur"])
    by_class = stats.get("eventsByClassification", {})
    for c in ("CRITIQUE", "IMPORTANT", "NORMAL", "INFO"):
        ws.append([f"Événements {c}", by_class.get(c, 0)])
    ws.append(["Alertes envoyées", sum(a["count"] for a in stats.get("alerts", [])
                                       if a["status"] in ("SENT", "SENT_SIMULATED"))])
    style_header(ws)

    # 2. EVENTS (raw data du jour)
    ws = wb.create_sheet("EVENTS")
    ws.append(["EventId", "Heure", "Type", "Sévérité", "Source", "Score", "Classification"])
    for e in events:
        ws.append([e["eventId"], e["timestamp"], e["eventType"], e["severity"],
                   e["sourceService"], e["criticityScore"], e["classification"]])
    style_header(ws)

    # 3. ALERTS
    ws = wb.create_sheet("ALERTS")
    ws.append(["AlertId", "EventType", "Canal", "Statut", "Score", "Destinataire", "EnvoyéeÀ"])
    for a in alerts:
        ws.append([a["alertId"], a.get("eventType", ""), a["deliveryChannel"],
                   a["alertStatus"], a["criticityScore"], a["recipient"], a["sentAt"] or ""])
    style_header(ws)

    # 4. TOP_TYPES
    ws = wb.create_sheet("TOP_TYPES")
    ws.append(["EventType", "Occurrences"])
    for t in stats.get("topEventTypes", []):
        ws.append([t["eventType"], t["count"]])
    style_header(ws)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
