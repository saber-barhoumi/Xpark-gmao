"""
Couche d'accès Qdrant — collection `ayshaa_kb`.

Pourquoi Qdrant : base vectorielle dédiée (HNSW), filtrage par payload
(langue, audience) au moment de la recherche — indispensable pour servir
la bonne langue —, API simple, conteneur léger, snapshots pour la sauvegarde.

Schéma de la collection (docs/database-schema.md) :
    vecteur : 384 float32, distance cosinus
    payload : { text, source, title, section, lang, topic, audience }
"""
from __future__ import annotations

import logging

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, FieldCondition, Filter, MatchValue, PointStruct, VectorParams,
)

from app.config import get_settings
from app.core.metrics import COMPONENT_ERRORS
from app.rag.chunking import Chunk

log = logging.getLogger("ayshaa.vectorstore")


class QdrantStore:
    def __init__(self) -> None:
        s = get_settings()
        self.collection = s.qdrant_collection
        self.client = QdrantClient(url=s.qdrant_url, timeout=10)

    def ping(self) -> bool:
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False

    def ensure_collection(self) -> None:
        s = get_settings()
        existing = {c.name for c in self.client.get_collections().collections}
        if self.collection not in existing:
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(size=s.embed_dim, distance=Distance.COSINE),
            )
            log.info("collection created: %s", self.collection)

    def count(self) -> int:
        try:
            return self.client.count(self.collection, exact=True).count
        except Exception:
            return 0

    def reindex(self, chunks: list[Chunk], vectors: list[list[float]]) -> int:
        """Réécriture complète (delete + upsert) — la KB est petite et versionnée."""
        self.ensure_collection()
        self.client.delete_collection(self.collection)
        self.ensure_collection()
        points = [
            PointStruct(id=c.id, vector=v, payload={"text": c.text, **c.metadata})
            for c, v in zip(chunks, vectors)
        ]
        # Upsert par lots (Qdrant recommande < 1000 points par appel)
        for i in range(0, len(points), 256):
            self.client.upsert(self.collection, points=points[i:i + 256])
        log.info("reindexed %d chunks", len(points))
        return len(points)

    def search(self, vector: list[float], top_k: int, lang: str | None = None) -> list[dict]:
        """Recherche dense, avec filtre de langue optionnel."""
        try:
            flt = None
            if lang:
                flt = Filter(must=[FieldCondition(key="lang", match=MatchValue(value=lang))])
            hits = self.client.search(
                collection_name=self.collection, query_vector=vector,
                limit=top_k, query_filter=flt, with_payload=True,
            )
            return [{"id": str(h.id), "score": h.score, **(h.payload or {})} for h in hits]
        except Exception as exc:
            COMPONENT_ERRORS.labels(component="qdrant").inc()
            log.warning("qdrant search failed: %s", exc)
            return []
