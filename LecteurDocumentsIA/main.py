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
GROQ_CLE = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODELE_VISION = os.getenv("GROQ_VISION_MODEL",
                          "meta-llama/llama-4-scout-17b-16e-instruct")

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
        "fournisseurConfigure": bool(GROQ_CLE),
        "verificationAccesActive": bool(JWT_CLE),
        "modele": MODELE_VISION,
    }


@app.post("/extraire")
async def extraire(
        fichier: UploadFile = File(...),
        typeDocument: str = Form("AUTO"),
        appelant: str = Depends(utilisateur_courant)):
    """Extrait les champs d'un document. Le fichier n'est jamais conservé."""
    if not GROQ_CLE:
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
                GROQ_URL, json=corps,
                headers={"Authorization": "Bearer %s" % GROQ_CLE})
    except httpx.RequestError as exc:
        logger.exception("Fournisseur injoignable")
        raise HTTPException(502, "Service de lecture injoignable : %s" % exc)

    if reponse.status_code == 401:
        # Ne jamais relayer le message du fournisseur au navigateur : il peut
        # contenir des elements sur le compte. Le detail reste au journal.
        logger.error("Clé du fournisseur refusée (401) — clé absente, "
                     "révoquée ou expirée")
        raise HTTPException(
            503, "Lecture de documents momentanément indisponible. "
                 "Saisissez les champs manuellement.")
    if reponse.status_code >= 400:
        logger.error("Fournisseur en erreur %s : %s",
                     reponse.status_code, reponse.text[:300])
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
