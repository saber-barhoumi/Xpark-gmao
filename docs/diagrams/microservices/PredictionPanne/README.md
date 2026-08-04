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
| `PredictionPanne-sequence.puml` | Sequence d'un flux metier reel du service |
| `PredictionPanne-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `PredictionPanne-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `PredictionPanne-entities.puml` | Entites persistees, cles et relations |
| `PredictionPanne-class.puml` | Classes des quatre couches et leurs dependances |
| `PredictionPanne-component.puml` | Composants internes et points d'entree |
| `PredictionPanne-package.puml` | Organisation en paquets et sens des dependances |
| `PredictionPanne-activity.puml` | Deroulement metier de bout en bout |
| `PredictionPanne-state.puml` | Etats et transitions des objets du domaine |
| `PredictionPanne-database.puml` | Persistance et tables accedees |
| `PredictionPanne-api-flow.puml` | Cheminement complet d'un appel API |
| `PredictionPanne-service-flow.puml` | Traversee des couches internes |
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
