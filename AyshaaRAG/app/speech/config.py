"""
Pipeline vocal d'Ayshaa — configuration servie au widget (GET /api/v1/speech/config).

Architecture (docs/speech.md) : la reconnaissance (STT) et la synthèse (TTS)
s'exécutent DANS LE NAVIGATEUR (Web Speech API) — zéro latence serveur, zéro
coût, aucune donnée audio ne quitte le poste de l'utilisateur (RGPD-friendly).
Le serveur reste l'autorité sur :
  • la langue de la réponse (détection texte fr/en/darija déjà côté serveur) ;
  • le mapping langue → locales STT et voix TTS préférées ;
  • les modes de restitution proposés (texte / voix / les deux).

Ce module est volontairement une interface : brancher un STT serveur (Whisper)
ou un TTS neuronal plus tard = ajouter un provider ici sans toucher au widget.
"""
from __future__ import annotations

SPEECH_CONFIG: dict = {
    # Reconnaissance vocale : locales à proposer au moteur du navigateur.
    # Le darija n'a pas de locale dédiée : ar-TN donne les meilleurs résultats
    # (repli ar-SA si absent), et notre détecteur de langue texte réidentifie
    # le darija sur la transcription.
    "stt": {
        "locales": {"fr": "fr-FR", "en": "en-US", "ar": "ar-TN"},
        "fallbacks": {"ar": ["ar-TN", "ar-SA", "ar-EG"]},
        "auto_detect": True,     # le widget enchaîne la locale de la dernière langue détectée
    },
    # Synthèse : voix préférées par langue (le widget choisit la première
    # disponible sur le poste ; sinon n'importe quelle voix de la langue).
    "tts": {
        "voices": {
            "fr": ["Google français", "Microsoft Denise", "Amelie", "fr-FR"],
            "en": ["Google US English", "Microsoft Aria", "Samantha", "en-US"],
            "ar": ["Google العربية", "Microsoft Hamed", "Laila", "ar-"],
        },
        "rate": 1.0, "pitch": 1.0,
    },
    # Modes de restitution proposés dans le widget (persistés en localStorage)
    "modes": ["text", "voice", "both"],
    "default_mode": "text",
}
