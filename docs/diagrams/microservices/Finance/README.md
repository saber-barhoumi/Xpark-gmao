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
| `Finance-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Finance-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Finance-entities.puml` | Entites persistees, cles et relations |
| `Finance-component.puml` | Diagramme de composants |
| `Finance-package.puml` | Diagramme de paquets et sens des dependances |
| `Finance-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Finance-communication.puml` | Diagramme de communication entre composants |
| `Finance-activity.puml` | Diagramme d'activites du processus metier |
| `Finance-state.puml` | Diagramme d'etats-transitions |
| `Finance-database.puml` | Persistance et tables accedees |
| `Finance-api-flow.puml` | Sequence complete d'un appel de service |
| `Finance-service-flow.puml` | Traversee des couches internes |

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
