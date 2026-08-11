# Lecture assistée des documents administratifs

> Service `LecteurDocumentsIA` — port **8002**
> Route publique : `POST /api/ocr/extraire`

Ce document décrit le service qui lit les cartes grises, assurances,
vignettes, visites techniques, permis de conduire et reçus de carburant pour
pré-remplir les formulaires de la plateforme.

Il explique aussi **pourquoi le service existe** : la version précédente
fonctionnait, mais exposait une clé d'API à tous les visiteurs.

---

## 1. Le problème de sécurité corrigé

### 1.1 Ce qui se passait

Le composant d'import appelait le fournisseur **depuis le navigateur** :

```ts
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

await fetch('https://api.groq.com/openai/v1/chat/completions', {
  headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
  …
})
```

Vite remplace `import.meta.env.VITE_…` par sa valeur **au moment de la
compilation**. La clé n'était donc pas lue à l'exécution depuis un fichier de
configuration : elle était **écrite en clair dans le fichier JavaScript
livré**, et récupérable ainsi :

```
Outils de développement → Sources → assets/OCRUploadZone-….js → chercher « gsk_ »
```

Vérification faite sur le paquet alors en service : la clé s'y trouvait, en
un seul exemplaire, parfaitement lisible.

### 1.2 Pourquoi aucun réglage n'y changeait rien

Le préfixe `VITE_` ne protège pas : il **autorise** au contraire l'inclusion
de la variable dans le paquet. Les variables sans ce préfixe sont simplement
absentes du navigateur.

Plus généralement : **tout ce que le navigateur exécute, l'utilisateur peut le
lire**. Minification, encodage, découpage en morceaux — rien de tout cela n'est
un secret, seulement un ralentissement. Le seul remède est de ne jamais
envoyer la clé au navigateur.

### 1.3 Étendue de l'exposition

| Vérification | Résultat |
|---|---|
| Clé présente dans un commit | **non** — `git log -S "gsk_"` ne renvoie rien |
| Dossier `dist/` versionné | **non** — absent de l'index Git |
| `.env.local` versionné | **non** — couvert par `*.local` dans `.gitignore` |
| Clé présente dans le paquet servi | **oui**, jusqu'à cette correction |

L'exposition se limitait donc aux personnes ayant chargé l'application dans
leur navigateur. Elle n'a jamais atteint le dépôt distant. La clé concernée
répondait déjà `401 Unauthorized` au moment du diagnostic : elle était
révoquée ou invalide.

### 1.4 Ce qui a été fait

- Le service front n'appelle plus le fournisseur ; il envoie le fichier à
  `POST /api/ocr/extraire`.
- Les variables `VITE_GROQ_API_KEY` et `VITE_GROQ_MODEL` ont été retirées de
  `frontend/backoffice/.env.local`, pour qu'aucune compilation ultérieure ne
  puisse les réinjecter.
- La clé vit désormais dans `GROQ_API_KEY`, lue uniquement par ce service.

**Action restant à votre charge : générer une nouvelle clé** sur
<https://console.groq.com/keys> et la placer dans le `.env` de la racine.
Une clé ayant été publiée doit être considérée comme compromise, même
révoquée.

---

## 2. Chemin d'une lecture

```
Navigateur
   │  POST /api/ocr/extraire      (multipart : fichier + typeDocument)
   │  Authorization: Bearer <jeton de session>
   ▼
nginx du back-office (port 3000)
   │  location /api/ocr/  →  /ocr/…        client_max_body_size 25M
   ▼
passerelle (nginx)
   │  location /ocr/      →  ocr:8002
   ▼
LecteurDocumentsIA (FastAPI)
   │  1. vérifie le jeton de session
   │  2. contrôle la taille et le type du fichier
   │  3. encode l'image et appelle le fournisseur avec SA clé
   │  4. isole l'objet JSON de la réponse
   ▼
   { "immatriculation": "…", "marque": "…", "confidence": 0.93 }
```

Le fichier **n'est jamais écrit sur disque** : il est lu en mémoire, encodé,
transmis, puis abandonné. Aucune copie du document d'un client ne subsiste.

