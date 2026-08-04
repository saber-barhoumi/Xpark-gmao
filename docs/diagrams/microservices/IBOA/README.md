# IBOA

**Source analysee** : `IntelligentBusinessOwnerAssistant`

**Conteneur** : `iboa` — port publie `5008`

**Role** : Journal metier : notation et agregation des evenements

## Ce que contient le service

| Element | Nombre |
|---|---|
| Modules Python | 9 |
| Endpoints FastAPI | 14 |
| Classes | 1 |
| Modeles Pydantic | 6 |

## Endpoints

- `GET /health` → `health()`
- `GET /events` → `get_events()`
- `POST /events/delete` → `delete_events()`
- `DELETE /events` → `delete_all_events()`
- `GET /alerts` → `get_alerts()`
- `POST /alerts/delete` → `delete_alerts()`
- `DELETE /alerts` → `delete_all_alerts()`
- `GET /stats` → `get_stats()`
- `GET /preferences` → `get_preferences()`
- `PUT /preferences` → `put_preferences()`
- `GET /reports/daily.pdf` → `daily_pdf()`
- `GET /reports/daily.xlsx` → `daily_excel()`
- `POST /batch/flush` → `force_flush_batch()`
- `POST /test-event` → `post_test_event()`

## Messagerie

Exchanges : `xpark.ai`
Files : `iboa.events`

## Dependances principales

`aggregator`, `delivery`, `email`, `fastapi`, `formatters`, `models`, `openpyxl`, `pika`, `pipeline`, `psycopg2`, `pydantic`, `rabbitmq_consumer`, `reportlab`, `requests`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `IBOA-sequence.puml` | Sequence d'un flux metier reel du service |
| `IBOA-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `IBOA-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `IBOA-entities.puml` | Entites persistees, cles et relations |
| `IBOA-class.puml` | Classes des quatre couches et leurs dependances |
| `IBOA-component.puml` | Composants internes et points d'entree |
| `IBOA-package.puml` | Organisation en paquets et sens des dependances |
| `IBOA-activity.puml` | Deroulement metier de bout en bout |
| `IBOA-state.puml` | Etats et transitions des objets du domaine |
| `IBOA-database.puml` | Persistance et tables accedees |
| `IBOA-api-flow.puml` | Cheminement complet d'un appel API |
| `IBOA-service-flow.puml` | Traversee des couches internes |
| `IBOA-classifier-ia-pipeline.puml` | Chaine de classification |
| `IBOA-inference-flow.puml` | Flux d'inference |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `IBOA-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `IBOA-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `IBOA-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `IBOA-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `IBOA-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `IBOA-training-flow.puml` : aucun code d'entrainement dans le depot.

## Regeneration

Voir [`../../README.md`](../../README.md).
