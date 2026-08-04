# Ayshaa-RAG

**Source analysee** : `AyshaaRAG`

**Conteneur** : `ayshaa-rag` — port publie `8010`

**Role** : Assistant conversationnel trilingue du site vitrine

## Ce que contient le service

| Element | Nombre |
|---|---|
| Modules Python | 45 |
| Endpoints FastAPI | 8 |
| Classes | 29 |
| Modeles Pydantic | 6 |

## Endpoints

- `POST /reindex` → `reindex()`
- `GET /stats` → `stats()`
- `POST /chat` → `chat()`
- `POST /chat/stream` → `chat_stream()`
- `GET /greeting` → `greeting()`
- `GET /speech/config` → `speech_config()`
- `GET /health` → `health()`
- `GET /metrics` → `metrics()`

## Dependances principales

`__future__`, `fastapi`, `fastembed`, `hmac`, `httpx`, `prometheus_client`, `pydantic`, `pydantic_settings`, `qdrant_client`, `rank_bm25`, `sqlite3`, `starlette`, `this`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Ayshaa-RAG-sequence.puml` | Sequence d'un flux metier reel du service |
| `Ayshaa-RAG-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `Ayshaa-RAG-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `Ayshaa-RAG-entities.puml` | Entites persistees, cles et relations |
| `Ayshaa-RAG-class.puml` | Classes des quatre couches et leurs dependances |
| `Ayshaa-RAG-component.puml` | Composants internes et points d'entree |
| `Ayshaa-RAG-package.puml` | Organisation en paquets et sens des dependances |
| `Ayshaa-RAG-activity.puml` | Deroulement metier de bout en bout |
| `Ayshaa-RAG-state.puml` | Etats et transitions des objets du domaine |
| `Ayshaa-RAG-database.puml` | Persistance et tables accedees |
| `Ayshaa-RAG-api-flow.puml` | Cheminement complet d'un appel API |
| `Ayshaa-RAG-service-flow.puml` | Traversee des couches internes |
| `Ayshaa-RAG-rag-flow.puml` | Chaine de recherche augmentee (RAG) |
| `Ayshaa-RAG-inference-flow.puml` | Flux d'inference |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Ayshaa-RAG-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Ayshaa-RAG-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Ayshaa-RAG-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Ayshaa-RAG-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Ayshaa-RAG-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Ayshaa-RAG-training-flow.puml` : aucun code d'entrainement dans le depot.

## Regeneration

Voir [`../../README.md`](../../README.md).