---

## 3. Contrôle d'accès

Le service refuse tout appel anonyme. Sans cela, il offrirait à quiconque
connaît l'adresse un accès gratuit au fournisseur, facturé à l'entreprise —
le problème même que la correction vise à supprimer.

Le jeton est vérifié avec **la même clé, le même émetteur et la même audience**
que les services .NET : le jeton délivré à la connexion vaut ici sans
traitement particulier.

Comportement mesuré, aux deux frontières :

| Appel | Réponse |
|---|---|
| sans jeton | `401 Jeton d'accès absent` |
| jeton malformé | `401 Jeton d'accès invalide` |
| jeton expiré | `401 Session expirée` |
| jeton valide, clé fournisseur absente | `503 Lecture de documents non configurée` |

Une clé de signature absente provoque un `503`, jamais une ouverture : une
configuration incomplète ne doit pas se traduire par un service sans
protection.

---

## 4. Ce que le modèle extrait

Le modèle de vision reçoit l'image et une consigne stricte : répondre par un
objet JSON plat, sans texte autour.

| Famille | Clés produites |
|---|---|
| Véhicule | `immatriculation`, `marque`, `modele`, `vin`, `datePremiereCirculation`, `couleur`, `carburant` |
| Carburant | `quantite`, `prixUnitaire`, `montantTotal`, `dateRemplissage` |
| Permis de conduire | `nom`, `prenom`, `numeroPermis`, `categoriePermis`, `dateExpirationPermis` |
| Toujours | `documentDetecte`, `confidence` |

La consigne porte deux précautions apprises à l'usage :

- **Dates** toujours au format `AAAA-MM-JJ`, **nombres** en nombres et non en
  chaînes, avec un point décimal — sans quoi `929,36` arrivait comme texte et
  cassait la saisie.
- **« A.T.T.T »** sur un permis tunisien désigne l'Agence Technique des
  Transports Terrestres. Sans consigne explicite, le modèle le prenait pour un
  nom de famille.

La réponse est nettoyée avant analyse : malgré la consigne, un modèle encadre
parfois sa réponse d'une clôture markdown ou d'une phrase d'introduction.

---

## 5. Le PDF est refusé, et c'est voulu

Le modèle de vision ne lit pas les PDF. La version précédente basculait alors
sur un modèle de texte avec cette consigne :

> « Génère le JSON d'extraction pour le fichier "…". **Génère des données
> réalistes pour la Tunisie.** »

Le modèle ne lisait donc rien : il **inventait** une immatriculation, une
marque, un numéro de châssis, et ces valeurs venaient remplir le formulaire
exactement comme si elles avaient été lues sur le document. Un utilisateur
pressé pouvait enregistrer un véhicule entièrement fictif sans s'en rendre
compte.

Le service refuse désormais explicitement :

```
415 — Seules les images sont lues (JPEG, PNG, WebP).
      Pour un PDF, en fournir une capture.
```

Un refus clair vaut mieux qu'une donnée inventée. C'est le principe qui guide
aussi le reste du service : en cas de doute, ne rien pré-remplir.

---

## 6. Dégradation

Le formulaire reste utilisable en toutes circonstances : la lecture assistée
fait gagner du temps, elle n'est jamais un passage obligé.

| Situation | Réponse | Ce que voit l'utilisateur |
|---|---|---|
| Clé absente ou révoquée | `503` | « Lecture momentanément indisponible. Saisissez les champs manuellement. » |
| Crédit épuisé, plafond atteint, trop d'appels | `503` | « Le compte du service d'analyse a atteint sa limite. Saisissez les champs manuellement et prévenez l'administrateur. » |
| Modèle inconnu du fournisseur | `502` | « Le service de lecture a refusé la demande » |
| Fournisseur injoignable | `502` | « Service de lecture injoignable » |
| Réponse illisible | `502` | « Document non exploitable, saisie manuelle nécessaire » |
| Fichier trop lourd | `413` | « Fichier trop volumineux (20 Mo maximum) » |

