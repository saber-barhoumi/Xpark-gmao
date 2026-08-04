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
| `IBOA-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `IBOA-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `IBOA-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `IBOA-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `IBOA-component.puml` | Composants internes |
| `IBOA-package.puml` | Paquets et sens des dependances |
| `IBOA-sequence.puml` | Sequence d'un scenario metier |
| `IBOA-communication.puml` | Communication entre composants |
| `IBOA-activity.puml` | Activites du processus metier |
| `IBOA-state.puml` | Etats-transitions |
| `IBOA-database.puml` | Persistance et tables accedees |
| `IBOA-api-flow.puml` | Sequence d'un appel de service |
| `IBOA-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |
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
