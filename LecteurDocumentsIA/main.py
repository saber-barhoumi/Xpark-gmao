"""LecteurDocumentsIA — lecture assistée des documents administratifs.

Port 8002. Reçoit une carte grise, une assurance, une vignette, une visite
technique, un permis de conduire ou un reçu de carburant, et en extrait les
champs exploitables sous forme de JSON.

POURQUOI CE SERVICE EXISTE
--------------------------
L'extraction se faisait auparavant depuis le navigateur : le composant
d'import appelait directement l'API du fournisseur, avec la clé dans
l'en-tête. Toute personne ouvrant les outils de développement pouvait la
lire dans le paquet JavaScript, et s'en servir sur son propre compte.

Une clé d'API est un secret de serveur. Elle ne peut pas être protégée dans
un navigateur : tout ce que le navigateur exécute, l'utilisateur peut le
lire. Le seul remède est de ne jamais l'y envoyer — d'où ce service, qui
détient la clé et l'utilise pour le compte du front.

Le service exige un jeton d'accès valide : sans cela, il offrirait à
n'importe qui un accès anonyme au fournisseur, aux frais de l'entreprise.
"""

import base64
import json
import logging
import os
import re
from typing import Optional

import httpx
import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%H:%M:%S")
logger = logging.getLogger("lecteur-documents")

# --- Fournisseur ------------------------------------------------------------
#  DEUX FOURNISSEURS PORTENT DES NOMS QUASI IDENTIQUES, ET CE N'EST PAS LE
#  MEME SERVICE :
#
#     Groq  — api.groq.com — heberge des modeles ouverts. Cles en « gsk_… »
#     Grok  — api.x.ai     — le modele de xAI.           Cles en « xai_… »
#
#  Une cle de l'un presentee a l'autre repond 401, sans plus d'explication.
#  L'adresse et le modele sont donc configurables : la meme image de
#  conteneur sert avec l'un ou l'autre, sans modification de code.
FOURNISSEURS = {
    "groq": ("https://api.groq.com/openai/v1/chat/completions",
             "meta-llama/llama-4-scout-17b-16e-instruct"),
    # grok-4 et non grok-2-vision-1212 : la generation 2 a ete retiree et
    # l'API repond « Model not found » sur tous ses noms. Verifie en sondant
    # le compte : seuls grok-3 et grok-4 sont reconnus.
    "xai":  ("https://api.x.ai/v1/chat/completions",
             "grok-4"),
}

_url_defaut, _modele_defaut = FOURNISSEURS.get(
    os.getenv("OCR_FOURNISSEUR", "groq").lower(), FOURNISSEURS["groq"])

# GROQ_API_KEY reste accepte : c'est le nom employe avant l'ouverture a
# plusieurs fournisseurs.
# « or » et non le defaut de getenv : docker-compose definit ces variables
# meme lorsqu'elles sont vides (« OCR_API_URL=${OCR_API_URL:-} »). Avec
# os.getenv(nom, defaut), une variable definie a la chaine vide l'emporterait
# sur le defaut, et le service appellerait une adresse vide.
FOURNISSEUR_CLE = os.getenv("OCR_API_KEY") or os.getenv("GROQ_API_KEY") or ""
FOURNISSEUR_URL = os.getenv("OCR_API_URL") or _url_defaut
MODELE_VISION = (os.getenv("OCR_VISION_MODEL")
                 or os.getenv("GROQ_VISION_MODEL")
                 or _modele_defaut)

# --- Jeton d'acces ----------------------------------------------------------
JWT_CLE = os.getenv("Jwt__Key", "")
JWT_EMETTEUR = os.getenv("Jwt__Issuer", "XparkGMAO")
JWT_AUDIENCE = os.getenv("Jwt__Audience", "XparkGMAO")

TAILLE_MAX = 20 * 1024 * 1024        # 20 Mo, comme l'ancienne limite du front
TYPES_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}

