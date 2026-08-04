# Mission

**Source analysee** : `microservices/Mission`

**Conteneur** : `mission-api` — port publie `5003`

**Role** : Demandes de transport, devis, missions, suivi GPS, optimisation

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 5 |
| Endpoints HTTP | 34 |
| Entites du domaine | 4 |
| Enumerations locales | 6 |
| DTO | 6 |
| Interfaces (ports) | 6 |
| Implementations | 4 |
| DbSet | 5 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `MissionDbContext`

## Controleurs et routes

- `DataMigrationController` — route `api/ai-data` (2 endpoints)
- `MissionsController` — route `api/[controller]` (12 endpoints)
- `SupportController` — route `api/support` (5 endpoints)
- `TrackingController` — route `api/tracking` (3 endpoints)
- `TransportRequestsController` — route `api/missions/demandes` (12 endpoints)

## Messagerie

Routing keys sur l'exchange topic `xpark.ai` : `xpark.mission.client-request`, `xpark.mission.task-cancelled`, `xpark.mission.task-completed`, `xpark.missions.ready-for-optimization`, `xpark.optimization.plan-generated`

## Appels HTTP sortants

`finance-api:8080`, `fleet-api:8080`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Mission-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Mission-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Mission-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Mission-entities.puml` | Entites persistees, cles et relations |
| `Mission-component.puml` | Diagramme de composants |
| `Mission-package.puml` | Diagramme de paquets et sens des dependances |
| `Mission-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Mission-communication.puml` | Diagramme de communication entre composants |
| `Mission-activity.puml` | Diagramme d'activites du processus metier |
| `Mission-state.puml` | Diagramme d'etats-transitions |
| `Mission-database.puml` | Persistance et tables accedees |
| `Mission-api-flow.puml` | Sequence complete d'un appel de service |
| `Mission-service-flow.puml` | Traversee des couches internes |
| `Mission-optimization-flow.puml` | Flux d'optimisation |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Mission-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Mission-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Mission-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Mission-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Mission-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Mission-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Mission-inference-flow.puml` : pas d'inference dans ce service.

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
