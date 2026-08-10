"""Message Formatter (FICHE §7.2-5 / §4) — WhatsApp, Email HTML, PDF, Excel.

Le destinataire de ces messages est un exploitant, pas un developpeur. Rien
de ce qu'il lit n'est ecrit dans ce fichier : les intitules de champs, les
titres d'evenements et les phrases expliquant la gravite viennent de
``assets/libelles.json``, la mise en forme de ``assets/alerte.html`` et
``assets/resume.html``, les couleurs de ``assets/charte.css``.
"""

import html as html_mod
import io
import os
from datetime import datetime
from typing import List

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

import templates
from models import ScoredEvent

CLASS_EMOJI = {"CRITIQUE": "🚨", "IMPORTANT": "⚠️", "NORMAL": "ℹ️", "INFO": "📋"}

LIEN_DASHBOARD = os.getenv("IBOA_DASHBOARD_URL",
                           "http://localhost:3000/monitoring/iboa")


def _descriptif(event_type: str) -> dict:
    """Titre, situation et action recommandée pour un type d'événement.

    Un type absent du dictionnaire ne fait pas echouer l'envoi : son nom
    technique est rendu lisible, et les phrases generiques prennent le
    relais. Ajouter un evenement cote serveur n'oblige donc pas a toucher
    au formateur.
    """
    connus = templates.libelles()["evenements"]
    if event_type in connus:
        return connus[event_type]
    lisible = (event_type or "").replace("xpark.", "").replace(".", " ").replace("-", " ").strip()
    return {
        "titre": lisible.capitalize() or "Fait d'exploitation",
        "situation": "Un fait d'exploitation a été enregistré par la plateforme.",
        "action": "Consulter le module concerné pour en mesurer les conséquences.",
    }


def type_label(event_type: str) -> str:
    """Intitulé métier, utilisé aussi par les rapports PDF et Excel."""
    return _descriptif(event_type)["titre"]


def _interesting_fields(data: dict, limit: int = 8) -> List[tuple]:
    """Données à montrer, en intitulés français.

    L'ordre suit ``assets/libelles.json`` : les champs traduits passent en
    premier, dans l'ordre du fichier, parce que c'est celui qui a ete pense
    pour la lecture. Les champs d'implementation listes dans
    ``champsIgnores`` ne sont jamais montres.
    """
    lib = templates.libelles()
    champs, ignores = lib["champs"], set(lib["champsIgnores"])

    rows, vus = [], set()
    for cle, intitule in champs.items():
        valeur = data.get(cle)
        if cle in vus or valeur in (None, "", [], {}):
            continue
        if not isinstance(valeur, (str, int, float, bool)):
            continue
        rows.append((intitule, valeur))
        vus.add(cle)
        if len(rows) >= limit:
            return rows

    # Champ non traduit : on le montre quand meme, sous un intitule lisible,
    # plutot que de laisser un trou dans le message.
    for cle, valeur in data.items():
        if len(rows) >= limit:
            break
        if cle in vus or cle in ignores or cle in champs:
            continue
        if not isinstance(valeur, (str, int, float, bool)):
            continue
        rows.append((cle[0].upper() + cle[1:], valeur))
    return rows[:limit]


def _facteurs_metier(scored: ScoredEvent) -> List[str]:
    """Phrases expliquant le niveau de gravité, sans arithmétique."""
    table = templates.libelles()["facteurs"]
    return [table[code] for code in scored.severityFactors if code in table]


# ── WhatsApp (FICHE §4.1) — concis, emojis, action ───────────────────────────

def format_whatsapp(scored: ScoredEvent) -> str:
    e = scored.event
    desc = _descriptif(e.eventType)
    prio = templates.libelles()["priorites"][scored.classification]

    lines = [f"{CLASS_EMOJI[scored.classification]} {desc['titre'].upper()}",
             f"{prio['libelle']} — gravité {scored.criticityScore}/100", ""]
    for intitule, valeur in _interesting_fields(e.eventData, limit=6):
        lines.append(f"• {intitule} : {valeur}")

    facteurs = _facteurs_metier(scored)
    if facteurs:
        lines += ["", "Pourquoi : " + ", ".join(facteurs) + "."]
    lines += ["", f"À faire : {desc['action']}",
              f"🕐 {e.timestamp:%d/%m/%Y à %H:%M}",
              f"👉 {LIEN_DASHBOARD}"]
    return "\n".join(lines)