app = FastAPI(title="XparkGMAO — LecteurDocumentsIA", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"])

securite = HTTPBearer(auto_error=False)


@app.on_event("startup")
def annoncer_configuration():
    """Dit au démarrage ce qui est prêt et ce qui manque.

    Sans cette trace, une clé absente ne se manifeste qu'au premier envoi
    de document, par un 503 côté navigateur. Le journal du conteneur
    permet de le savoir avant, et d'un seul coup d'œil.
    """
    logger.info("Fournisseur : %s (modèle %s)", FOURNISSEUR_URL, MODELE_VISION)
    if FOURNISSEUR_CLE:
        # Le prefixe suffit a reconnaitre le fournisseur sans rien divulguer.
        logger.info("Clé chargée (%d caractères, commence par « %s »)",
                    len(FOURNISSEUR_CLE), FOURNISSEUR_CLE[:4])
        attendu = "gsk_" if "groq.com" in FOURNISSEUR_URL else "xai-"
        if not FOURNISSEUR_CLE.startswith(attendu):
            logger.warning(
                "La clé ne commence pas par « %s », préfixe attendu pour %s. "
                "Groq (api.groq.com, clés « gsk_ ») et Grok/xAI (api.x.ai, "
                "clés « xai- ») sont deux services distincts : une clé de "
                "l'un est refusée par l'autre avec un 401. Vérifiez "
                "OCR_FOURNISSEUR.",
                attendu, FOURNISSEUR_URL)
    else:
        logger.warning(
            "AUCUNE CLÉ : la lecture de documents répondra 503. Renseignez "
            "OCR_API_KEY dans le .env de la racine, puis relancez avec "
            "« docker compose up -d --build ocr ».")


def utilisateur_courant(
        creds: Optional[HTTPAuthorizationCredentials] = Depends(securite)) -> str:
    """Vérifie le jeton d'accès et renvoie l'identifiant de l'appelant.

    Même clé, même émetteur et même audience que les services .NET : le
    jeton délivré à la connexion vaut ici sans traitement particulier.
    """
    if not JWT_CLE:
        # Refuser plutot que d'ouvrir en grand : une cle de signature
        # absente est une erreur de deploiement, pas un mode degrade.
        raise HTTPException(503, "Vérification des accès indisponible")
    if creds is None:
        raise HTTPException(401, "Jeton d'accès absent")
    try:
        charge = jwt.decode(creds.credentials, JWT_CLE, algorithms=["HS256"],
                            issuer=JWT_EMETTEUR, audience=JWT_AUDIENCE)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expirée")
    except jwt.InvalidTokenError as exc:
        logger.warning("Jeton refusé : %s", exc)
        raise HTTPException(401, "Jeton d'accès invalide")
    return str(charge.get("userId") or charge.get("sub") or "inconnu")


CONSIGNE = """Tu es le module de lecture de documents de XPARK GMAO.
Analyse l'image du document fourni et extrais TOUTES les données visibles.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT avec un objet JSON plat valide — aucun texte autour,
   aucun markdown, aucun objet imbriqué.
2. Lis ATTENTIVEMENT chaque valeur visible (chiffres, textes, dates).
3. Utilise STRICTEMENT ces noms de clés, n'en invente pas :
   - Véhicule : "immatriculation", "marque", "modele", "vin",
     "datePremiereCirculation", "couleur", "carburant"
   - Carburant : "quantite", "prixUnitaire", "montantTotal",
     "dateRemplissage", "carburant"
   - Permis de conduire tunisien :
     * "nom" (champ « 1. » du permis)
     * "prenom" (champ « 2. »)
     * "numeroPermis" (champ « 5. », le numéro unique)
     * "categoriePermis" (champ « 9. », ex. "A", "B", "A B H")
     * "dateExpirationPermis" (champ « 4b. »)
     * ATTENTION : « A.T.T.T » désigne l'Agence Technique des Transports
       Terrestres. Ce n'est ni un nom ni un prénom.
4. Ajoute toujours "documentDetecte" (ex. "CARTE_GRISE") et "confidence"
   (nombre entre 0.85 et 0.99).
5. Les dates sont TOUJOURS au format "YYYY-MM-DD".
6. Les nombres sont des nombres, jamais entre guillemets, avec un point
   décimal (929.36 et non "929,36").
7. Ne retourne QUE l'objet JSON : commence par { et termine par }."""


def _extraire_json(texte: str) -> dict:
    """Isole l'objet JSON de la réponse du modèle.

    Malgré la consigne, un modèle encadre parfois sa réponse d'une clôture
    markdown ou d'une phrase d'introduction.
    """
    nettoye = re.sub(r"```(?:json)?", "", texte).strip()
    trouve = re.search(r"\{[\s\S]*\}", nettoye)
    if not trouve:
        raise ValueError("aucun objet JSON dans la réponse du modèle")
    return json.loads(trouve.group(0))


@app.get("/health")
def sante():
    return {
        "status": "healthy",
        "service": "LecteurDocumentsIA",
        "fournisseurConfigure": bool(FOURNISSEUR_CLE),
        "fournisseurUrl": FOURNISSEUR_URL,
        "verificationAccesActive": bool(JWT_CLE),
        "modele": MODELE_VISION,
    }


# Les DEUX ecritures sont declarees, avec et sans barre finale.
#
# L'intercepteur du front ajoute une barre finale a chaque URL — un
# contournement d'un ancien 301 de nginx, qui transformait les POST en GET.
# Face a « /extraire/ », FastAPI redirige vers « /extraire » par un 307 dont
# l'adresse est ABSOLUE, reconstruite depuis l'en-tete Host. Derriere deux
# nginx successifs, cet en-tete ne porte plus le port : le navigateur suivait
# la redirection vers « http://localhost/extraire », c'est-a-dire le port 80,
# ou rien n'ecoute — d'ou une erreur reseau incomprehensible cote client.
#
# Declarer les deux formes supprime la redirection, donc le probleme, quelle
# que soit l'ecriture employee par l'appelant.
@app.post("/extraire")
@app.post("/extraire/", include_in_schema=False)
async def extraire(
        fichier: UploadFile = File(...),
        typeDocument: str = Form("AUTO"),
        appelant: str = Depends(utilisateur_courant)):
    """Extrait les champs d'un document. Le fichier n'est jamais conservé."""
    if not FOURNISSEUR_CLE:
        raise HTTPException(503, "Lecture de documents non configurée sur le serveur")

    contenu = await fichier.read()
    if len(contenu) > TAILLE_MAX:
        raise HTTPException(413, "Fichier trop volumineux (20 Mo maximum)")
    if fichier.content_type not in TYPES_IMAGE:
        raise HTTPException(
            415, "Seules les images sont lues (JPEG, PNG, WebP). "
                 "Pour un PDF, en fournir une capture.")

    logger.info("Lecture de %s (%s, %.0f Ko) demandée par l'utilisateur %s",
                fichier.filename, typeDocument, len(contenu) / 1024, appelant)

    image = "data:%s;base64,%s" % (fichier.content_type,
                                   base64.b64encode(contenu).decode())

    corps = {
        "model": MODELE_VISION,
        "temperature": 0.1,
        "max_tokens": 1024,
        "messages": [
            {"role": "system", "content": CONSIGNE},
            {"role": "user", "content": [
                {"type": "text",
                 "text": "Analyse cette image de document (type attendu : %s). "
                         "Extrais toutes les données visibles et renvoie-les "
                         "en JSON." % typeDocument},
                {"type": "image_url", "image_url": {"url": image}},
            ]},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            reponse = await client.post(
                FOURNISSEUR_URL, json=corps,
                headers={"Authorization": "Bearer %s" % FOURNISSEUR_CLE})
    except httpx.RequestError as exc:
        logger.exception("Fournisseur injoignable")
        raise HTTPException(502, "Service de lecture injoignable : %s" % exc)

    # Le message du fournisseur n'est JAMAIS relaye au navigateur : il porte
    # l'identifiant de l'equipe, l'etat du credit, parfois le nom du compte.
    # Le detail reste au journal, ou l'exploitant peut le lire.
    if reponse.status_code >= 400:
        logger.error("Fournisseur en erreur %s : %s",
                     reponse.status_code, reponse.text[:400])

    if reponse.status_code == 401:
        logger.error("Clé refusée : absente, révoquée, ou destinée à l'autre "
                     "fournisseur (Groq attend « gsk_ », xAI attend « xai- »)")
        raise HTTPException(
            503, "Lecture de documents momentanément indisponible. "
                 "Saisissez les champs manuellement.")

    if reponse.status_code in (402, 403, 429):
        # Credit epuise, plafond mensuel atteint, ou trop d'appels. Cas
        # administratif : rien ne se debloquera en reessayant tout de suite,
        # et l'utilisateur doit le savoir plutot que de recommencer.
        logger.error("Accès refusé ou quota atteint sur le compte du "
                     "fournisseur — vérifier le crédit et le plafond de "
                     "dépense sur la console du fournisseur")
        raise HTTPException(
            503, "Lecture de documents indisponible : le compte du service "
                 "d'analyse a atteint sa limite. Saisissez les champs "
                 "manuellement et prévenez l'administrateur.")

    if reponse.status_code >= 400:
        raise HTTPException(502, "Le service de lecture a refusé la demande")

    try:
        texte = reponse.json()["choices"][0]["message"]["content"]
        donnees = _extraire_json(texte)
    except (KeyError, IndexError, ValueError, json.JSONDecodeError) as exc:
        logger.error("Réponse illisible : %s", exc)
        raise HTTPException(502, "Document non exploitable, saisie manuelle nécessaire")

    logger.info("Document lu : %d champs extraits", len(donnees))
    return donnees


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
