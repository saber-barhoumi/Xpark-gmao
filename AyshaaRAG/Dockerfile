# ── Ayshaa RAG — image de production ─────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /srv/ayshaa

# Dépendances d'abord (cache de layer Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code + base de connaissances
COPY app ./app
COPY knowledge ./knowledge

# Cache des modèles d'embedding + mémoire SQLite (volume)
ENV FASTEMBED_CACHE_PATH=/data/models_cache
RUN mkdir -p /data

EXPOSE 8010

# 1 worker : BM25 et la mémoire vivent en process ; scaling horizontal documenté
# dans docs/deployment.md (Redis + index partagé).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010", "--workers", "1"]
