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
| `AI-Optimizer-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `AI-Optimizer-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `AI-Optimizer-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `AI-Optimizer-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `AI-Optimizer-component.puml` | Composants internes |
| `AI-Optimizer-package.puml` | Paquets et sens des dependances |
| `AI-Optimizer-sequence.puml` | Sequence d'un scenario metier |
| `AI-Optimizer-communication.puml` | Communication entre composants |
| `AI-Optimizer-activity.puml` | Activites du processus metier |
| `AI-Optimizer-state.puml` | Etats-transitions |
| `AI-Optimizer-database.puml` | Persistance et tables accedees |
| `AI-Optimizer-api-flow.puml` | Sequence d'un appel de service |
| `AI-Optimizer-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |
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
