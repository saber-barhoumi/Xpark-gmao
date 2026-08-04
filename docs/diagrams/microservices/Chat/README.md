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
| `Chat-sequence.puml` | Sequence d'un flux metier reel du service |
| `Chat-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `Chat-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `Chat-entities.puml` | Entites persistees, cles et relations |
| `Chat-class.puml` | Classes des quatre couches et leurs dependances |
| `Chat-component.puml` | Composants internes et points d'entree |
| `Chat-package.puml` | Organisation en paquets et sens des dependances |
| `Chat-activity.puml` | Deroulement metier de bout en bout |
| `Chat-state.puml` | Etats et transitions des objets du domaine |
| `Chat-database.puml` | Persistance et tables accedees |
| `Chat-api-flow.puml` | Cheminement complet d'un appel API |
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

## Regeneration

Voir [`../../README.md`](../../README.md).