Le crédit épuisé est traité à part parce que c'est un cas **administratif** :
rien ne se débloquera en réessayant, et l'utilisateur doit le savoir plutôt
que de recommencer. Le diagnostic exact — identifiant d'équipe, état du
crédit — reste au journal du service.

### Deux pièges rencontrés en conditions réelles

**Les modèles `grok-2-*` ont été retirés.** Tous leurs noms répondent
`400 Model not found`. Sondage du compte : seuls `grok-3` et `grok-4` sont
reconnus, d'où le défaut retenu.

**Le compte xAI n'a pas de palier gratuit.** Un compte sans crédit répond
`403 permission-denied` sur *tous* les modèles, y compris `/v1/models` —
ce qui donne l'impression d'une clé invalide alors qu'elle est parfaitement
valide. Groq offre au contraire un palier gratuit : c'est le fournisseur à
retenir pour une démonstration.

Le message d'erreur du fournisseur n'est **jamais** relayé au navigateur : il
peut contenir des indications sur le compte. Le détail reste au journal du
service.

---

## 7. Configuration

### 7.1 Groq et Grok ne sont pas le même service

C'est la confusion la plus coûteuse de ce module, parce que le symptôme
n'oriente vers rien : un `401`, sans autre explication.

| | **Groq** | **Grok** |
|---|---|---|
| Éditeur | Groq Inc. | xAI |
| Adresse | `api.groq.com` | `api.x.ai` |
| Préfixe de clé | `gsk_…` | `xai-…` |
| Console | console.groq.com/keys | console.x.ai |
| Modèle par défaut | `meta-llama/llama-4-scout-17b-16e-instruct` | `grok-4` |
| Palier gratuit | oui | non — crédit à approvisionner |

Les deux exposent une interface compatible OpenAI, d'où l'illusion
d'interchangeabilité. Une clé de l'un présentée à l'autre est simplement
inconnue : le serveur répond `401 Invalid API Key`.

**Vérifiez le préfixe de votre clé avant de choisir le fournisseur.**

### 7.2 Variables

| Variable | Défaut | Rôle |
|---|---|---|
| `OCR_FOURNISSEUR` | `groq` | `groq` ou `xai` — fixe l'adresse et le modèle |
| `OCR_API_KEY` | *(vide → service en 503)* | clé, **serveur uniquement** |
| `OCR_API_URL` | selon le fournisseur | à ne renseigner que pour en sortir |
| `OCR_VISION_MODEL` | selon le fournisseur | idem |
| `GROQ_API_KEY` | — | ancien nom, encore accepté |
| `Jwt__Key` / `Jwt__Issuer` / `Jwt__Audience` | mêmes valeurs que les services .NET | vérification du jeton |

```bash
# .env de la racine — jamais versionné

# Avec une clé Groq
OCR_FOURNISSEUR=groq
OCR_API_KEY=gsk_…

# Avec une clé xAI
OCR_FOURNISSEUR=xai
OCR_API_KEY=xai-…
```

Les valeurs par défaut sont résolues avec `or` et non avec le second
argument de `os.getenv` : `docker-compose` déclare ces variables même
vides (`OCR_API_URL=${OCR_API_URL:-}`), et une variable déclarée à la
chaîne vide l'emporterait sur le défaut. Le service appellerait alors une
adresse vide.

Le fournisseur retenu est visible sur `/health` :

```json
{ "fournisseurUrl": "https://api.x.ai/v1/chat/completions",
  "modele": "grok-2-vision-1212" }
```

Après modification :

```bash
docker compose up -d --build ocr
```

Une nouvelle route API exige de recharger les deux nginx :

```bash
docker compose build backoffice && docker compose up -d backoffice
docker compose restart nginx
```

La configuration nginx du back-office est **incluse dans son image** :
recréer le conteneur sans le reconstruire laisse l'ancienne route en place,
et la requête retombe sur le service de fichiers statiques, qui répond
`405 Not Allowed` à un POST.

### 7.3 La barre finale, et pourquoi la route est déclarée deux fois

