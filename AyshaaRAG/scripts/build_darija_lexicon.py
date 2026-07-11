# -*- coding: utf-8 -*-
"""
Construit le lexique darija d'Ayshaa depuis le corpus CleanData
(23 000+ commentaires tunisiens réels — YouTube, transport/mobilité).

Usage :  python scripts/build_darija_lexicon.py
Sortie :  app/rag/darija_lexicon.py  (généré, versionné dans Git : le build
          Docker n'a pas besoin du corpus de 8 Mo)

Méthode :
 - tokens ROMANISÉS : fréquents dans le corpus, exclus s'ils appartiennent au
   français/anglais courant (listes d'exclusion) — les chiffres-lettres de
   l'arabizi (3, 7, 9) sont conservés tels quels ;
 - tokens ARABES : fréquents après normalisation (hamza, tatweel,
   diacritiques), excluant l'arabe standard trop générique (mots < 3 car.).
Le lexique sert UNIQUEMENT à la détection de langue : le corpus n'entre
jamais dans la base de connaissances (qualité des réponses oblige).
"""
from __future__ import annotations

import io
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "CleanData" / "tunisian_corpus.jsonl"
OUT = ROOT / "app" / "rag" / "darija_lexicon.py"

ARABIC_RE = re.compile(r"[؀-ۿ]")
TOKEN_RE = re.compile(r"[a-zA-Z0-9']+")
AR_TOKEN_RE = re.compile(r"[؀-ۿ]+")

# Mots français/anglais courants à EXCLURE du lexique romanisé (les
# commentaires tunisiens mélangent les langues) — listes volontairement larges.
FR_EN_COMMON = set("""
le la les un une des de du et ou est sont pour avec sans dans sur pas plus
que qui quoi mais donc alors tres bien mal bon bonne tout tous toute rien
je tu il elle nous vous ils elles mon ton son ma ta sa mes tes ses notre votre
ce cette ces se ne si au aux par comme faire fait etre avoir vais va vont
merci bonjour salut oui non peut etre meme aussi apres avant chez encore
the a an and or is are was were be been to of in on at for with without
from this that these those it its he she we they you i my your his her our
not no yes very good bad all any some more most much many will would can
could should do does did done have has had get got make made just like
video music film youtube facebook instagram tiktok live stream subscribe
""".split())

MIN_LEN = 3
TOP_ROMAN = 800
TOP_ARABIC = 1500

_AR_NORM = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ة": "ه", "ى": "ي",
                          "ئ": "ي", "ؤ": "و", "ـ": ""})
_AR_DIACRITICS = re.compile(r"[ً-ٰٟ]")


def normalize_arabic(text: str) -> str:
    return _AR_DIACRITICS.sub("", text.translate(_AR_NORM))


def main() -> None:
    if not CORPUS.exists():
        sys.exit(f"Corpus introuvable : {CORPUS}")

    roman = Counter()
    arabic = Counter()
    docs = 0
    with io.open(CORPUS, encoding="utf-8") as f:
        for line in f:
            try:
                text = json.loads(line).get("text", "")
            except json.JSONDecodeError:
                continue
            docs += 1
            if ARABIC_RE.search(text):
                for tok in AR_TOKEN_RE.findall(normalize_arabic(text)):
                    if len(tok) >= MIN_LEN:
                        arabic[tok] += 1
            else:
                for tok in TOKEN_RE.findall(text.lower()):
                    if len(tok) >= MIN_LEN and tok not in FR_EN_COMMON and not tok.isdigit():
                        roman[tok] += 1

    # Romanisé : privilégier l'arabizi (3/7/9 = lettres arabes) puis la fréquence
    arabizi = [(t, c) for t, c in roman.items() if re.search(r"[379]", t)]
    plain = [(t, c) for t, c in roman.items() if not re.search(r"[379]", t)]
    arabizi.sort(key=lambda x: -x[1])
    plain.sort(key=lambda x: -x[1])
    roman_final = {t for t, c in arabizi if c >= 2}
    for t, c in plain:
        if len(roman_final) >= TOP_ROMAN:
            break
        if c >= 5:                     # seuil plus strict pour les mots sans 3/7/9
            roman_final.add(t)

    arabic_final = {t for t, _ in arabic.most_common(TOP_ARABIC)}

    header = (
        '"""\nLexique darija — GÉNÉRÉ par scripts/build_darija_lexicon.py depuis le\n'
        f"corpus CleanData ({docs} commentaires tunisiens réels). Ne pas éditer à la main.\n"
        'Utilisé par language.py pour détecter le tounsi (surtout romanisé/arabizi).\n"""\n\n'
    )
    body = (
        "DARIJA_ROMAN = frozenset({\n    "
        + ",\n    ".join(repr(t) for t in sorted(roman_final))
        + ",\n})\n\nDARIJA_ARABIC = frozenset({\n    "
        + ",\n    ".join(repr(t) for t in sorted(arabic_final))
        + ",\n})\n"
    )
    OUT.write_text(header + body, encoding="utf-8")
    print(f"corpus: {docs} docs | lexique romanisé: {len(roman_final)} | arabe: {len(arabic_final)}")
    print(f"écrit → {OUT}")


if __name__ == "__main__":
    main()
