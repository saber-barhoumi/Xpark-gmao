# Alerts

**Source analysee** : `microservices/Alerts`

**Conteneur** : `alerts-api` — port publie `5006`

**Role** : Controles metier periodiques et alertes

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 1 |
| Endpoints HTTP | 18 |
| Entites du domaine | 1 |
| Enumerations locales | 4 |
| DTO | 3 |
| Interfaces (ports) | 3 |
| Implementations | 1 |
| DbSet | 2 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `AlertsDbContext`

## Controleurs et routes

- `AlertesController` — route `api/[controller]` (18 endpoints)

## Appels HTTP sortants

`fleet-api`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Alerts-sequence.puml` | Sequence d'un flux metier reel du service |
| `Alerts-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `Alerts-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `Alerts-entities.puml` | Entites persistees, cles et relations |
| `Alerts-class.puml` | Classes des quatre couches et leurs dependances |
| `Alerts-component.puml` | Composants internes et points d'entree |
| `Alerts-package.puml` | Organisation en paquets et sens des dependances |
| `Alerts-activity.puml` | Deroulement metier de bout en bout |
| `Alerts-state.puml` | Etats et transitions des objets du domaine |
| `Alerts-database.puml` | Persistance et tables accedees |
| `Alerts-api-flow.puml` | Cheminement complet d'un appel API |
| `Alerts-service-flow.puml` | Traversee des couches internes |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Alerts-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Alerts-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Alerts-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Alerts-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Alerts-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Alerts-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Alerts-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Alerts-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
