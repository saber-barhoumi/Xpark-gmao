"""Tests du service de lecture de documents — lancement : python test_lecteur.py

Aucune dépendance externe : ni conteneur, ni clé de fournisseur. L'appel au
fournisseur est simulé, ce qui permet d'éprouver la chaîne complète —
contrôle d'accès, validation du fichier, appel, analyse de la réponse,
traduction des pannes — y compris les cas d'échec, qu'un essai manuel avec
une vraie clé ne produit jamais à la demande.
"""

import base64
import hashlib
import hmac
import io
import json
import os
import sys
import time

# L'environnement doit etre pose AVANT l'import de main : le module lit sa
# configuration au chargement.
CLE_JWT = "cle_de_test_suffisamment_longue_pour_hs256_0123456789"
os.environ["Jwt__Key"] = CLE_JWT
os.environ["Jwt__Issuer"] = "XparkGMAO"
os.environ["Jwt__Audience"] = "XparkGMAO"
os.environ["OCR_API_KEY"] = "gsk_cle_de_test"
os.environ["OCR_FOURNISSEUR"] = "groq"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import httpx                                    # noqa: E402
from fastapi.testclient import TestClient       # noqa: E402

import main                                     # noqa: E402

client = TestClient(main.app)

# PNG valide de 1 pixel
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQ"
    "AAAABJRU5ErkJggg==")


def _b64(donnees: bytes) -> str:
    return base64.urlsafe_b64encode(donnees).decode().rstrip("=")


def jeton(minutes: int = 60, emetteur: str = "XparkGMAO") -> str:
    maintenant = int(time.time())
    entete = {"alg": "HS256", "typ": "JWT"}
    charge = {"sub": "1", "userId": "7", "iat": maintenant,
              "exp": maintenant + minutes * 60,
              "iss": emetteur, "aud": "XparkGMAO"}
    signe = _b64(json.dumps(entete).encode()) + "." + _b64(json.dumps(charge).encode())
    sig = hmac.new(CLE_JWT.encode(), signe.encode(), hashlib.sha256).digest()
    return signe + "." + _b64(sig)


def envoyer(chemin="/extraire", jeton_acces=None, contenu=PNG,
            type_mime="image/png", type_doc="CARTE_GRISE"):
    entetes = {"Authorization": "Bearer " + jeton_acces} if jeton_acces else {}
    return client.post(
        chemin,
        files={"fichier": ("doc.png", io.BytesIO(contenu), type_mime)},
        data={"typeDocument": type_doc},
        headers=entetes)


class FausseReponse:
    """Réponse du fournisseur, simulée."""

    def __init__(self, status_code, charge=None, texte=""):
        self.status_code = status_code
        self._charge = charge
        self.text = texte

    def json(self):
        if self._charge is None:
            raise ValueError("pas de JSON")
        return self._charge


def simuler_fournisseur(reponse):
    """Remplace l'appel réseau par une réponse fixée."""
    async def _post(self, url, **kwargs):
        simuler_fournisseur.derniere_url = url
        simuler_fournisseur.dernier_corps = kwargs.get("json")
        simuler_fournisseur.derniers_entetes = kwargs.get("headers", {})
        if isinstance(reponse, Exception):
            raise reponse
        return reponse
    httpx.AsyncClient.post = _post


def simuler_suite(reponses):
    """Répond différemment à chaque appel — pour éprouver les reprises."""
    suite = list(reponses)
    simuler_suite.corps = []

    async def _post(self, url, **kwargs):
        simuler_suite.corps.append(kwargs.get("json"))
        return suite.pop(0) if suite else suite[-1]
    httpx.AsyncClient.post = _post


def reponse_modele(contenu: str):
    return FausseReponse(200, {"choices": [{"message": {"content": contenu}}]})


essais = []


def verifier(libelle, condition, detail=""):
    essais.append((libelle, bool(condition), detail))
    print("%-4s %s%s" % ("OK" if condition else "ECHEC", libelle,
                         "" if condition else "  → " + str(detail)))


# ── Contrôle d'accès ─────────────────────────────────────────────────────────
# Le service ne doit jamais travailler pour un inconnu : chaque lecture est
# facturée au compte de l'entreprise.

r = envoyer()
verifier("appel anonyme refusé", r.status_code == 401, r.text)

