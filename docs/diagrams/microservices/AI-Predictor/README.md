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
| `AI-Predictor-sequence.puml` | Sequence d'un flux metier reel du service |
| `AI-Predictor-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `AI-Predictor-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `AI-Predictor-entities.puml` | Entites persistees, cles et relations |
| `AI-Predictor-class.puml` | Classes des quatre couches et leurs dependances |
| `AI-Predictor-component.puml` | Composants internes et points d'entree |
| `AI-Predictor-package.puml` | Organisation en paquets et sens des dependances |
| `AI-Predictor-activity.puml` | Deroulement metier de bout en bout |
| `AI-Predictor-state.puml` | Etats et transitions des objets du domaine |
| `AI-Predictor-database.puml` | Persistance et tables accedees |
| `AI-Predictor-api-flow.puml` | Cheminement complet d'un appel API |
| `AI-Predictor-service-flow.puml` | Traversee des couches internes |
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
