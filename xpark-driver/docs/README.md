# 📚 Documentation — XPARK Driver

Documentation complète de l'application mobile des chauffeurs XPARK, pensée pour
être relue plus tard sans réanalyser le code (rapport PFE + développement futur).

## Sommaire

| # | Document | Contenu |
|---|---|---|
| 01 | [architecture.md](01-architecture.md) | Vue d'ensemble, diagramme, flux de données, structure |
| 02 | [decisions.md](02-decisions.md) | Décisions techniques (ADR) : pourquoi chaque choix |
| 03 | [screens.md](03-screens.md) | Les 7 écrans : rôle, fonctionnement, test |
| 04 | [gps-tracking.md](04-gps-tracking.md) | Suivi GPS temps réel + arrière-plan (le cœur) |
| 05 | [backend-integration.md](05-backend-integration.md) | APIs consommées, endpoints, schéma de données |
| 06 | [installation.md](06-installation.md) | Installation, configuration, exécution, test |
| 07 | [future.md](07-future.md) | Évolutions et extensions possibles |

## En une phrase

> Le chauffeur se connecte, démarre sa mission, et son téléphone envoie sa
> position GPS en continu au backend XPARK ; le client voit son camion bouger
> en direct sur la carte du Front Office.

## Objectif de la boucle

```
Téléphone chauffeur (GPS)
      │  POST /api/tracking/ping  (lat, lng, vitesse, cap, horodatage)
      ▼
Mission.API  →  table LivePositions
      │  GET /api/tracking/mission/{id}/live
      ▼
Carte client (Front Office /account/tracking)  →  camion animé en temps réel
```
