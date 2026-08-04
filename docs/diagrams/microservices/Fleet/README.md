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
| `Fleet-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Fleet-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Fleet-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `Fleet-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `Fleet-component.puml` | Composants internes |
| `Fleet-package.puml` | Paquets et sens des dependances |
| `Fleet-communication.puml` | Communication entre composants |
| `Fleet-activity.puml` | Activites du processus metier |
| `Fleet-state.puml` | Etats-transitions |
| `Fleet-database.puml` | Persistance et tables accedees |
| `Fleet-api-flow.puml` | Sequence d'un appel de service |
| `Fleet-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |

### Sequences (un fichier par scenario)

Le diagramme de sequence unique combinait plusieurs cas d'utilisation.
Un diagramme de sequence decrivant UN scenario, il a ete scinde :

| Fichier | Scenario |
|---|---|
| `sequence/Fleet-seq-changement-etat.puml` | Changement d'etat d'un vehicule |
| `sequence/Fleet-seq-immatriculation.puml` | Immatriculation d'un vehicule |
| `sequence/Fleet-seq-suivi-echeances.puml` | Suivi des echeances administratives |


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
