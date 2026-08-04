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
| `IAM-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `IAM-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `IAM-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `IAM-entities.puml` | Entites persistees, cles et relations |
| `IAM-component.puml` | Diagramme de composants |
| `IAM-package.puml` | Diagramme de paquets et sens des dependances |
| `IAM-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `IAM-communication.puml` | Diagramme de communication entre composants |
| `IAM-activity.puml` | Diagramme d'activites du processus metier |
| `IAM-state.puml` | Diagramme d'etats-transitions |
| `IAM-database.puml` | Persistance et tables accedees |
| `IAM-api-flow.puml` | Sequence complete d'un appel de service |
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

## Conformite UML

Les diagrammes de ce dossier suivent les conventions du cours :

- **Cas d'utilisation** : association acteur / cas d'utilisation en trait continu
  sans fleche, acteur secondaire porte par le stereotype `<< secondary >>`,
  `<< include >>` pour une partie obligatoire et `<< extend >>` pour une partie
  optionnelle, generalisation entre acteurs pour eviter les liens redondants.
  Les systemes tiers sont des acteurs places hors de la frontiere du systeme.
- **Classes** : deux diagrammes distincts, l'un pour l'architecture (couches,
  interfaces, realisations), l'autre pour le domaine (entites, enumerations).
  Syntaxe `[Vis] Nom : Type` pour les attributs et `[Vis] Nom(Arg) : TypeRetour`
  pour les operations ; multiplicite indiquee aux deux extremites de chaque
  association ; composition `*--` reservee aux cycles de vie possedes.
- Aucune legende : chaque diagramme se lit seul. Les notes ne portent que sur
  un choix d'architecture.

## Regeneration

Voir [`../../README.md`](../../README.md).
