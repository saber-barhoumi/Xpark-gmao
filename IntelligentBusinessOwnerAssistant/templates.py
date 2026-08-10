"""Chargement des gabarits de courriel et des libellés métier.

Ce module est le SEUL point de contact entre le code Python et le dossier
``assets``. Il ne contient ni HTML, ni couleur, ni libellé français : tout
cela vit dans des fichiers que l'on peut relire, corriger et faire valider
sans ouvrir une ligne de Python.

    assets/charte.css     couleurs de la charte, source unique
    assets/alerte.html    gabarit d'une alerte
    assets/resume.html    gabarit du résumé groupé
    assets/libelles.json  traduction métier des champs et des événements
    assets/logo.png       logo joint au message (cid:xpark-logo)

Les fichiers sont lus une fois puis gardés en mémoire : un courriel se
formate sans toucher au disque. ``recharger()`` vide ce cache, ce dont se
servent les tests.
"""

import json
import logging
import os
import re
from typing import Dict

logger = logging.getLogger("iboa.templates")

DOSSIER_ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
LOGO = os.path.join(DOSSIER_ASSETS, "logo.png")
LOGO_CID = "xpark-logo"

_cache: Dict[str, object] = {}

# --- charte.css -------------------------------------------------------------
# On ne retient que les declarations « --nom: valeur; » : le fichier reste un
# CSS valide, lisible et colorise par n'importe quel editeur, tout en servant
# de table de correspondance.
_DECLARATION = re.compile(r"--([a-z0-9-]+)\s*:\s*([^;]+);")


def couleurs() -> Dict[str, str]:
    """Couleurs de la charte, lues dans assets/charte.css."""
    if "couleurs" not in _cache:
        with open(os.path.join(DOSSIER_ASSETS, "charte.css"), encoding="utf-8") as f:
            contenu = f.read()
        _cache["couleurs"] = {
            nom: valeur.strip() for nom, valeur in _DECLARATION.findall(contenu)}
        logger.info("Charte chargée : %d couleurs", len(_cache["couleurs"]))
    return _cache["couleurs"]


def libelles() -> dict:
    """Traduction métier, lue dans assets/libelles.json."""
    if "libelles" not in _cache:
        with open(os.path.join(DOSSIER_ASSETS, "libelles.json"), encoding="utf-8") as f:
            _cache["libelles"] = json.load(f)
    return _cache["libelles"]


def gabarit(nom: str) -> str:
    """Contenu brut d'un gabarit HTML (sans substitution)."""
    cle = "gabarit:" + nom
    if cle not in _cache:
        with open(os.path.join(DOSSIER_ASSETS, nom), encoding="utf-8") as f:
            _cache[cle] = f.read()
    return _cache[cle]


# Les gabarits portent un commentaire qui documente leurs marqueurs. Utile a
# la lecture du fichier, inutile dans la boite de reception : on le retire au
# rendu. Les commentaires conditionnels destines a Outlook (<!--[if mso]>)
# sont preserves, car ceux-la sont des instructions, pas des explications.
_COMMENTAIRE = re.compile(r"<!--(?!\[if)(?:(?!-->).)*-->", re.DOTALL)


def rendre(nom_gabarit: str, valeurs: Dict[str, str]) -> str:
    """Remplit un gabarit.

    Les couleurs de la charte sont ajoutées d'office, si bien qu'un gabarit
    peut écrire ``{{couleur-accent}}`` sans que l'appelant ait à s'en soucier.
    Un marqueur inconnu reste tel quel plutôt que de faire échouer l'envoi :
    une alerte amputée d'un champ vaut mieux qu'une alerte jamais partie.
    """
    contexte = dict(couleurs())
    contexte.update(valeurs)

    sortie = _COMMENTAIRE.sub("", gabarit(nom_gabarit))
    for cle, valeur in contexte.items():
        sortie = sortie.replace("{{" + cle + "}}", str(valeur))

    restants = re.findall(r"\{\{([a-zA-Z0-9_-]+)\}\}", sortie)
    if restants:
        logger.warning("Marqueurs non remplis dans %s : %s",
                       nom_gabarit, ", ".join(sorted(set(restants))))
    return sortie


def recharger() -> None:
    """Vide le cache — les fichiers seront relus au prochain appel."""
    _cache.clear()
