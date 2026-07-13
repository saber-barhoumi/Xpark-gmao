# 📍 Suivi en direct — carte temps réel (type Uber/Bolt)

`/account/tracking` — le client voit le camion qui transporte ses marchandises
avancer **en direct sur une carte interactive**, avec itinéraire réel, ETA,
timeline et notifications.

## Ce que voit le client

- Une **carte interactive** (zoom, déplacement, tuiles CartoDB haute qualité,
  thème clair/sombre) avec :
  - marqueur **enlèvement** 📦 et **destination** 🏁 ;
  - **itinéraire routier réel** (réseau routier, pas une ligne droite) ;
  - tracé **parcouru** en rouge plein / tracé **restant** en pointillés ;
  - une **icône camion** qui se déplace **en continu** et **pivote selon la
    direction** de conduite.
- Un **bandeau d'état** (En attente → Chauffeur affecté → Départ → En route →
  Ralentissement trafic → Arrêt technique → Proche → Arrivé → Livré) + barre de
  progression + km parcourus + ETA, mis à jour **automatiquement** (aucun
  rafraîchissement manuel).
- Boutons **Suivre le camion** (recentrage continu) et **Recadrer** (vue itinéraire).
- Cartes **Chauffeur** (nom, initiales, véhicule, vitesse, statut),
  **Véhicule** (immatriculation, type, vitesse, distances, temps restant),
  **Itinéraire** (départ, arrivée, distances, ETA).
- Une **timeline** professionnelle (commande confirmée → affecté → chargé →
  départ → checkpoints → trafic → arrêt → proche → livré) avec heure, icône,
  description, et distinction fait / à venir.
- Des **notifications live** (toasts) aux moments clés : départ, trafic,
  arrêt, approche, livraison.
- Sélecteur si plusieurs missions actives + historique récent.

## Architecture (modulaire, prête pour le GPS réel)

```
frontend/frontoffice/
├── lib/tracking/
│   ├── geo.js               # haversine, cap, interpolation, position le long d'une polyligne
│   ├── cityCoordinates.js   # villes/délégations tunisiennes → [lat,lng] (repli gracieux)
│   ├── routeService.js      # géométrie routière : OSRM (routes réelles) + repli incurvé, cache
│   └── trackingEngine.js    # ★ cœur : position/état/vitesse/ETA/timeline = fonction du temps
└── components/tracking/
    ├── ShipmentMap.js       # carte Leaflet impérative, camion animé (requestAnimationFrame)
    └── TrackingPanels.js    # cartes chauffeur/véhicule/itinéraire + timeline + badge d'état
```

### Le moteur (`trackingEngine.js`)

`createEngine({ mission, route }).snapshotAt(now)` retourne un instantané
complet : `{ state, position, bearing, progress, traveledKm, remainingKm,
speedKmh, remainingMin, etaDate, index }`. Tout est **fonction pure du temps** :

- le modèle actuel simule le trajet à partir de l'heure de départ, de la route
  et d'un **planning avec incidents réalistes** (zone de trafic + arrêt
  technique) — ETA cohérente incluant les retards, progression monotone ;
- comme `snapshotAt` est continue en temps, la carte recalcule la position **à
  chaque frame** → mouvement parfaitement fluide, sans saccade ni interpolation.

### Fluidité (`ShipmentMap.js`)

Carte Leaflet pilotée **impérativement** : une boucle `requestAnimationFrame`
lit `engine.snapshotAt(Date.now())`, déplace le marqueur, applique la rotation
(cap), et redessine les tracés parcouru/restant. **Aucun re-render React**
pendant l'animation (performant). Le texte (ETA, %, cartes) se met à jour via
un tick d'1 s côté page.

## Passage au GPS réel (sans refonte)

Le jour où des balises GPS ou une API de position temps réel existent, il
suffit d'ajouter un fournisseur qui appelle une nouvelle fonction
`snapshotFromPosition(latlng)` dans `trackingEngine.js` : toute la dérivation
(état, cap, distance restante, ETA, timeline) et **toute l'UI** (carte,
panneaux, notifications) restent inchangées. La page choisit le fournisseur
(simulation ↔ GPS), rien d'autre ne bouge.

## Choix techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Carte | **Leaflet** + tuiles **CartoDB Voyager/Dark** | libre, sans clé API, tuiles modernes, thème clair/sombre |
| Routage | **OSRM** (démo publique) + repli courbe | routes réelles ; le service ne casse jamais si OSRM indisponible |
| Icônes | `divIcon` SVG inline (camion, pins) | pas d'asset image cassé (problème classique de Leaflet en bundler) |
| Animation | Leaflet impératif + `requestAnimationFrame` | fluide, sans re-render React |
| Dépendance ajoutée | `leaflet` uniquement | pas de react-leaflet (contrôle total de l'animation) |

## Comment tester

1. Se connecter en client ayant une mission **EN_COURS** (ex. mission #28
   Bab Bhar → Hammam Sousse) → `/account/tracking`.
2. La carte s'affiche avec l'itinéraire réel (~135 km), le camion en mouvement,
   la progression et l'ETA qui avancent, l'icône camion orientée vers la route.
3. « Suivre le camion » recentre en continu ; « Recadrer » revient à la vue
   d'ensemble. Les toasts apparaissent aux changements d'état.
4. Missions **EN_ATTENTE** : camion au point d'enlèvement (« Chauffeur affecté »).
   **TERMINEE** : camion à destination, 100 %, « Livraison terminée ».
