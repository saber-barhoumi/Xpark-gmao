# API Ayshaa — référence

Base : `http://localhost:8010` · Swagger interactif : `http://localhost:8010/docs`

## POST /api/v1/chat

Réponse complète en un appel.

```bash
curl -X POST http://localhost:8010/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment suivre ma livraison ?", "session_id": null}'
```

```json
{
  "session_id": "9f632f07-…",
  "answer": "Voici ce que je peux vous dire 👇 …",
  "lang": "fr",
  "provider": "extractive",
  "sources": [{"title": "Suivre sa livraison…", "section": "Comment suivre…", "topic": "suivi"}],
  "suggestions": ["Quels services propose XPARK ?", "…"]
}
```

| Champ requête | Type | Règles |
|---|---|---|
| `message` | string | 1 à 1000 caractères |
| `session_id` | string \| null | UUID renvoyé par le 1er appel ; null = nouvelle session |

## POST /api/v1/chat/stream

Même corps de requête ; réponse **Server-Sent Events** :

```
event: meta
data: {"session_id": "…", "lang": "fr"}

event: token
data: {"t": "Voici "}

event: done
data: {"sources": […], "suggestions": […], "provider": "ollama"}
```

Le widget consomme ce flux via `fetch` + `ReadableStream` (EventSource ne
supporte pas POST).

## GET /api/v1/greeting?lang=fr|en|ar

Message d'accueil + suggestions dans la langue demandée. Utilisé par le
widget à l'ouverture (accueil automatique du visiteur).

## GET /health

```json
{
  "status": "ok",
  "components": {
    "qdrant": "up",
    "embeddings": "up",
    "bm25_chunks": 81,
    "qdrant_points": 81,
    "llm": "extractive-fallback"
  }
}
```

`status` vaut `degraded` si aucun retriever n'est disponible. `llm` indique
`up` (Ollama actif) ou `extractive-fallback`.

## GET /metrics

Exposition Prometheus : `ayshaa_chat_messages_total{lang,provider}`,
`ayshaa_chat_latency_seconds`, `ayshaa_chat_no_answer_total{lang}`,
`ayshaa_component_errors_total{component}`.

## Endpoints admin (en-tête `X-Admin-Key` obligatoire)

| Endpoint | Rôle |
|---|---|
| `POST /api/v1/admin/reindex` | réindexation à chaud après édition de `knowledge/` |
| `GET /api/v1/admin/stats` | volumétrie (chunks BM25, points Qdrant, purge mémoire) |

```bash
curl -X POST http://localhost:8010/api/v1/admin/reindex -H "X-Admin-Key: $AYSHAA_ADMIN_API_KEY"
```

## Erreurs

| Code | Signification |
|---|---|
| 422 | corps invalide (message vide ou > 1000 caractères) |
| 429 | rate-limit dépassé (30 messages/min/IP) |
| 401 | clé admin invalide |
| 503 | dépendance indisponible (rare : dégradation gracieuse en amont) |
| 500 | erreur interne — `request_id` renvoyé pour corrélation avec les logs |
