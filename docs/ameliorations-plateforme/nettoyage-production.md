# Nettoyage final et préparation à la production

Revue complète de la plateforme avant déploiement. Aucune fonctionnalité
nouvelle : uniquement suppression de code mort, retrait de contenu factice,
correction d'anomalies découvertes et durcissement de la configuration.

---

## 1. Pages de démonstration du template

### Constat

Le back-office embarquait encore la vitrine du template Adminto. Mesure faite
avant toute suppression : **sur 134 routes déclarées, 35 seulement étaient
atteignables depuis le menu**.

### Supprimé

| Ensemble | Contenu |
|---|---|
| `/ui`, `/extended` | galeries de composants Bootstrap |
| `/charts` | démonstrations de graphiques |
| `/forms`, `/tables`, `/icons`, `/maps` | vitrines de formulaires, tableaux, icônes, cartes |
| 8 démos de disposition | horizontal, detached, full-view, fullscreen-view, hover-menu, compact, icon-view, dark-mode |
| `/pages/pricing`, `/starter-page`, `/timeline` | pages de démonstration |

**281 fichiers et 79 routes supprimés.** Conservés : la FAQ, la page d'erreur
404 alternative, et l'intégralité des routes d'authentification et d'erreur.

**Vérification préalable** : aucun écran métier n'importait quoi que ce soit
de ces dossiers (recherche exhaustive des imports avant suppression).

### Dédoublonnage du menu

Le menu horizontal servait une **seconde liste** (734 lignes) héritée du
template. Après le nettoyage, **75 de ses 105 liens** pointaient vers des
pages supprimées : basculer en disposition horizontale aurait exposé une
navigation cassée. Les deux dispositions partagent désormais la même
définition (`MENU_ITEMS`) — une seule source de vérité.

---

## 2. Dépendances et composants morts

### Composants supprimés

Tout le dossier `VectorMap` (cartes vectorielles Canada, Irak, Italie, Russie,
Espagne, USA, Monde — la plateforme utilise Leaflet pour le suivi réel), plus
`ComponentContainerCard`, `CustomFlatpickr`, `KPICard`, `ChoicesFormInput`,
`UserCard`, `BrandsListingCard`, `InvoicesCard`, `useFetchData`.

### Dépendances

Audit systématique des 59 paquets déclarés contre le code source réel.
**12 retirés** : `@react-google-maps/api`, `@smastrom/react-rating`,
`gridjs-react`, `nouislider-react`, `react-countup`, `react-sortablejs`,
`sortablejs` (le kanban utilise `@hello-pangea/dnd`), `react-sweetalert2`,
`jsvectormap`, `choices.js`, `react-flatpickr`, `google-maps-react`.

### Deux problèmes de fond révélés

Ils étaient invisibles tant que `node_modules` restait peuplé :

1. **`npm install` échouait** (`ERESOLVE`) : `google-maps-react` exige
   React ≤ 16 alors que le projet est en React 18. Le projet ne s'installait
   qu'avec `--legacy-peer-deps`, ce qui aurait bloqué une chaîne
   d'intégration. Le paquet n'était référencé que par une déclaration de type
   orpheline. **Une installation propre fonctionne désormais sans aucun
   drapeau.**

2. **Dépendance fantôme** : `sweetalert2` est importé **directement par
   38 fichiers** mais n'avait jamais été déclaré — il n'arrivait que par
   transitivité de `react-sweetalert2`. Le retrait de ce dernier a fait
   échouer le build et révélé le problème. `sweetalert2` est maintenant une
   dépendance explicite.

---

## 3. Contenu factice

### Couche de données de démonstration

`helpers/data.ts`, `assets/data/other.ts` et `Product.ts` — **1 105 lignes**
de faux utilisateurs, factures, produits et fichiers — supprimées une fois
leurs derniers consommateurs retirés.

### Faux utilisateur dans la messagerie

`useChatContext` appelait `getUserById('101')` **à chaque montage** de la
messagerie, pour charger un utilisateur de démonstration qu'aucun composant
n'affichait. Le contexte ne conserve que ce qui sert réellement (ouverture
des panneaux latéraux) ; les conversations viennent de `chatService`.

---

## 4. Module Email retiré

**Anomalie découverte en parcourant les écrans** : `/apps/email`, pourtant
présente dans le menu Administration, **plantait systématiquement**
(`TypeError: n.find is not a function`) et renvoyait vers l'écran d'erreur 500.

**Cause** : il n'existe **aucun backend email** (aucun contrôleur côté
microservices) ni aucune route `/api/email` dans nginx. L'appel retombait sur
le SPA et renvoyait du HTML, que le composant parcourait comme un tableau.
Ce défaut est **antérieur** au nettoyage.