r = envoyer(jeton_acces="pas.un.jeton")
verifier("jeton malformé refusé", r.status_code == 401, r.text)

r = envoyer(jeton_acces=jeton(minutes=-5))
verifier("jeton expiré refusé", r.status_code == 401, r.text)

r = envoyer(jeton_acces=jeton(emetteur="AutreEmetteur"))
verifier("jeton d'un autre émetteur refusé", r.status_code == 401, r.text)

# ── Validation du fichier ────────────────────────────────────────────────────

r = envoyer(jeton_acces=jeton(), contenu=b"%PDF-1.4 ...", type_mime="application/pdf")
verifier("PDF refusé, jamais inventé", r.status_code == 415, r.text)

r = envoyer(jeton_acces=jeton(), contenu=b"x" * (21 * 1024 * 1024))
verifier("fichier de 21 Mo refusé", r.status_code == 413, r.text)

# ── Lecture réussie ──────────────────────────────────────────────────────────

simuler_fournisseur(reponse_modele(
    '{"immatriculation":"156 TUN 4520","marque":"Iveco","confidence":0.94}'))
r = envoyer(jeton_acces=jeton())
verifier("lecture réussie", r.status_code == 200, r.text)
verifier("champs extraits", r.status_code == 200 and
         r.json().get("immatriculation") == "156 TUN 4520", r.text)
verifier("la clé part vers le fournisseur, pas vers le navigateur",
         "gsk_cle_de_test" in simuler_fournisseur.derniers_entetes.get("Authorization", "")
         and "gsk_" not in r.text)

# Le modele encadre souvent sa reponse malgre la consigne.
simuler_fournisseur(reponse_modele(
    'Voici le résultat :\n```json\n{"marque":"Renault"}\n```\nBonne journée.'))
r = envoyer(jeton_acces=jeton())
verifier("réponse encadrée de markdown analysée quand même",
         r.status_code == 200 and r.json().get("marque") == "Renault", r.text)

# Modele a raisonnement : il expose sa reflexion avant de repondre. Ce bloc
# contient des accolades et des bouts de JSON — le laisser ferait analyser
# n'importe quoi. Cas rencontre en conditions reelles avec qwen3.6.
simuler_fournisseur(reponse_modele(
    '<think>\nLe champ D.1 vaut "IVECO". Je vais construire :\n'
    '{"marque": "brouillon"}\nNon, plutot ceci.\n</think>\n'
    '{"marque":"IVECO","immatriculation":"156 TUN 4520"}'))
r = envoyer(jeton_acces=jeton())
verifier("bloc de réflexion ignoré, vraie réponse retenue",
         r.status_code == 200 and r.json().get("marque") == "IVECO", r.text)

# Reflexion jamais refermee : la reponse a ete coupee, il n'y a rien a lire.
simuler_fournisseur(reponse_modele('<think>\nJe reflechis {"a":1} et je suis coupe'))
r = envoyer(jeton_acces=jeton())
verifier("réflexion non refermée → 502 et non un JSON de brouillon",
         r.status_code == 502, r.text)

# Le fournisseur signale lui-meme la troncature.
simuler_fournisseur(FausseReponse(200, {"choices": [
    {"message": {"content": '{"marque":"Ive'}, "finish_reason": "length"}]}))
r = envoyer(jeton_acces=jeton())
verifier("réponse tronquée annoncée → 502 explicite",
         r.status_code == 502 and "incompl" in r.text.lower(), r.text)

# ── Les deux écritures de la route ───────────────────────────────────────────
# L'intercepteur du front ajoute une barre finale ; sans cette double
# déclaration, FastAPI répondait par une redirection absolue qui perdait le
# port et cassait l'appel côté navigateur.

simuler_fournisseur(reponse_modele('{"marque":"Fiat"}'))
r = client.post("/extraire/",
                files={"fichier": ("d.png", io.BytesIO(PNG), "image/png")},
                data={"typeDocument": "AUTO"},
                headers={"Authorization": "Bearer " + jeton()},
                follow_redirects=False)
verifier("« /extraire/ » répond sans redirection",
         r.status_code == 200, "%s %s" % (r.status_code, r.headers.get("location", "")))

# ── Pannes du fournisseur ────────────────────────────────────────────────────

