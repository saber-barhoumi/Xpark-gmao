"""Delivery Engine (FICHE §7.2-6) — WhatsApp (Twilio), Email (SMTP), retry logic.

MODE SIMULATION : si les identifiants Twilio/SMTP ne sont pas configurés, les
messages sont journalisés et marqués SENT_SIMULATED — le pipeline complet reste
testable sans compte externe. Il suffit de renseigner les variables
d'environnement pour activer l'envoi réel (aucun changement de code).
"""

import logging
import os
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parseaddr

import requests

logger = logging.getLogger("iboa.delivery")

# Twilio WhatsApp (FICHE §7.1)
TWILIO_SID   = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM  = os.getenv("TWILIO_WHATSAPP_FROM", "")     # ex: whatsapp:+14155238886

# SMTP Email
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "iboa@xpark.tn")

RETRY_DELAYS_S = [0, 5, 15]     # 3 tentatives avec backoff (FICHE §5.3)


def whatsapp_configured() -> bool:
    return bool(TWILIO_SID and TWILIO_TOKEN and TWILIO_FROM)


def email_configured() -> bool:
    # Le mot de passe compte autant que l'hote et l'utilisateur : _send_email_once
    # appelle toujours server.login(). Sans mot de passe, l'envoi echouerait a
    # coup sur, et le service enchainerait trois tentatives espacees de 0, 5 et
    # 15 secondes au lieu de retomber franchement en simulation.
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS)


def _send_whatsapp_once(to_number: str, body: str) -> None:
    resp = requests.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json",
        auth=(TWILIO_SID, TWILIO_TOKEN),
        data={"From": TWILIO_FROM,
              "To": f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number,
              "Body": body},
        timeout=15)
    resp.raise_for_status()


def _send_email_once(to_email: str, subject: str, html: str) -> None:
    # SMTP_FROM peut porter un nom d'affichage : « XPARK GMAO <boite@gmail.com> ».
    # Cette forme convient a l'en-tete From, que le destinataire voit, mais PAS
    # a l'expediteur d'enveloppe : sendmail() l'emet tel quel dans la commande
    # MAIL FROM, et le serveur repond alors « syntax error ». On separe donc les
    # deux : le nom d'affichage reste dans l'en-tete, l'enveloppe ne porte que
    # l'adresse nue.
    envelope = parseaddr(SMTP_FROM)[1] or SMTP_USER

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(envelope, [to_email], msg.as_string())


def _with_retry(send_fn, channel: str) -> tuple:
    """Returns (status, retry_count, failure_reason)."""
    last_error = None
    for attempt, delay in enumerate(RETRY_DELAYS_S):
        if delay:
            time.sleep(delay)
        try:
            send_fn()
            return "SENT", attempt, None
        except Exception as exc:
            last_error = exc
            logger.warning("%s tentative %d échouée: %s", channel, attempt + 1, exc)
    return "FAILED", len(RETRY_DELAYS_S) - 1, str(last_error)


def send_whatsapp(to_number: str, body: str) -> tuple:
    """Returns (status, retry_count, failure_reason)."""
    if not to_number:
        return "FAILED", 0, "Numéro WhatsApp non configuré dans les préférences"
    if not whatsapp_configured():
        logger.info("[SIMULATION WhatsApp → %s]\n%s", to_number, body)
        return "SENT_SIMULATED", 0, None
    return _with_retry(lambda: _send_whatsapp_once(to_number, body), "WhatsApp")


def send_email(to_email: str, subject: str, html: str) -> tuple:
    if not to_email:
        return "FAILED", 0, "Email non configuré dans les préférences"
    if not email_configured():
        logger.info("[SIMULATION Email → %s] %s", to_email, subject)
        return "SENT_SIMULATED", 0, None
    return _with_retry(lambda: _send_email_once(to_email, subject, html), "Email")