**Décision** : le front seul ne peut pas fonctionner sans service de
messagerie, et créer ce backend serait une nouvelle fonctionnalité — hors du
périmètre demandé. Le module est donc retiré (page, route, entrée de menu)
plutôt que de laisser un écran qui plante. **Le code reste dans l'historique
git** si la fonction est reprise plus tard.

---

## 5. Préparation à la production

### Secrets externalisés

La clé de signature JWT, le mot de passe PostgreSQL et celui du bus de
messages étaient **écrits en dur dans `docker-compose.yml` et versionnés**.
Quiconque avait accès au dépôt pouvait forger un jeton d'administrateur.

**26 occurrences** remplacées par des variables avec valeur de repli :
`${JWT_KEY:-…}`, `${POSTGRES_PASSWORD:-…}`, `${RABBITMQ_PASSWORD:-…}`.
Le démarrage local reste identique ; en production les variables doivent être
définies. `.env.example` documente chacune, avec la commande de génération
d'une clé (`openssl rand -base64 48`).

### Sondes de santé

Seuls PostgreSQL et RabbitMQ avaient une sonde. Les **8 microservices .NET**
en ont désormais une sur leur endpoint `/health` (intervalle 30 s, 3 essais,
40 s de démarrage) — nécessaire pour qu'un orchestrateur sache si un service
est réellement prêt.

Deux ajustements ont été nécessaires : l'image `aspnet:8.0` ne contient
**ni `curl` ni `wget`** (ajout de `curl` dans l'étage runtime des
8 Dockerfiles), et les services écoutent sur le **port 80** et non 8080.

### Routage API vérifié

Contrôle croisé par script : les **19 préfixes d'API** appelés par le
back-office ont tous une route `location` correspondante dans nginx.

---

## 6. Panne bloquante découverte pendant la validation

**Symptôme** : impossible de se connecter au back-office.
`POST /api/auth/login` répondait **404**, et avec lui toute l'API.

### Cause

Le nginx du back-office écrivait `proxy_pass http://nginx:80/…`, avec un nom
d'hôte littéral. **nginx ne résout ce nom qu'une fois, au démarrage**, puis fige
l'adresse IP. L'ajout des sondes de santé (§ 5) avait recréé la passerelle
`xpark-nginx`, qui a donc changé d'IP. Le back-office continuait d'interroger
l'ancienne adresse — entre-temps réattribuée à un autre conteneur, lequel
répondait 404 sur ces chemins.

C'est **exactement la panne déjà corrigée sur la passerelle elle-même**
(`microservices/nginx/nginx.conf`) ; le correctif n'avait jamais été appliqué à
cette seconde couche. La gravité dépasse l'incident : **toute recréation de la
passerelle cassait le back-office** jusqu'à redémarrer aussi son conteneur — or
en production les conteneurs sont recréés à chaque déploiement.

### Correctif

Résolveur interne de Docker (`127.0.0.11`, cache 10 s) et variable dans
`proxy_pass`, ce qui force une résolution à chaque requête.

Une variable dans `proxy_pass` désactive la réécriture automatique du préfixe de
`location` : les **24 blocs de routage** (22 routes `/api/*` et les 2 canaux
temps réel `chatHub` / `kanbanHub`) portent donc un `rewrite … break` explicite.

---

## 7. Sécurité applicative

### CORS restreignable

Les 8 services acceptaient **toute origine**, en dur. Le plus exposé était la
messagerie : `SetIsOriginAllowed(_ => true)` **combiné à** `AllowCredentials()`,
c'est-à-dire que n'importe quel site pouvait ouvrir une connexion temps réel
authentifiée au nom de l'utilisateur connecté.

Les origines viennent désormais de `CORS_ORIGINS`. Variable absente — le cas
d'un poste de développement — le comportement permissif est conservé, donc rien
ne change en local. La politique a été renommée `XparkCors` : « AllowAll »
serait devenu un nom trompeur.

### Secrets retirés des `appsettings.json`

Les 8 fichiers, **tous versionnés**, contenaient clé JWT, mot de passe
PostgreSQL et mot de passe du bus de messages en clair. Ils étaient de surcroît
incohérents entre eux :

| Élément | Valeurs distinctes trouvées |
|---|---|
| Clé JWT | 3 |
| Identifiants base | 4 |
| Nom de base | 3 (`xpark_gmao`, `xpark_iam`, `xpark_fleet`) |
| Hôte base | 2 (`postgres`, `localhost`) |
| Audience JWT | 2 (divergente sur 2 services) |

`docker-compose` surchargeant intégralement ces valeurs, **elles n'étaient
jamais utilisées** : uniquement des secrets exposés, et un piège latent — un
service privé de sa surcharge se serait connecté silencieusement à une base
inexistante, ou aurait signé ses jetons avec une autre clé, jetons alors rejetés
par les 7 autres services.

### Démarrage en échec explicite

`builder.Configuration["Jwt:Key"]!` masquait l'absence de configuration derrière
une `NullReferenceException` illisible. Le contrôle est maintenant explicite et
vérifie aussi la longueur minimale de 32 caractères qu'impose HMAC-SHA256, avec
un message qui renvoie vers `.env.example`.