# ── Email HTML (FICHE §4.2) ──────────────────────────────────────────────────
#  Aucune balise n'est ecrite ici : la mise en forme vient de
#  assets/alerte.html, les couleurs de assets/charte.css.

def _ligne_tableau(intitule: str, valeur, derniere: bool) -> str:
    c = templates.couleurs()
    bord = "" if derniere else f"border-bottom:1px solid {c['couleur-filet']};"
    return (
        f"<tr>"
        f"<td style=\"padding:11px 16px;{bord}background-color:{c['couleur-fond-doux']};"
        f"font-size:13.5px;color:{c['couleur-texte-tenu']};width:45%;\">"
        f"{html_mod.escape(str(intitule))}</td>"
        f"<td style=\"padding:11px 16px;{bord}font-size:14px;color:{c['couleur-texte']};"
        f"font-weight:600;\">{html_mod.escape(str(valeur))}</td>"
        f"</tr>")


def _puces_facteurs(facteurs: List[str], repli: str) -> str:
    if not facteurs:
        return html_mod.escape(repli)
    return "".join(f"• {html_mod.escape(f)}<br>" for f in facteurs).rstrip("<br>")


def format_email(scored: ScoredEvent) -> tuple:
    """Returns (subject, html_body)."""
    e = scored.event
    desc = _descriptif(e.eventType)
    lib = templates.libelles()
    prio = lib["priorites"][scored.classification]
    c = templates.couleurs()

    subject = f"{desc['titre']} — {prio['libelle'].lower()} ({scored.criticityScore}/100)"

    champs = _interesting_fields(e.eventData)
    lignes = "".join(_ligne_tableau(k, v, i == len(champs) - 1)
                     for i, (k, v) in enumerate(champs))

    html = templates.rendre("alerte.html", {
        "titre": html_mod.escape(desc["titre"]),
        "situation": html_mod.escape(desc["situation"]),
        "action": html_mod.escape(desc["action"]),
        "prioriteLibelle": html_mod.escape(prio["libelle"]),
        "prioriteCouleur": c[f"couleur-{prio['jeton']}"],
        "prioriteFond": c[f"couleur-{prio['jeton']}-fond"],
        "score": scored.criticityScore,
        "horodatage": f"{e.timestamp:%d/%m/%Y à %H:%M}",
        "lignes": lignes,
        "facteurs": _puces_facteurs(
            _facteurs_metier(scored),
            "Niveau déterminé par la nature même du fait signalé."),
        "lienDashboard": LIEN_DASHBOARD,
        "annee": datetime.now().year,
    })
    return subject, html


# ── Batch / méta-alerte (FICHE §5.2 R2) ──────────────────────────────────────

def format_batch_email(batch: List[ScoredEvent]) -> tuple:
    lib = templates.libelles()
    c = templates.couleurs()
    subject = f"Résumé d'exploitation — {len(batch)} faits à consulter"

    tries = sorted(batch, key=lambda s: -s.criticityScore)
    lignes = []
    for i, s in enumerate(tries):
        desc = _descriptif(s.event.eventType)
        prio = lib["priorites"][s.classification]
        bord = "" if i == len(tries) - 1 else f"border-bottom:1px solid {c['couleur-filet']};"
        lignes.append(
            f"<tr>"
            f"<td style=\"padding:12px 16px;{bord}font-size:14px;color:{c['couleur-texte']};\">"
            f"<strong>{html_mod.escape(desc['titre'])}</strong><br>"
            f"<span style=\"font-size:12.5px;color:{c['couleur-texte-efface']};\">"
            f"{s.event.timestamp:%d/%m à %H:%M}</span></td>"
            f"<td align=\"right\" style=\"padding:12px 16px;{bord}white-space:nowrap;\">"
            f"<span style=\"font-size:12px;font-weight:700;color:{c['couleur-' + prio['jeton']]};\">"
            f"{html_mod.escape(prio['libelle'])}</span><br>"
            f"<span style=\"font-size:12px;color:{c['couleur-texte-efface']};\">"
            f"{s.criticityScore}/100</span></td>"
            f"</tr>")

    html = templates.rendre("resume.html", {
        "nombre": len(batch),
        "periode": ("Période couverte : depuis le dernier résumé"
                    if not tries else
                    f"Du {min(s.event.timestamp for s in tries):%d/%m à %H:%M} "
                    f"au {max(s.event.timestamp for s in tries):%d/%m à %H:%M}"),
        "lignes": "".join(lignes),
        "lienDashboard": LIEN_DASHBOARD,
        "annee": datetime.now().year,
    })
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
