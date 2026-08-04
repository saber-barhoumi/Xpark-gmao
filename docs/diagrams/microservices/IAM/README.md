# IAM

**Source analysee** : `microservices/IAM`

**Conteneur** : `iam-api` — port publie `5001`

**Role** : Identites, authentification, MFA, roles, archivage des comptes

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 5 |
| Endpoints HTTP | 64 |
| Entites du domaine | 8 |
| Enumerations locales | 0 |
| DTO | 34 |
| Interfaces (ports) | 8 |
| Implementations | 9 |
| DbSet | 8 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `IamDbContext`

## Controleurs et routes

- `AuthController` — route `api/auth` (28 endpoints)
- `ClientsController` — route `api/clients` (5 endpoints)
- `EmployeesController` — route `api/employees` (7 endpoints)
- `UserManagementController` — route `api/user-management` (17 endpoints)
- `UsersController` — route `api/users` (7 endpoints)

## Messagerie

Evenements publies (MassTransit) : `ClientCreatedEvent`, `EmployeeCreatedEvent`, `UserApprovedEvent`, `UserRegisteredEvent`, `UserStatusChangedEvent`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `IAM-usecase.puml` | Cas d'utilisation (acteurs, << include >>, << extend >>) |
| `IAM-entities.puml` | Modele du domaine : entites, associations et cardinalites |
| `IAM-class-domain.puml` | Classes du domaine : entites, enumerations, multiplicites |
| `IAM-class-architecture.puml` | Classes de conception : couches, interfaces, realisations |
| `IAM-component.puml` | Composants internes |
| `IAM-package.puml` | Paquets et sens des dependances |
| `IAM-communication.puml` | Communication entre composants |
| `IAM-activity.puml` | Activites du processus metier |
| `IAM-state.puml` | Etats-transitions |
| `IAM-database.puml` | Persistance et tables accedees |
| `IAM-api-flow.puml` | Sequence d'un appel de service |
| `IAM-service-flow.puml` | Chaine interne en couches (dependances vers l'interieur) |

### Sequences (un fichier par scenario)

Le diagramme de sequence unique combinait plusieurs cas d'utilisation.
Un diagramme de sequence decrivant UN scenario, il a ete scinde :

| Fichier | Scenario |
|---|---|
| `sequence/IAM-seq-approbation-compte.puml` | Approbation d'un compte |
| `sequence/IAM-seq-inscription.puml` | Inscription d'un compte |


## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `IAM-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `IAM-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `IAM-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `IAM-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `IAM-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `IAM-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `IAM-training-flow.puml` : aucun code d'entrainement dans le depot.
- `IAM-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
