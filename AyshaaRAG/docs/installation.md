# Guide d'installation

## Prérequis

- Docker Desktop (le projet XPARK tourne déjà en compose)
- ~500 Mo de disque : image Python + modèle d'embeddings (téléchargé au
  premier démarrage puis mis en cache dans le volume `ayshaa-data`)
- Optionnel LLM : ~2,5 Go supplémentaires (image Ollama + qwen2.5:3b)

## Installation Docker (recommandée)

Les services sont déjà déclarés dans le `docker-compose.yml` racine :

```bash
cd "C:\Users\saber\Desktop\Xpark gmao"

# 1. Base vectorielle + assistante
docker compose up -d qdrant ayshaa-rag

# 2. Vérifier (l'indexation prend ~20 s au premier démarrage :
#    téléchargement du modèle d'embeddings)
curl http://localhost:8010/health
# → {"status":"ok","components":{"qdrant":"up","embeddings":"up","bm25_chunks":81,...}}

# 3. Frontoffice avec le widget intégré
docker compose up -d frontoffice
# → http://localhost:3001 : bouton Ayshaa en bas à gauche
```

### Activer le LLM génératif (optionnel)

Sans lui, Ayshaa fonctionne en mode extractif (réponses composées depuis la
base de connaissances). Avec lui, les réponses deviennent génératives et
conversationnelles :

```bash
docker compose --profile llm up -d ollama
docker exec xpark-ollama ollama pull qwen2.5:3b-instruct   # ~2 Go, une seule fois
# Ayshaa le détecte automatiquement (health-check 30 s) — rien à redémarrer.
curl http://localhost:8010/health   # → "llm": "up"
```

## Installation locale (développement)

```bash
cd AyshaaRAG
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements-dev.txt

# Qdrant en conteneur (ou binaire local)
docker run -d -p 6333:6333 qdrant/qdrant:v1.12.4

# Configuration
copy .env.example .env             # puis adapter AYSHAA_QDRANT_URL=http://localhost:6333

# Lancer
uvicorn app.main:app --reload --port 8010
# Swagger : http://localhost:8010/docs

# Tests
pytest tests/ -q                   # 16 tests
```

## Vérification de bout en bout

```bash
# Accueil trilingue
curl "http://localhost:8010/api/v1/greeting?lang=ar"

# Question (PowerShell : utiliser un fichier JSON UTF-8 pour les accents)
curl -X POST http://localhost:8010/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What services does XPARK offer?"}'
```

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `embeddings: lexical-only` dans /health | téléchargement du modèle bloqué (réseau) | le service fonctionne en BM25 seul ; relancer plus tard, le modèle se met en cache |
| `qdrant: down` | conteneur qdrant arrêté | `docker compose up -d qdrant` puis `POST /admin/reindex` |
| `llm: extractive-fallback` | Ollama absent ou modèle non tiré | voir « Activer le LLM » ci-dessus (facultatif) |
| 429 sur /chat | rate-limit 30 msg/min/IP | attendre 1 min ou ajuster `AYSHAA_RATE_LIMIT_RPM` |
| Le widget ne répond pas | CORS | vérifier `AYSHAA_CORS_ORIGINS` contient l'origine du site |
