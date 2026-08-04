# AI-Optimizer

**Source analysee** : `OptimisateurFlotteIA`

**Conteneur** : `ai-optimizer` — port publie `8001`

**Role** : Optimisation d'affectation vehicule/chauffeur

## Ce que contient le service

| Element | Nombre |
|---|---|
| Modules Python | 6 |
| Endpoints FastAPI | 2 |
| Classes | 2 |
| Modeles Pydantic | 10 |

## Endpoints

- `GET /health` → `health()`
- `POST /optimize` → `run_optimization()`

## Messagerie

Exchanges : `xpark.ai`
Files : `optimizer.ready-for-optimization`

## Dependances principales

`constraints`, `fastapi`, `models`, `optimizer`, `pika`, `pydantic`, `rabbitmq_consumer`, `scoring`, `uvicorn`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `AI-Optimizer-sequence.puml` | Sequence d'un flux metier reel du service |
| `AI-Optimizer-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `AI-Optimizer-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `AI-Optimizer-entities.puml` | Entites persistees, cles et relations |
| `AI-Optimizer-class.puml` | Classes des quatre couches et leurs dependances |
| `AI-Optimizer-component.puml` | Composants internes et points d'entree |
| `AI-Optimizer-package.puml` | Organisation en paquets et sens des dependances |
| `AI-Optimizer-activity.puml` | Deroulement metier de bout en bout |
| `AI-Optimizer-state.puml` | Etats et transitions des objets du domaine |
| `AI-Optimizer-database.puml` | Persistance et tables accedees |
| `AI-Optimizer-api-flow.puml` | Cheminement complet d'un appel API |
| `AI-Optimizer-service-flow.puml` | Traversee des couches internes |
| `AI-Optimizer-optimization-flow.puml` | Flux d'optimisation |
| `AI-Optimizer-inference-flow.puml` | Flux d'inference |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `AI-Optimizer-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `AI-Optimizer-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `AI-Optimizer-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `AI-Optimizer-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `AI-Optimizer-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `AI-Optimizer-training-flow.puml` : aucun code d'entrainement dans le depot.

## Regeneration

Voir [`../../README.md`](../../README.md).
