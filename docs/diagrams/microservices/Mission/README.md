# Mission

**Source analysee** : `microservices/Mission`

**Conteneur** : `mission-api` — port publie `5003`

**Role** : Demandes de transport, devis, missions, suivi GPS, optimisation

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 5 |
| Endpoints HTTP | 34 |
| Entites du domaine | 4 |
| Enumerations locales | 6 |
| DTO | 6 |
| Interfaces (ports) | 6 |
| Implementations | 4 |
| DbSet | 5 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `MissionDbContext`

## Controleurs et routes

- `DataMigrationController` — route `api/ai-data` (2 endpoints)
- `MissionsController` — route `api/[controller]` (12 endpoints)
- `SupportController` — route `api/support` (5 endpoints)
- `TrackingController` — route `api/tracking` (3 endpoints)
- `TransportRequestsController` — route `api/missions/demandes` (12 endpoints)

## Messagerie

Routing keys sur l'exchange topic `xpark.ai` : `xpark.mission.client-request`, `xpark.mission.task-cancelled`, `xpark.mission.task-completed`, `xpark.missions.ready-for-optimization`, `xpark.optimization.plan-generated`

## Appels HTTP sortants

`finance-api:8080`, `fleet-api:8080`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Mission-sequence.puml` | Sequence d'un flux metier reel du service |
| `Mission-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `Mission-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `Mission-entities.puml` | Entites persistees, cles et relations |
| `Mission-class.puml` | Classes des quatre couches et leurs dependances |
| `Mission-component.puml` | Composants internes et points d'entree |
| `Mission-package.puml` | Organisation en paquets et sens des dependances |
| `Mission-activity.puml` | Deroulement metier de bout en bout |
| `Mission-state.puml` | Etats et transitions des objets du domaine |
| `Mission-database.puml` | Persistance et tables accedees |
| `Mission-api-flow.puml` | Cheminement complet d'un appel API |
| `Mission-service-flow.puml` | Traversee des couches internes |
| `Mission-optimization-flow.puml` | Flux d'optimisation |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Mission-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Mission-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Mission-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Mission-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Mission-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Mission-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Mission-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
