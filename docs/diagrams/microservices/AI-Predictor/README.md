# AI-Predictor

**Source analysee** : `CalculateurPrixTrajetIA`

**Conteneur** : `ai-predictor` — port publie `8000`

**Role** : Estimation du prix d'un trajet (XGBoost)

## Ce que contient le service

| Element | Nombre |
|---|---|
| Modules Python | 1 |
| Endpoints FastAPI | 4 |
| Classes | 0 |
| Modeles Pydantic | 1 |

## Endpoints

- `GET /health` → `health()`
- `GET /cities` → `get_cities()`
- `GET /distance` → `get_distance()`
- `POST /predict` → `predict()`

## Dependances principales

`fastapi`, `joblib`, `pandas`, `pydantic`, `uvicorn`, `xgboost`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `AI-Predictor-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `AI-Predictor-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `AI-Predictor-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `AI-Predictor-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `AI-Predictor-component.puml` | Diagramme de composants |
| `AI-Predictor-package.puml` | Diagramme de paquets et sens des dependances |
| `AI-Predictor-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `AI-Predictor-communication.puml` | Diagramme de communication entre composants |
| `AI-Predictor-activity.puml` | Diagramme d'activites du processus metier |
| `AI-Predictor-state.puml` | Diagramme d'etats-transitions |
| `AI-Predictor-database.puml` | Persistance et tables accedees |
| `AI-Predictor-api-flow.puml` | Sequence complete d'un appel de service |
| `AI-Predictor-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |
| `AI-Predictor-ml-pipeline.puml` | Chaine d'apprentissage automatique |
| `AI-Predictor-prediction-flow.puml` | Flux de prediction |
| `AI-Predictor-inference-flow.puml` | Flux d'inference |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `AI-Predictor-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `AI-Predictor-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `AI-Predictor-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `AI-Predictor-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `AI-Predictor-training-flow.puml` : aucun code d'entrainement dans le depot.

## Regeneration

Voir [`../../README.md`](../../README.md).
