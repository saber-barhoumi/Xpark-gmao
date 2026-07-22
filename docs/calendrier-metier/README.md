# Calendrier métier XPARK

> Page : `/apps/calendar` (back-office) · Rôles : tout utilisateur authentifié
> du back-office (le RBAC est celui de chaque source, voir §6).

## 1. Pourquoi ce changement

La page calendrier était issue du template d'origine et **ne fonctionnait pas** :

- `useCalendar` appelait `GET /calendar/events` — endpoint qui **n'existe dans
  aucun microservice** (vérifié : `grep -ri "calendar"` sur `microservices/` et
  `backend/` ne renvoie rien). Chaque chargement partait donc en `catch`, et la
  page affichait un calendrier **vide** avec le message « Impossible de charger
  le calendrier ».
- La seule matière visible était 4 événements **codés en dur** dans la sidebar
  (`New Event Planning`, `Meeting`, `Generating Reports`, `Create New theme`) —
  du contenu de démonstration, sans rapport avec XPARK.
- Le formulaire d'ajout/édition (`AddEditEvent.tsx`) écrivait lui aussi vers
  l'API inexistante : aucune de ses actions n'a jamais pu aboutir.

Objectif : un calendrier qui reflète **les vraies données de la plateforme**.

## 2. Décision d'architecture : agrégation, pas de nouveau service

**Aucun microservice « Calendar » ni table `Events` n'a été créé.** C'est
délibéré :

> Un événement de calendrier n'est pas un objet métier autonome. C'est une
> **projection en lecture** d'objets qui existent déjà dans leur service
> (Mission, Maintenance, Fleet, Alerts).

Créer une table d'événements aurait :

- **dupliqué la logique métier** (une mission reportée devrait être réécrite à
  deux endroits) — ce que la consigne interdit explicitement ;
- introduit un **problème de synchronisation permanent** entre la table
  calendrier et les tables sources ;
- imposé de **redéfinir le RBAC** au lieu de réutiliser celui des sources.

L'agrégation se fait donc dans `calendarService.ts`, qui **réutilise les
services front existants** — et par conséquent leur authentification, leur
pagination et leurs contrats, sans en redéfinir aucun.

### Seule exception : un endpoint ajouté côté Fleet

Les dates d'expiration n'étaient lisibles que **véhicule par véhicule**
(`/documents/vehicule/{id}`, `/assurances/vehicule/{id}`), ce qui aurait imposé
un appel HTTP par véhicule (**N+1**). D'où l'ajout de `GET /api/echeances`
(§4), qui fait le travail en **2 requêtes SQL au total**.

## 3. Flux de données

```
Page /apps/calendar
   └── useCalendar (état, filtres, sélection)
         └── calendarService.getEvents()
               ├── missionService.getAll() ─────────► Mission.API   :5003
               ├── interventionService.getAll() ────► Maintenance   :5004
               ├── ordreTravailService.getAll() ────► Maintenance   :5004
               ├── GET /echeances ──────────────────► Fleet.API     :5002
               ├── transportRequestService.getAll() ► Mission.API   :5003
               └── alerteService.getAll() ──────────► Alerts.API    :5006
                        │
                        ▼
              Promise.allSettled  ──► normalisation ──► EventInput[]
```

**Résilience** — `Promise.allSettled` : si un microservice est indisponible, les
autres événements s'affichent quand même et un bandeau nomme la ou les sources
en échec (`failedSources`). C'est préférable à un calendrier vide sans
explication.

## 4. Backend ajouté — `GET /api/echeances`

Ajout **additif** dans Fleet, en Clean Architecture, **sans modifier aucune
route existante** :

| Couche | Fichier | Rôle |
|---|---|---|
| Application | `DTOs/EcheanceDto.cs` | projection lecture seule |
| Application | `Interfaces/IEcheanceService.cs` | port |
| Infrastructure | `Services/EcheanceService.cs` | 2 requêtes SQL + fusion |
| API | `Controllers/EcheancesController.cs` | `[Authorize]` |
| Infrastructure | `DependencyInjection.cs` | 1 ligne d'enregistrement |

**Contrat** — `GET /api/echeances?start=<ISO>&end=<ISO>` (bornes optionnelles) :

```json
[{ "source": "DOCUMENT", "refId": 3, "type": "ASSURANCE",
   "libelle": "Assurance — 123 TUN 2020", "reference": "4205",
   "dateExpiration": "2026-03-12T00:00:00Z", "joursRestants": -132,
   "vehiculeId": 1, "immatriculation": "123 TUN 2020",
   "marque": "Toyota", "modele": "Corolla" }]
```

Notes d'implémentation :

- `source` distingue les deux agrégats fusionnés (`DocumentAdministratif` /
  `Assurance`), `refId` permet de remonter à l'enregistrement d'origine ;
- `joursRestants` est **négatif** si l'échéance est dépassée (affiché ⚠️) ;
- les bornes de date sont normalisées en UTC (`DateTime.SpecifyKind`) car
  Npgsql refuse un `DateTime` non-UTC sur une colonne `timestamptz` ;
- seules les assurances `Actif = true` portent une échéance.

