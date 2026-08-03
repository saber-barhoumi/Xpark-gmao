# Nettoyage final et préparation à la production

Revue complète de la plateforme avant déploiement. Aucune fonctionnalité
nouvelle : uniquement suppression de code mort, retrait de contenu factice,
correction d'anomalies découvertes et durcissement de la configuration.

## En un coup d'œil

| § | Sujet | Effet |
|---|---|---|
| 1 | Pages de démonstration du gabarit | 281 fichiers, 79 routes ; menu horizontal dédoublonné |
| 2 | Dépendances et composants morts | 12 paquets retirés ; `npm install` réparé |
| 3 | Contenu factice | 1 105 lignes de fausses données |
| 4 | Module Email | retiré : plantait, sans backend |
| 5 | Secrets et sondes de santé | 26 secrets externalisés, 8 sondes ajoutées |
| 6 | **Panne bloquante de la passerelle** | **toute l'API répondait 404** |
| 7 | Sécurité applicative | CORS restreignable, 0 secret versionné |
| 8 | Orphelins et traces de débogage | 337 lignes ; l'OCR ne fuite plus les documents |
| 9 | Dépendances vulnérables | 2 failles corrigées, 1 arbitrage à rendre |
| 10 | Derniers restes de gabarit | titre d'onglet, pied de page, FAQ |
| 11 | Contexte de build | 768 Mo d'artefacts sortis du contexte |

Deux points demandent une décision avant la mise en ligne : la
**rotation de la clé JWT** exposée dans l'historique git, et le
**choix de licence AutoMapper** (§ 9).

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

## 9. Dépendances vulnérables

Le journal de compilation Docker signalait trois paquets NuGet vulnérables,
avertissements jusque-là noyés dans la sortie.

### Corrigé — MailKit et MimeKit (envoi des courriels)

| Paquet | Version | Faille | Corrigé dans |
|---|---|---|---|
| MailKit | 4.8.0 | Injection de réponse STARTTLS permettant de forcer un mécanisme SASL plus faible | 4.16.0 |
| MimeKit | 4.8.0 (transitif) | Injection CRLF permettant d'injecter des commandes SMTP et de falsifier des courriels | 4.15.1 |

Ces deux failles sont **exploitables dans la configuration réelle du projet** :
IAM envoie les confirmations de compte et les codes à usage unique via SMTP
avec STARTTLS (port 587). MailKit est passé en **4.17.0**, ce qui entraîne
MimeKit 4.17.0. Aucune adaptation de code n'a été nécessaire ; IAM compile et
les deux avertissements ont disparu.

### À arbitrer — AutoMapper (décision de licence, pas technique)

`AutoMapper` 13.0.1, utilisé par 6 services, porte une faille **de gravité
élevée** : déni de service par récursion non maîtrisée
([GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x)).

Elle **n'est corrigée qu'à partir de la version 15.1.1**. Vérifié : la 14.0.0
reste vulnérable, et il n'existe aucun correctif dans la branche 13.x.

Or **AutoMapper est passé à une licence commerciale à partir de la v15**.
Monter de version engage donc l'entreprise financièrement : c'est un choix qui
appartient au propriétaire du projet, pas une correction technique à appliquer
au passage. Le paquet est donc **laissé en 13.0.1**.

Éléments pour décider — l'exposition réelle est faible : la faille se déclenche
sur des structures récursives, or le mappage ne porte ici que sur des entités
issues de la base vers des DTO, jamais sur des données envoyées par un client.
Trois options :

1. acquérir une licence AutoMapper 15+ ;
2. remplacer AutoMapper par du mappage écrit à la main — les profils sont peu
   nombreux (un par service) et la conversion est mécanique ;
3. accepter le risque en connaissance de cause et le consigner.

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

## 10. Derniers restes de gabarit

### Back-office — `context/constants.ts`

Onze constantes, dont **neuf qu'aucun écran n'importait** : devise en dollars
(le projet facture en dinars), adresse de contact de l'éditeur du gabarit,
liens « développé par » et « acheter » laissés vides, chemin d'API inutilisé,
palette de variantes Bootstrap.

La plus gênante était bien utilisée : `DEFAULT_PAGE_TITLE`, **titre de repli de
l'onglet** affiché tant qu'un écran n'a pas défini le sien, valait
« Adminto - Responsive Bootstrap 5 Admin Dashboard ». Le nom commercial du
gabarit s'affichait donc à l'utilisateur. Il devient
« XPARK GMAO - Gestion de Flotte ».

### Site vitrine

Deux écrans montraient encore du texte de gabarit à des visiteurs :

- **Pied de page secondaire** (`Footer2`, page `/index-2`), jamais repris
  contrairement à `Footer1` : adresse américaine « 3891 Ranchview Dr.
  Richardson », deux numéros de téléphone fictifs, mention
  « © Yoursitename 2024 », faux-texte de présentation et cinq intitulés de
  services en anglais ne correspondant plus aux pages réelles. Le tout est
  aligné sur `Footer1`, qui porte les coordonnées exactes.
- **Page FAQ** : les trois questions étaient en anglais et partageaient la
  **même réponse**, un faux-texte recopié trois fois. Questions traduites et
  trois réponses distinctes rédigées (suivi d'expédition, délais par région,
  transport sur mesure).

---

## 11. Contexte de build : 768 Mo transférés pour rien

Constat fait en observant les builds ramper : ils restaient bloqués plusieurs
minutes sur l'étape « load build context », **avant même de compiler**.

| Contexte déclaré | Total | Dont artefacts locaux |
|---|---|---|
| `microservices/` | 629 Mo | **628 Mo (100 %)** |
| `AyshaaRAG/` | 158 Mo | 140 Mo (88 %) |
| `CalculateurPrixTrajetIA/` | 21 Mo | — |

Le dossier `microservices/` n'avait **aucun `.dockerignore`** : chacun des
8 services faisait transférer au démon Docker l'intégralité des `bin/` et
`obj/` produits par les compilations locales — 628 Mo, huit fois. AyshaaRAG
envoyait de même le `.venv` du poste de travail.

Ces fichiers sont non seulement inutiles (chaque Dockerfile lance son propre
`dotnet restore` / `pip install` dans le conteneur) mais **nuisibles** : des
`obj/` ou un `.venv` produits sous Windows peuvent perturber la construction
d'une image Linux.

`.dockerignore` ajoutés pour `microservices/` et les 4 services Python ; ils
excluent aussi les fichiers `.env`, qui n'ont rien à faire dans une image. Les
deux contextes frontend en avaient déjà un.

### Effet mesuré

Relevé dans les journaux de build, à cache BuildKit déjà chaud :

| Service | Contexte transféré |
|---|---|
| `iam-api` (avant) | 17,56 Mo |
| `mission-api` (après) | **32,83 ko** |

À retenir sur la portée : BuildKit ne renvoie que le différentiel entre deux
builds successifs, ces 17,56 Mo sont donc déjà un reliquat — le premier build
d'une session transférait bien la totalité. C'est précisément la situation
d'une **chaîne d'intégration**, où chaque exécution part d'un agent vierge :
là, ce sont les 628 Mo complets qui étaient envoyés, pour chacun des
8 services.

---

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
- **Application chauffeur** (Expo React Native) : hors périmètre de cette
  passe, non auditée.