---

## 8. Dernier passage : orphelins et traces de débogage

### Fichiers orphelins (337 lignes)

Recherche systématique des services, hooks et contextes qu'aucun autre fichier
n'importe :

- `geminiOCRService.ts` (239 lignes) : version antérieure de `groqOCRService`,
  restée en place après la bascule vers Grok. Son en-tête annonce d'ailleurs
  « VERSION GROK ONLY » — les deux fichiers appelaient la même API, seul
  `groqOCRService` était branché (4 écrans l'utilisent).
- `hooks/useModal.ts` et `hooks/useRangeSlider.ts` : résidus du gabarit, ce
  dernier pilotant `nouislider`, paquet retiré au § 2.

Côté microservices, la même recherche sur les DTO n'a **rien remonté** : le
backend avait déjà été nettoyé.

### Traces de débogage

13 `console.log` / `console.info` s'affichaient dans la console de
l'utilisateur final. Deux étaient de simples oublis (une bannière
« SignalR Service Version: 3.0 » au chargement du module, un `console.log` du
titre de page) ; les autres traçaient le temps réel et l'extraction OCR —
utiles en développement, mais **ceux de l'OCR recopiaient dans la console le
contenu des documents analysés** (carte grise, attestation d'assurance).

Nouvel utilitaire `helpers/journal.ts` : `trace()` n'écrit que si
`import.meta.env.DEV`. Vite remplaçant cette valeur par une constante à la
compilation, les appels **disparaissent du bundle de production**.
`console.error` reste inchangé : les vraies erreurs doivent rester visibles
partout.

Un effet a été corrigé au passage : dans la barre supérieure, `title` figurait
dans les dépendances de l'effet qui le met à jour, qui se redéclenchait donc à
chaque changement de titre.

---

## Tests effectués

- `tsc` sans erreur et build de production réussi après **chaque** étape.
- `npm install` propre, sans `--legacy-peer-deps` (27 paquets élagués).
- Compilation des **8 microservices** après chaque modification backend.
- **Parcours navigateur des 40 pages** atteignables depuis le menu : aucune page
  vide, aucune erreur console, et les routes inconnues tombent bien sur la
  page 404 (vérifié avec une URL inexistante).
- **Routes API** : les 36 chemins réellement appelés par le front répondent 200
  à travers le port 3000. Les 4 exceptions renvoient 405 sur un `GET` — ce sont
  des routes `POST`/`DELETE`, comportement attendu.
- Suite de non-régression : **27 contrôles OK / 0 échec** (8 services en
  santé, RBAC, 13 endpoints métier, 4 nouveautés).
- Pile Docker complète reconstruite et redémarrée ; `docker compose config`
  valide ; les 8 conteneurs applicatifs remontent `healthy`.

## Avant la première mise en ligne

1. Copier `.env.example` vers `.env` et **renseigner les quatre secrets**
   (`JWT_KEY`, `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, `AYSHAA_ADMIN_API_KEY`).
   Générer la clé JWT avec `openssl rand -base64 48`.
2. Renseigner `CORS_ORIGINS` avec les domaines réels du back-office et du
   portail client, séparés par des virgules et sans barre oblique finale.
3. Configurer le SMTP (`EMAIL_*`) : sans lui, ni confirmation de compte, ni
   réinitialisation de mot de passe, ni code à usage unique.

Un service démarré sans `Jwt__Key` s'arrête désormais immédiatement avec un
message explicite plutôt que de tomber en marche dégradée.

## Limites connues et suites possibles

- **Module Email** : à recréer entièrement (backend + routes nginx) si la
  fonctionnalité est souhaitée.
- **Taille des bundles** : Vite signale des morceaux > 500 ko. Un
  découpage (`manualChunks`) améliorerait le premier chargement — non traité
  ici pour ne pas modifier le comportement à la veille d'un déploiement.
- **Secrets** : les valeurs de repli restent en clair dans `docker-compose.yml`
  pour le confort du développement local. Elles ne sont plus dupliquées dans les
  `appsettings.json`, mais en production il faut impérativement définir `.env` —
  ou mieux, brancher un gestionnaire de secrets.
- **Rotation de la clé JWT** : la clé exposée dans l'historique git doit être
  considérée comme compromise. En générer une nouvelle avant toute mise en
  ligne ; l'ancienne reste lisible dans les commits antérieurs.
- **Services Python** (Ayshaa, calcul de prix, optimiseur, IBOA) : non
  audités en profondeur dans cette passe, faute de couverture de tests
  automatisés côté Python.
- **Front office et application chauffeur** : le nettoyage a porté sur le
  back-office et les microservices. Le site vitrine conserve des textes de
  gabarit (coordonnées, mentions « Yoursitename ») à reprendre.
