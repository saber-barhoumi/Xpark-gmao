"""
Service d'embeddings — fastembed (ONNX Runtime).

Pourquoi fastembed plutôt que sentence-transformers : pas de dépendance
PyTorch (~2 Go), inférence CPU rapide et quantifiée, maintenu par l'équipe
Qdrant. Modèle : paraphrase-multilingual-MiniLM-L12-v2 (384 dim), couvre
français, anglais et arabe — le meilleur compromis taille/qualité pour un
chat trilingue.

Résilience : si le modèle ne peut pas être téléchargé (réseau coupé), le
service N'ÉCHOUE PAS — il bascule en retrieval lexical seul (BM25) et le
signale dans /health. C'est le pattern « dégradation gracieuse » appliqué
partout dans Ayshaa.
"""
from __future__ import annotations

import logging
import threading

from app.config import get_settings
from app.core.metrics import COMPONENT_ERRORS

log = logging.getLogger("ayshaa.embeddings")


class EmbeddingService:
    def __init__(self) -> None:
        self._model = None
        self._lock = threading.Lock()
        self._failed = False

    @property
    def available(self) -> bool:
        return self._model is not None

    def load(self) -> bool:
        """Charge le modèle (téléchargé au premier démarrage, puis cache disque)."""
        if self._model is not None:
            return True
        if self._failed:
            return False
        with self._lock:
            if self._model is not None:
                return True
            try:
                from fastembed import TextEmbedding
                self._model = TextEmbedding(model_name=get_settings().embed_model)
                log.info("embedding model loaded")
                return True
            except Exception as exc:  # réseau coupé, disque plein…
                self._failed = True
                COMPONENT_ERRORS.labels(component="embeddings").inc()
                log.warning("embedding model unavailable, lexical-only mode: %s", exc)
                return False

    def embed_documents(self, texts: list[str]) -> list[list[float]] | None:
        if not self.load():
            return None
        return [v.tolist() for v in self._model.embed(texts)]

    def embed_query(self, text: str) -> list[float] | None:
        vectors = self.embed_documents([text])
        return vectors[0] if vectors else None
