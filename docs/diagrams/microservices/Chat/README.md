# Chat

**Source analysee** : `microservices/Chat`

**Conteneur** : `chat-api` — port publie `5007`

**Role** : Messagerie interne temps reel (SignalR)

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 1 |
| Endpoints HTTP | 16 |
| Entites du domaine | 7 |
| Enumerations locales | 3 |
| DTO | 0 |
| Interfaces (ports) | 0 |
| Implementations | 0 |
| DbSet | 6 |
| Consommateurs RabbitMQ | 1 |
| Hubs SignalR | 1 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `ChatDbContext`

## Controleurs et routes

- `ChatController` — route `api/chat` (16 endpoints)

## Messagerie

Consommateur : `UserStatusChangedConsumer` sur `UserStatusChangedEvent`

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Chat-usecase.puml` | Diagramme de cas d'utilisation (acteurs, << include >>, << extend >>) |
| `Chat-class-domain.puml` | Diagramme de classes du domaine : entites, enumerations, multiplicites |
| `Chat-class-architecture.puml` | Diagramme de classes de conception : couches, interfaces, realisations |
| `Chat-entities.puml` | Entites persistees, cles et relations |
| `Chat-component.puml` | Diagramme de composants |
| `Chat-package.puml` | Diagramme de paquets et sens des dependances |
| `Chat-sequence.puml` | Diagramme de sequence d'un flux metier reel |
| `Chat-communication.puml` | Diagramme de communication entre composants |
| `Chat-activity.puml` | Diagramme d'activites du processus metier |
| `Chat-state.puml` | Diagramme d'etats-transitions |
| `Chat-database.puml` | Persistance et tables accedees |
| `Chat-api-flow.puml` | Sequence complete d'un appel de service |
| `Chat-service-flow.puml` | Traversee des couches internes |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Chat-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Chat-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Chat-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Chat-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Chat-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Chat-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Chat-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Chat-inference-flow.puml` : pas d'inference dans ce service.

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
