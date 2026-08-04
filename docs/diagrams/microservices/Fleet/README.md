# Fleet

**Source analysee** : `microservices/Fleet`

**Conteneur** : `fleet-api` — port publie `5002`

**Role** : Vehicules, equipements, assurances, documents, carburant, echeances

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 7 |
| Endpoints HTTP | 47 |
| Entites du domaine | 6 |
| Enumerations locales | 0 |
| DTO | 19 |
| Interfaces (ports) | 7 |
| Implementations | 7 |
| DbSet | 6 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `FleetDbContext`

## Controleurs et routes

- `AssurancesController` — route `api/assurances` (4 endpoints)
- `CarburantsController` — route `api/[controller]` (5 endpoints)
- `DocumentsController` — route `api/documents` (4 endpoints)
- `EcheancesController` — route `api/echeances` (1 endpoints)
- `EquipementsController` — route `api/equipements` (17 endpoints)
- `SourcesController` — route `api/[controller]` (7 endpoints)
- `VehiculesController` — route `api/[controller]` (9 endpoints)

## Messagerie

Routing keys sur l'exchange topic `xpark.ai` : `xpark.fleet.maintenance-due`, `xpark.fleet.vehicle-added`, `xpark.fleet.vehicle-breakdown`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Fleet-sequence.puml` | Sequence d'un flux metier reel du service |
| `Fleet-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `Fleet-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `Fleet-entities.puml` | Entites persistees, cles et relations |
| `Fleet-class.puml` | Classes des quatre couches et leurs dependances |
| `Fleet-component.puml` | Composants internes et points d'entree |
| `Fleet-package.puml` | Organisation en paquets et sens des dependances |
| `Fleet-activity.puml` | Deroulement metier de bout en bout |
| `Fleet-state.puml` | Etats et transitions des objets du domaine |
| `Fleet-database.puml` | Persistance et tables accedees |
| `Fleet-api-flow.puml` | Cheminement complet d'un appel API |
| `Fleet-service-flow.puml` | Traversee des couches internes |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Fleet-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Fleet-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Fleet-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Fleet-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Fleet-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Fleet-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Fleet-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Fleet-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
