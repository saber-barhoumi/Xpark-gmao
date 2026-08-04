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
| `Mission-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Mission-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Mission-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `Mission-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `Mission-component.puml` | Composants internes |
| `Mission-package.puml` | Paquets et sens des dependances |
| `Mission-communication.puml` | Communication entre composants |
| `Mission-activity.puml` | Activites du processus metier |
| `Mission-state.puml` | Etats-transitions |
| `Mission-database.puml` | Persistance et tables accedees |
| `Mission-api-flow.puml` | Sequence d'un appel de service |
| `Mission-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |
| `Mission-optimization-flow.puml` | Flux d'optimisation |

### Sequences (un fichier par scenario)

Le diagramme de sequence unique combinait plusieurs cas d'utilisation.
Un diagramme de sequence decrivant UN scenario, il a ete scinde :

| Fichier | Scenario |
|---|---|
| `sequence/Mission-seq-demande-transport.puml` | Depot d'une demande de transport |
| `sequence/Mission-seq-devis.puml` | Etablissement et acceptation d'un devis |
| `sequence/Mission-seq-suivi-direct.puml` | Suivi d'une mission en direct |


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
