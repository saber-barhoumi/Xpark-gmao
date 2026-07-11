# Guide de configuration

Toutes les variables sont préfixées `AYSHAA_` et lues par `app/config.py`
(pydantic-settings). Ordre de priorité : environnement > `.env` > défauts.
Modèle fourni : `.env.example` (ne jamais committer `.env`).

## Service

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_PORT` | `8010` | port HTTP |
| `AYSHAA_LOG_LEVEL` | `INFO` | verbosité des logs JSON |
| `AYSHAA_CORS_ORIGINS` | `["http://localhost:3001","http://localhost:8080"]` | origines autorisées (JSON array) — **à restreindre au domaine réel en production** |

## Base vectorielle

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_QDRANT_URL` | `http://localhost:6333` | `http://qdrant:6333` en compose |
| `AYSHAA_QDRANT_COLLECTION` | `ayshaa_kb` | nom de la collection |

## Embeddings

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_EMBED_MODEL` | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | modèle fastembed (384 d) |
| `AYSHAA_EMBED_DIM` | `384` | doit correspondre au modèle |
| `FASTEMBED_CACHE_PATH` | `/data/models_cache` (Dockerfile) | cache disque du modèle |

## LLM (Ollama)

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_LLM_ENABLED` | `true` | `false` = extractif permanent |
| `AYSHAA_OLLAMA_URL` | `http://localhost:11434` | `http://ollama:11434` en compose |
| `AYSHAA_OLLAMA_MODEL` | `qwen2.5:3b-instruct` | bon fr/en/ar ; remplaçable (ex. `llama3.2:3b`) |
| `AYSHAA_OLLAMA_TIMEOUT` | `60` | secondes |

## Retrieval

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_RETRIEVAL_TOP_K` | `12` | candidats par retriever avant fusion |
| `AYSHAA_RETRIEVAL_FINAL_K` | `4` | chunks injectés dans le prompt |
| `AYSHAA_RRF_K` | `60` | constante RRF (littérature standard) |
| `AYSHAA_MIN_CONFIDENCE` | `0.45` | cosinus minimal quand BM25 n'a rien matché ; ↑ = plus de « je ne sais pas », ↓ = plus de risques de hors-sujet |

## Mémoire

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_MEMORY_DB` | `data/ayshaa_memory.db` | chemin SQLite (`/data/…` en Docker, volume) |
| `AYSHAA_MEMORY_MAX_TURNS` | `8` | fenêtre glissante envoyée au LLM |
| `AYSHAA_MEMORY_TTL_HOURS` | `24` | purge des conversations |

## Sécurité

| Variable | Défaut | Rôle |
|---|---|---|
| `AYSHAA_ADMIN_API_KEY` | `dev-only-key` | **obligatoirement changée en production** (routes /admin) |
| `AYSHAA_RATE_LIMIT_RPM` | `30` | messages chat / minute / IP |
| `AYSHAA_MAX_MESSAGE_CHARS` | `1000` | longueur maximale d'un message |

## Côté frontoffice

| Variable | Défaut | Rôle |
|---|---|---|
| `NEXT_PUBLIC_AYSHAA_API_URL` | `http://localhost:8010` | URL du service vue par le navigateur (arg de build Next.js) |
