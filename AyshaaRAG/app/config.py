"""
Configuration centralisée d'Ayshaa (pydantic-settings).

Toutes les variables sont préfixées AYSHAA_ et surchargées par l'environnement
(docker-compose / .env). Aucune valeur sensible en dur : la clé admin par
défaut n'est valable qu'en développement local.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AYSHAA_", env_file=".env", extra="ignore")

    # ── Service ──────────────────────────────────────────────────────────────
    app_name: str = "Ayshaa RAG"
    version: str = "1.0.0"
    port: int = 8010
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3001", "http://localhost:8080"]

    # ── Base vectorielle (Qdrant) ────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "ayshaa_kb"

    # ── Embeddings (fastembed / ONNX, multilingue fr-en-ar, 384 dim) ────────
    embed_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    embed_dim: int = 384

    # ── LLM génératif (Ollama) — optionnel, repli extractif sinon ───────────
    llm_enabled: bool = True
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:3b-instruct"
    ollama_timeout: int = 60

    # ── Retrieval ────────────────────────────────────────────────────────────
    retrieval_top_k: int = 12       # candidats par retriever (dense et BM25)
    retrieval_final_k: int = 4      # chunks injectés dans le prompt
    rrf_k: int = 60                 # constante Reciprocal Rank Fusion
    min_confidence: float = 0.45    # cosinus dense minimal quand BM25 n'a rien matché

    # ── Mémoire de conversation ──────────────────────────────────────────────
    memory_db: str = "data/ayshaa_memory.db"
    memory_max_turns: int = 8       # fenêtre glissante envoyée au LLM
    memory_ttl_hours: int = 24

    # ── Sécurité ─────────────────────────────────────────────────────────────
    admin_api_key: str = "dev-only-key"
    rate_limit_rpm: int = 30        # requêtes chat / minute / IP
    max_message_chars: int = 1000

    # ── Tool Calling — APIs XPARK (noms de services docker-compose par défaut,
    #    surchargés en local par AYSHAA_*_API_URL=http://localhost:500x) ───────
    iam_api_url: str = "http://iam-api:80"
    mission_api_url: str = "http://mission-api:80"
    fleet_api_url: str = "http://fleet-api:80"
    pricing_api_url: str = "http://ai-predictor:8000"
    tools_timeout: int = 8          # s — un outil lent ne doit pas geler le chat

    # ── Chemins ──────────────────────────────────────────────────────────────
    knowledge_dir: str = "knowledge"
    data_dir: str = "data"


@lru_cache
def get_settings() -> Settings:
    return Settings()
