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
| `IAM-sequence.puml` | Sequence d'un flux metier reel du service |
| `IAM-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `IAM-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `IAM-entities.puml` | Entites persistees, cles et relations |
| `IAM-class.puml` | Classes des quatre couches et leurs dependances |
| `IAM-component.puml` | Composants internes et points d'entree |
| `IAM-package.puml` | Organisation en paquets et sens des dependances |
| `IAM-activity.puml` | Deroulement metier de bout en bout |
| `IAM-state.puml` | Etats et transitions des objets du domaine |
| `IAM-database.puml` | Persistance et tables accedees |
| `IAM-api-flow.puml` | Cheminement complet d'un appel API |
| `IAM-service-flow.puml` | Traversee des couches internes |

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