**Aucun changement de base de données** : l'endpoint ne fait que lire des tables
existantes.

## 5. Types d'événements

| Type | Source | Couleur | Module cible |
|---|---|---|---|
| `MISSION` | Mission sans client | `bg-info` | `/gestion/missions` |
| `LIVRAISON` | Mission avec `clientIdUtilisateur` | `bg-primary` | `/gestion/missions` |
| `INTERVENTION` | Maintenance (préventive/curative) | `bg-warning` | `/maintenance/interventions` |
| `ORDRE_TRAVAIL` | Ordre de travail | `bg-secondary` | `/maintenance/ordres-travail` |
| `ASSURANCE` | Échéance assurance | `bg-danger` | `/gestion/vehicules` |
| `VISITE_TECHNIQUE` | Échéance visite technique | `bg-danger` | `/gestion/vehicules` |
| `DOCUMENT` | Carte grise, vignette, permis… | `bg-dark` | `/gestion/vehicules` |
| `DEMANDE_CLIENT` | Demande de transport (devis) | `bg-success` | `/gestion/demandes-transport` |
| `ALERTE` | Alerte plateforme | `bg-danger` | `/alertes` |

Les couleurs sont les **classes du design system existant** (`bg-*`) — aucune
nouvelle palette n'a été introduite.

### Deux points de modélisation à connaître

- **Missions vs livraisons** : dans XPARK, une livraison **est** une mission.
  Plutôt que d'inventer une source « Deliveries » qui n'existe pas, la
  distinction est faite sur une donnée réelle : `clientIdUtilisateur != null`
  ⇒ livraison client, sinon déplacement interne.
- **Disponibilité chauffeur** : il n'existe pas de table de disponibilité dans
  le système. La disponibilité est donc **dérivée** : filtrer par chauffeur
  affiche ses créneaux occupés (missions, interventions où il est technicien).
  Aucune donnée n'a été fabriquée pour l'occasion.

## 6. Filtres et RBAC

Filtres disponibles : **type** (multi-sélection), **véhicule**, **chauffeur /
technicien**, **client**, **plage de dates**.

Les options des listes déroulantes sont **déduites des événements réellement
chargés** : aucun appel réseau supplémentaire, et l'admin ne se voit jamais
proposer une valeur qui ne donnerait aucun résultat. Le compteur
« N affichés sur M » rend le filtrage lisible.

**RBAC** — le calendrier n'introduit **aucune permission nouvelle**. Il hérite
de celle de chaque source : un utilisateur ne voit dans le calendrier que ce que
les endpoints sous-jacents acceptent de lui renvoyer. Une source refusée (403)
est simplement listée dans `failedSources`.

Le calendrier est **en lecture seule** : `editable={false}`, `droppable={false}`.
Déplacer un événement n'aurait pas de sens tant que la règle métier
correspondante (replanifier une mission, reporter une intervention) vit dans son
module. Le détail d'un événement propose donc **« Ouvrir dans le module »**.

## 7. Routage nginx (piège rencontré)

Le back-office est construit avec `VITE_API_URL=/api` et **son propre nginx**
mappe chaque préfixe vers la passerelle microservices. Un endpoint backend qui
fonctionne en direct (`:5002`) reste donc **404 pour l'application** tant que
son `location` n'est pas déclaré :

```nginx
location /api/echeances/ {
    proxy_pass http://nginx:80/fleet/api/echeances/;
    ...
}
```

À retenir pour toute future route : **ajouter le `location` dans
`frontend/backoffice/nginx.conf` et rebuilder l'image du back-office**, sinon
l'appel n'atteint jamais le microservice.

## 8. Vérifications effectuées

- `dotnet build` Fleet : **0 erreur** ; `tsc --noEmit` back-office : **0 erreur**
- `GET /api/echeances` : **401** sans jeton, **200** avec jeton
- filtrage de plage : `2027` → `[]`, `2026` → 1 échéance
- non-régression Fleet : `vehicules`, `equipements`, `documents/vehicule/1`,
  `assurances/vehicule/1` toujours **200**
- les **6 sources** répondent **200** via le chemin réel `:3000`, pour
  **45 enregistrements** agrégés (12 missions internes, 6 livraisons client,
  6 interventions, 5 ordres de travail, 1 échéance, 4 demandes, 11 alertes)

## 9. Maintenir / étendre

**Ajouter un type d'événement** — tout est centralisé dans
`src/services/calendarService.ts` :

1. ajouter la valeur au type `CalendarEventType` ;
2. renseigner `TYPE_LABELS`, `TYPE_COLORS` et `TYPE_ROUTES` (le compilateur
   signale tout oubli : ce sont des `Record<CalendarEventType, …>`) ;
3. écrire un convertisseur `fromXxx()` qui retourne `build(...)` ;
4. ajouter la source au tableau `sources` **et** le `case` correspondant.

Le filtrage, la légende et le panneau de détail n'ont **pas** à être modifiés :
ils se dérivent des métadonnées portées par chaque événement.

**Attention** : si la nouvelle source est un nouvel endpoint backend, ne pas
oublier le `location` nginx (§7).
