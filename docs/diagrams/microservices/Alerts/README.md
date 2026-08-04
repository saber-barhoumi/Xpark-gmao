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
| `Alerts-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Alerts-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Alerts-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Alerts-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Alerts-component.puml` | Diagramme de composants |
| `Alerts-package.puml` | Diagramme de paquets et sens des dependances |
| `Alerts-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Alerts-communication.puml` | Diagramme de communication entre composants |
| `Alerts-activity.puml` | Diagramme d'activites du processus metier |
| `Alerts-state.puml` | Diagramme d'etats-transitions |
| `Alerts-database.puml` | Persistance et tables accedees |
| `Alerts-api-flow.puml` | Sequence complete d'un appel de service |
| `Alerts-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |

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