simuler_fournisseur(FausseReponse(401, {"error": {"message": "Invalid API Key"}},
                                  "Invalid API Key"))
r = envoyer(jeton_acces=jeton())
verifier("clé refusée → 503 et non 401",
         r.status_code == 503, r.text)
verifier("le message du fournisseur n'est pas relayé",
         "Invalid API Key" not in r.text, r.text)

# Credit epuise : le cas rencontre en conditions reelles sur xAI. Ce n'est
# pas une panne mais une limite administrative : le message doit le dire, et
# ne surtout pas divulguer l'identifiant d'equipe que renvoie le fournisseur.
simuler_fournisseur(FausseReponse(
    403, {"code": "permission-denied",
          "error": "Your team ccd6dbbb-3595 has either used all available credits"},
    "Your team ccd6dbbb-3595 has either used all available credits"))
r = envoyer(jeton_acces=jeton())
verifier("crédit épuisé → 503 avec message explicite",
         r.status_code == 503 and "limite" in r.text, r.text)
verifier("l'identifiant d'équipe du fournisseur reste au journal",
         "ccd6dbbb" not in r.text, r.text)

simuler_fournisseur(FausseReponse(429, {"error": {"message": "rate limit"}}, "rate limit"))
r = envoyer(jeton_acces=jeton())
verifier("trop d'appels → 503", r.status_code == 503, r.text)

simuler_fournisseur(FausseReponse(
    400, {"code": "invalid-argument", "error": "Model not found: grok-2-vision-1212"},
    "Model not found"))
r = envoyer(jeton_acces=jeton())
verifier("modèle inconnu → 502", r.status_code == 502, r.text)

simuler_fournisseur(httpx.ConnectError("injoignable"))
r = envoyer(jeton_acces=jeton())
verifier("fournisseur injoignable → 502", r.status_code == 502, r.text)

simuler_fournisseur(reponse_modele("je ne sais pas lire ce document"))
r = envoyer(jeton_acces=jeton())
verifier("réponse sans JSON → 502 et non une erreur 500",
         r.status_code == 502, r.text)

# ── Raisonnement désactivé ───────────────────────────────────────────────────
# Extraire n'est pas raisonner. Sur le document d'essai, la dissertation du
# modèle coûtait 731 jetons contre 140 sans elle, et sur une carte grise
# photographiée elle consommait tout le plafond : le JSON arrivait tronqué.

simuler_suite([reponse_modele('{"marque":"Iveco"}')])
r = envoyer(jeton_acces=jeton())
verifier("« reasoning_effort: none » est demandé par défaut",
         simuler_suite.corps[0].get("reasoning_effort") == "none",
         simuler_suite.corps[0].get("reasoning_effort"))

# Tous les modeles ne connaissent pas ce parametre. Plutot que de tenir une
# liste qui vieillirait, on essaie et on recommence sans lui si besoin.
simuler_suite([
    FausseReponse(400, {"error": {"message": "unknown parameter reasoning_effort"}},
                  "unknown parameter reasoning_effort"),
    reponse_modele('{"marque":"Renault"}')])
r = envoyer(jeton_acces=jeton())
verifier("paramètre refusé → nouvel essai sans lui",
         r.status_code == 200 and r.json().get("marque") == "Renault", r.text)
verifier("le second essai ne le porte plus",
         len(simuler_suite.corps) == 2
         and "reasoning_effort" not in simuler_suite.corps[1], simuler_suite.corps)

# ── Configuration ────────────────────────────────────────────────────────────

verifier("santé annonce le fournisseur",
         client.get("/health").json()["fournisseurUrl"] == main.FOURNISSEUR_URL)

sans_cle = main.FOURNISSEUR_CLE
main.FOURNISSEUR_CLE = ""
r = envoyer(jeton_acces=jeton())
verifier("sans clé → 503, jamais un appel au hasard", r.status_code == 503, r.text)
main.FOURNISSEUR_CLE = sans_cle

# ── Bilan ────────────────────────────────────────────────────────────────────

echecs = [libelle for libelle, ok, _ in essais if not ok]
print("\n%d vérifications, %d échec(s)" % (len(essais), len(echecs)))
if echecs:
    for libelle in echecs:
        print("   ECHEC : %s" % libelle)
    sys.exit(1)
print("TOUS LES TESTS DU LECTEUR DE DOCUMENTS PASSENT")
