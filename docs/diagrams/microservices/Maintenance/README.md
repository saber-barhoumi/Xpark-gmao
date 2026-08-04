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
| `Maintenance-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Maintenance-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Maintenance-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Maintenance-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Maintenance-component.puml` | Diagramme de composants |
| `Maintenance-package.puml` | Diagramme de paquets et sens des dependances |
| `Maintenance-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Maintenance-communication.puml` | Diagramme de communication entre composants |
| `Maintenance-activity.puml` | Diagramme d'activites du processus metier |
| `Maintenance-state.puml` | Diagramme d'etats-transitions |
| `Maintenance-database.puml` | Persistance et tables accedees |
| `Maintenance-api-flow.puml` | Sequence complete d'un appel de service |
| `Maintenance-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |

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
