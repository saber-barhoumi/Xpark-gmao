# Finance

**Source analysee** : `microservices/Finance`

**Conteneur** : `finance-api` — port publie `5005`

**Role** : Facturation des missions livrees, suivi des impayes

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 3 |
| Endpoints HTTP | 9 |
| Entites du domaine | 3 |
| Enumerations locales | 7 |
| DTO | 11 |
| Interfaces (ports) | 4 |
| Implementations | 1 |
| DbSet | 4 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `FinanceDbContext`

## Controleurs et routes

- `CarburantsController` — route `(aucune)` (0 endpoints)
- `FacturesController` — route `api/[controller]` (9 endpoints)
- `SourcesController` — route `(aucune)` (0 endpoints)

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Finance-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Finance-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Finance-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Finance-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Finance-component.puml` | Diagramme de composants |
| `Finance-package.puml` | Diagramme de paquets et sens des dependances |
| `Finance-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Finance-communication.puml` | Diagramme de communication entre composants |
| `Finance-activity.puml` | Diagramme d'activites du processus metier |
| `Finance-state.puml` | Diagramme d'etats-transitions |
| `Finance-database.puml` | Persistance et tables accedees |
| `Finance-api-flow.puml` | Sequence complete d'un appel de service |
| `Finance-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Finance-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Finance-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Finance-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Finance-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Finance-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Finance-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Finance-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Finance-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
