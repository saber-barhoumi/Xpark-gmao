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

## Tests effectués

- `tsc` sans erreur et build de production réussi après **chaque** étape.
- `npm install` propre, sans `--legacy-peer-deps` (27 paquets élagués).
- Parcours navigateur des écrans métier (dashboard, analyses, missions,
  véhicules, prédiction, factures, alertes, utilisateurs, projets, calendrier,
  kanban, sécurité, carburant, IBOA, FAQ, trésorerie, fichiers, contacts) :
  aucune page vide, aucune erreur console.
- Suite de non-régression : **27 contrôles OK / 0 échec** (8 services en
  santé, RBAC, 13 endpoints métier, 4 nouveautés).
- Pile Docker complète redémarrée et validée (`docker compose config`).

## Limites connues et suites possibles

- **Module Email** : à recréer entièrement (backend + routes nginx) si la
  fonctionnalité est souhaitée.
- **Taille des bundles** : Vite signale des morceaux > 500 ko. Un
  découpage (`manualChunks`) améliorerait le premier chargement — non traité
  ici pour ne pas modifier le comportement à la veille d'un déploiement.
- **Secrets** : externalisés mais les valeurs de repli restent en clair dans
  `docker-compose.yml` pour le confort du développement local. En production,
  définir impérativement `.env` — ou mieux, un gestionnaire de secrets.
- **Services Python** (Ayshaa, calcul de prix, optimiseur, IBOA) : non
  audités en profondeur dans cette passe, faute de couverture de tests
  automatisés côté Python.
