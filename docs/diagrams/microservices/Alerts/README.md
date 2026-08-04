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
| `Alerts-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Alerts-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Alerts-entities.puml` | Entites persistees, cles et relations |
| `Alerts-component.puml` | Diagramme de composants |
| `Alerts-package.puml` | Diagramme de paquets et sens des dependances |
| `Alerts-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Alerts-communication.puml` | Diagramme de communication entre composants |
| `Alerts-activity.puml` | Diagramme d'activites du processus metier |
| `Alerts-state.puml` | Diagramme d'etats-transitions |
| `Alerts-database.puml` | Persistance et tables accedees |
| `Alerts-api-flow.puml` | Sequence complete d'un appel de service |
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