L'intercepteur du front ajoute une barre finale à chaque URL — un
contournement d'un ancien `301` de nginx, qui transformait les `POST` en
`GET`. Face à `/extraire/`, FastAPI redirige vers `/extraire` par un `307`
dont l'adresse est **absolue**, reconstruite depuis l'en-tête `Host`.

Derrière deux nginx successifs, cet en-tête ne porte plus le port. Le
navigateur suivait donc la redirection vers `http://localhost/extraire`,
c'est-à-dire le port 80, où rien n'écoute :

```
POST http://localhost/extraire   net::ERR_CONNECTION_REFUSED
```

Une erreur réseau, pour un service parfaitement démarré. La route est donc
déclarée sous **les deux écritures**, avec et sans barre finale : plus
aucune redirection, quel que soit l'appelant.

---

## 8. Tests

```bash
python test_lecteur.py
```

Dix-huit vérifications, sans conteneur ni clé de fournisseur : l'appel au
fournisseur est simulé. Cela permet d'éprouver **les cas d'échec**, qu'un
essai manuel avec une vraie clé ne produit jamais à la demande — clé
refusée, quota dépassé, service injoignable, réponse illisible.

| Ce qui est vérifié | |
|---|---|
| Contrôle d'accès | appel anonyme, jeton malformé, expiré, d'un autre émetteur |
| Validation du fichier | PDF refusé, fichier de 21 Mo refusé |
| Lecture | champs extraits, réponse encadrée de markdown analysée quand même |
| Étanchéité | la clé part au fournisseur et n'apparaît jamais dans la réponse |
| Barre finale | `/extraire/` répond sans redirection |
| Pannes | clé refusée → 503, quota → 502, injoignable → 502, réponse sans JSON → 502 |
| Configuration | sans clé → 503, jamais un appel au hasard |

Deux assertions méritent d'être relevées, parce qu'elles protègent contre
des régressions silencieuses :

- **`"Invalid API Key"` ne doit pas apparaître dans la réponse.** Relayer le
  message du fournisseur au navigateur renseignerait un visiteur sur l'état
  du compte.
- **Une clé refusée donne `503`, jamais `401`.** Un `401` serait interprété
  par l'intercepteur du front comme une session expirée : il déconnecterait
  l'utilisateur alors que sa session est valide.

## 9. Vérifier à la main

```bash
curl http://localhost:8002/health
```

```json
{ "status": "healthy", "fournisseurConfigure": true,
  "verificationAccesActive": true }
```

Refus d'un appel anonyme :

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:3000/api/ocr/extraire -F fichier=@carte-grise.jpg
# 401
```

Lecture réelle, avec le jeton relevé dans `localStorage.xpark_token` :

```bash
curl -X POST http://localhost:3000/api/ocr/extraire \
  -H "Authorization: Bearer $JETON" \
  -F fichier=@carte-grise.jpg -F typeDocument=CARTE_GRISE
```

---

## 10. Limites connues

- **Pas de mémoire des lectures.** Deux envois du même document donnent deux
  appels au fournisseur. Une empreinte du fichier suffirait à éviter le
  second ; utile seulement si le volume augmente.
- **Pas de quota par utilisateur.** Le jeton de session ferme la porte aux
  inconnus, mais un compte légitime peut enchaîner les envois. À encadrer si
  le service sort du cadre interne.
- **Le résultat n'est jamais tenu pour acquis.** `confidence` est une
  déclaration du modèle, pas une mesure. Les champs pré-remplis restent
  modifiables, et doivent être relus avant enregistrement.
- **Le fichier est lu entièrement avant d'être mesuré.** La limite de 20 Mo
  s'applique après `await fichier.read()` : un envoi de 500 Mo serait donc
  chargé en mémoire avant d'être rejeté. Les deux nginx plafonnent le corps
  à 25 Mo, ce qui couvre le chemin normal ; un appel direct au port 8002
  ne serait pas protégé. À reprendre par une lecture en morceaux si le
  service devait être exposé hors du réseau interne.
