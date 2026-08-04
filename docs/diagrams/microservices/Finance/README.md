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
| `Finance-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Finance-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `Finance-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `Finance-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `Finance-component.puml` | Composants internes |
| `Finance-package.puml` | Paquets et sens des dependances |
| `Finance-sequence.puml` | Sequence d'un scenario metier |
| `Finance-communication.puml` | Communication entre composants |
| `Finance-activity.puml` | Activites du processus metier |
| `Finance-state.puml` | Etats-transitions |
| `Finance-database.puml` | Persistance et tables accedees |
| `Finance-api-flow.puml` | Sequence d'un appel de service |
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
