# Maintenance

**Source analysee** : `microservices/Maintenance`

**Conteneur** : `maintenance-api` — port publie `5004`

**Role** : Interventions, ordres de travail, pieces de rechange

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 3 |
| Endpoints HTTP | 32 |
| Entites du domaine | 7 |
| Enumerations locales | 8 |
| DTO | 4 |
| Interfaces (ports) | 3 |
| Implementations | 1 |
| DbSet | 8 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `MaintenanceDbContext`

## Controleurs et routes

- `InterventionsController` — route `api/[controller]` (8 endpoints)
- `OrdreTravailController` — route `api/ordres-travail` (16 endpoints)
- `PiecesRechangeController` — route `api/pieces-rechange` (8 endpoints)

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Maintenance-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Maintenance-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Maintenance-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `Maintenance-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `Maintenance-component.puml` | Composants internes |
| `Maintenance-package.puml` | Paquets et sens des dependances |
| `Maintenance-communication.puml` | Communication entre composants |
| `Maintenance-activity.puml` | Activites du processus metier |
| `Maintenance-state.puml` | Etats-transitions |
| `Maintenance-database.puml` | Persistance et tables accedees |
| `Maintenance-api-flow.puml` | Sequence d'un appel de service |
| `Maintenance-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |

### Sequences (un fichier par scenario)

Le diagramme de sequence unique combinait plusieurs cas d'utilisation.
Un diagramme de sequence decrivant UN scenario, il a ete scinde :

| Fichier | Scenario |
|---|---|
| `sequence/Maintenance-seq-intervention.puml` | Declaration d'une intervention |
| `sequence/Maintenance-seq-ordre-travail.puml` | Ouverture et suivi d'un ordre de travail |


## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Maintenance-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Maintenance-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Maintenance-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Maintenance-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Maintenance-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Maintenance-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Maintenance-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Maintenance-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
