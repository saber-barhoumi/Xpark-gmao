"""
Détection de langue — fr / en / ar (darija tunisienne incluse).

Pourquoi un détecteur maison plutôt que langdetect/lingua : les messages de
chat sont COURTS (« chhal el prix ? », « merci ! ») et les détecteurs
statistiques génériques sont mauvais sur < 5 mots. Trois signaux robustes
suffisent ici :
  1. écriture arabe → 'ar' (darija écrite en arabe) ;
  2. darija romanisée (arabizi : « chhal », « 3andkom », « barcha ») détectée
     par lexique + chiffres-lettres (3, 7, 9 utilisés comme lettres) ;
  3. sinon score par mots-outils français vs anglais (le français gagne à
     égalité : marché tunisien, langue par défaut du site).
"""
from __future__ import annotations

import re

ARABIC_RE = re.compile(r"[؀-ۿ]")
ARABIZI_RE = re.compile(r"\b\w*[379]\w*\b")  # 3andi, s7a, 9adech…

DARIJA_WORDS = {
    "chhal", "9adech", "kadech", "chnowa", "chnia", "chkoun", "winou", "wa9tach",
    "barcha", "yezzi", "3andi", "3andkom", "3andek", "n7eb", "nheb", "famma",
    "mch", "moch", "behi", "sa7a", "aychek", "3aychek", "yaatik", "y3aychek",
    "chneya", "kifach", "9addech", "flouss", "karhba", "camion", "twassil",
}

FR_WORDS = {
    "le", "la", "les", "un", "une", "des", "est", "vous", "je", "nous", "pour",
    "avec", "comment", "combien", "quel", "quelle", "bonjour", "merci", "prix",
    "devis", "livraison", "transport", "votre", "vos", "mes", "où", "est-ce",
    "ça", "être", "avoir", "faire", "sur", "dans", "pas", "plus", "réserver",
}

EN_WORDS = {
    "the", "is", "are", "you", "how", "what", "much", "can", "do", "does",
    "hello", "hi", "thanks", "price", "delivery", "shipping", "your", "my",
    "where", "when", "want", "need", "book", "track", "invoice", "with", "for",
}


def detect_language(text: str) -> str:
    """Retourne 'fr', 'en' ou 'ar'."""
    if ARABIC_RE.search(text):
        return "ar"

    tokens = re.findall(r"[\w'-]+", text.lower())
    if not tokens:
        return "fr"

    darija_hits = sum(t in DARIJA_WORDS for t in tokens) + len(ARABIZI_RE.findall(text.lower()))
    fr_hits = sum(t in FR_WORDS for t in tokens)
    en_hits = sum(t in EN_WORDS for t in tokens)

    if darija_hits >= 1 and darija_hits >= max(fr_hits, en_hits):
        return "ar"
    if en_hits > fr_hits:
        return "en"
    return "fr"


# ── Normalisation arabe (pour BM25 : darija/MSA, variantes d'écriture) ───────

_AR_NORM = str.maketrans({
    "أ": "ا", "إ": "ا", "آ": "ا", "ة": "ه", "ى": "ي", "ئ": "ي", "ؤ": "و",
    "ـ": "",  # tatweel
})
_AR_DIACRITICS = re.compile(r"[ً-ٰٟ]")


def normalize_arabic(text: str) -> str:
    return _AR_DIACRITICS.sub("", text.translate(_AR_NORM))
