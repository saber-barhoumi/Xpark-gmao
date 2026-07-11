# Guide de déploiement

## Topologie Docker (actuelle)

| Conteneur | Image | Port | Volume |
|---|---|---|---|
| `xpark-ayshaa-rag` | build `./AyshaaRAG` | 8010 | `ayshaa-data` (mémoire SQLite + cache modèle) |
| `xpark-qdrant` | `qdrant/qdrant:v1.12.4` | 6333 | `qdrant-data` (vecteurs) |
| `xpark-ollama` (profil `llm`) | `ollama/ollama` | 11434 | `ollama-data` (modèles) |

```bash
docker compose up -d qdrant ayshaa-rag                 # cœur
docker compose --profile llm up -d ollama              # LLM optionnel
docker exec xpark-ollama ollama pull qwen2.5:3b-instruct
```

## Checklist de mise en production

1. **Secrets** : `AYSHAA_ADMIN_API_KEY` fort (32+ caractères aléatoires),
   injecté par l'environnement — jamais dans le dépôt.
2. **CORS** : `AYSHAA_CORS_ORIGINS=["https://www.xpark.tn"]` (domaine réel
   uniquement).
3. **TLS / reverse proxy** : exposer 8010 derrière le nginx existant ;
   pour le SSE, désactiver le buffering (`proxy_buffering off;` — le service
   envoie déjà `X-Accel-Buffering: no`).
4. **Qdrant** : ne pas exposer 6333 publiquement (réseau Docker interne
   suffit) ; activer l'API key Qdrant si le réseau n'est pas isolé.
5. **Ressources** : le service tient dans 512 Mo de RAM (embeddings inclus) ;
   Ollama qwen2.5:3b demande ~4 Go — le placer sur une machine adaptée ou
   rester en mode extractif.

## Sauvegardes

- **Base de connaissances** : `knowledge/` est dans Git — c'est la source de
  vérité ; Qdrant se reconstruit intégralement avec `POST /admin/reindex`.
- **Qdrant** : snapshots natifs si besoin
  (`POST :6333/collections/ayshaa_kb/snapshots`).
- **Mémoire** : `ayshaa-data` (SQLite) — donnée éphémère (TTL 24 h), la
  perte est acceptable par conception.

## Scaling horizontal (évolution documentée)

L'instance unique suffit largement pour un site vitrine (le retrieval prend
~30 ms, l'extractif est instantané). Pour scaler :

1. **Mémoire** : remplacer `SqliteStore` par un `RedisStore` (même interface
   `ConversationStore` — un seul fichier à ajouter).
2. **Rate-limit** : déplacer les compteurs vers Redis (même middleware).
3. **BM25** : chaque réplique reconstruit son index au démarrage (< 100 ms) —
   aucun partage nécessaire.
4. **Qdrant** : déjà centralisé, supporte la réplication en cluster.
5. Mettre les répliques derrière le load-balancer nginx existant.

## Monitoring

- `/health` → sonde de vivacité par composant (à brancher sur l'orchestrateur).
- `/metrics` → Prometheus ; tableaux utiles :
  - `rate(ayshaa_chat_messages_total[5m])` par langue et provider ;
  - `histogram_quantile(0.95, ayshaa_chat_latency_seconds)` ;
  - `ayshaa_chat_no_answer_total` — **l'indicateur de qualité de la KB** :
    s'il augmente, des questions réelles ne trouvent pas de réponse → lire
    les logs `chat_answered` (lang, msg_chars) et enrichir `knowledge/`.
- Logs JSON sur stdout → collecteur (Loki/ELK) sans configuration.
