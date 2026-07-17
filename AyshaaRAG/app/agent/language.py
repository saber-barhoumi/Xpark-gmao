"""
Détection de langue — fr / en / ar (darija tunisienne incluse).

Pourquoi un détecteur maison plutôt que langdetect/lingua : les messages de
chat sont COURTS (« chhal el prix ? », « merci ! ») et les détecteurs
statistiques génériques sont mauvais sur < 5 mots. Signaux utilisés :
  1. écriture arabe → 'ar' (darija écrite en arabe) ;
  2. darija romanisée (arabizi) : lexique FUSIONNÉ = noyau manuel + 800 mots
     extraits du corpus réel CleanData (23 000 commentaires tunisiens,
     scripts/build_darija_lexicon.py) + chiffres-lettres (3, 7, 9) ;
  3. sinon score par mots-outils français vs anglais (le français gagne à
     égalité : marché tunisien, langue par défaut du site).
"""
from __future__ import annotations

import re

from app.rag.darija_lexicon import DARIJA_ROMAN

ARABIC_RE = re.compile(r"[؀-ۿ]")
ARABIZI_RE = re.compile(r"\b\w*[379]\w*\b")  # 3andi, s7a, 9adech…

# Noyau manuel (mots essentiels du chat, quelle que soit leur fréquence corpus)
DARIJA_CORE = {
    "chhal", "ch7al", "9adech", "9addech", "kadech", "chnowa", "chnia", "chneya",
    "chkoun", "chkoun", "winou", "wa9tach", "waktach", "kifach", "kifech",
    "barcha", "yezzi", "3andi", "3andkom", "3andek", "n7eb", "nheb", "famma",
    "mch", "moch", "behi", "sa7a", "aychek", "3aychek", "yaatik", "y3aychek",
    "flouss", "karhba", "twassil", "tawsil", "chwaya", "tawa", "lioum",
    "ghodwa", "3lech", "alech", "3lah", "chbik", "labes", "lebes", "hamdoulah",
    "aslema", "asslema", "bislema", "yassr", "brabi", "monguela", "wa9t",
}

# Le lexique corpus contient inévitablement quelques mots français (les
# commentaires tunisiens mélangent les langues) : on les neutralise, et à la
# détection les mots corpus pèsent MOINS que le noyau manuel certifié.
DARIJA_CORPUS = set(DARIJA_ROMAN) - DARIJA_CORE

FR_WORDS = {
    "le", "la", "les", "un", "une", "des", "est", "vous", "je", "nous", "pour",
    "avec", "comment", "combien", "quel", "quelle", "bonjour", "merci", "prix",
    "devis", "livraison", "transport", "votre", "vos", "mes", "où", "est-ce",
    "ça", "être", "avoir", "faire", "sur", "dans", "pas", "plus", "réserver",
    "salut", "bonsoir", "oui", "non", "svp", "stp",
}

EN_WORDS = {
    "the", "is", "are", "you", "how", "what", "much", "can", "do", "does",
    "hello", "hi", "thanks", "price", "delivery", "shipping", "your", "my",
    "where", "when", "want", "need", "book", "track", "invoice", "with", "for",
    "hey", "please", "thank",
}


def detect_language(text: str) -> str:
    """Retourne 'fr', 'en' ou 'ar'. Score pondéré : le noyau darija certifié et
    l'arabizi (3/7/9) pèsent 2, le lexique corpus (bruité) pèse 0.5 — un mot
    français « infiltré » dans le corpus ne peut plus faire basculer la langue."""
    if ARABIC_RE.search(text):
        return "ar"

    tokens = re.findall(r"[\w'-]+", text.lower())
    if not tokens:
        return "fr"

    fr_hits = sum(t in FR_WORDS for t in tokens)
    en_hits = sum(t in EN_WORDS for t in tokens)
    darija_score = (
        2.0 * sum(t in DARIJA_CORE for t in tokens)
        + 2.0 * len(ARABIZI_RE.findall(text.lower()))
        + 0.5 * sum(t in DARIJA_CORPUS and t not in FR_WORDS and t not in EN_WORDS
                    for t in tokens)
    )

    if darija_score >= 2 and darija_score >= max(fr_hits, en_hits):
        return "ar"
    if en_hits > fr_hits:
        return "en"
    return "fr"


# ── Normalisation arabe (pour BM25 : darija/MSA, variantes d'écriture) ───────

_AR_NORM = str.maketrans({
    "أ": "ا", "إ": "ا", "آ": "ا", "ة": "ه", "ى": "ي", "ئ": "ي", "ؤ": "و",
    "ـ": "",  # tatweel
})
_AR_DIACRITICS = re.compile(r"[ً-ٰٟ]")


def normalize_arabic(text: str) -> str:
    return _AR_DIACRITICS.sub("", text.translate(_AR_NORM))


# ── Translittération arabizi → arabe (expansion de requête BM25) ─────────────
# Quand un Tunisien écrit « chhal el prix mta3 transport », la KB darija est en
# écriture arabe : on étend la requête avec les équivalents arabes des mots
# les plus fréquents du domaine pour que BM25 les retrouve.

ARABIZI_TO_ARABIC = {
    "chhal": "قداش", "ch7al": "قداش", "9adech": "قداش", "9addech": "قداش",
    "kifach": "كيفاش", "kifech": "كيفاش", "chnowa": "شنوة", "chnia": "شنية",
    "chneya": "شنية", "chkoun": "شكون", "winou": "وينو", "wa9tach": "وقتاش",
    "prix": "سوم", "flouss": "فلوس", "transport": "نقل", "karhba": "كرهبة",
    "camion": "كميون", "twassil": "توصيل", "tawsil": "توصيل",
    "livraison": "توصيلة", "facture": "فاتورة", "devis": "عرض سعر",
    "n7eb": "نحب", "nheb": "نحب", "3andi": "عندي", "3andkom": "عندكم",
    "compte": "حساب", "reservation": "حجز", "support": "دعم",
}


def expand_arabizi(text: str) -> str:
    """Ajoute les équivalents arabes des mots arabizi détectés (pour BM25)."""
    extra = [ARABIZI_TO_ARABIC[t] for t in re.findall(r"[\w']+", text.lower())
             if t in ARABIZI_TO_ARABIC]
    return f"{text} {' '.join(extra)}" if extra else text
