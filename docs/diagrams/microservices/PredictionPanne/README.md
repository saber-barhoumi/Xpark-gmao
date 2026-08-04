# PredictionPanne

**Source analysee** : `microservices/PredictionPanne`

**Conteneur** : `prediction-api` — port publie `5009`

**Role** : Maintenance predictive par regles metier

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 1 |
| Endpoints HTTP | 8 |
| Entites du domaine | 3 |
| Enumerations locales | 3 |
| DTO | 8 |
| Interfaces (ports) | 2 |
| Implementations | 2 |
| DbSet | 3 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `PredictionDbContext`

## Controleurs et routes

- `PredictionsController` — route `api/predictions` (8 endpoints)

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `PredictionPanne-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `PredictionPanne-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `PredictionPanne-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `PredictionPanne-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `PredictionPanne-component.puml` | Diagramme de composants |
| `PredictionPanne-package.puml` | Diagramme de paquets et sens des dependances |
| `PredictionPanne-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `PredictionPanne-communication.puml` | Diagramme de communication entre composants |
| `PredictionPanne-activity.puml` | Diagramme d'activites du processus metier |
| `PredictionPanne-state.puml` | Diagramme d'etats-transitions |
| `PredictionPanne-database.puml` | Persistance et tables accedees |
| `PredictionPanne-api-flow.puml` | Sequence complete d'un appel de service |
| `PredictionPanne-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |
| `PredictionPanne-classifier-ia-pipeline.puml` | Chaine de classification |
| `PredictionPanne-prediction-flow.puml` | Flux de prediction |
| `PredictionPanne-inference-flow.puml` | Flux d'inference |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `PredictionPanne-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `PredictionPanne-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `PredictionPanne-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `PredictionPanne-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `PredictionPanne-training-flow.puml` : aucun code d'entrainement dans le depot.

## Regeneration

Voir [`../../README.md`](../../README.md).
