"""
Retriever hybride — dense (Qdrant) + lexical (BM25) fusionnés par RRF.

Reciprocal Rank Fusion : score(d) = Σ 1 / (k + rang_i(d)). Choisi parce qu'il
fusionne des listes aux échelles de score incomparables (cosinus vs BM25)
sans aucune calibration, et qu'il est l'état de l'art simple pour l'hybride.

Stratégie de langue : on cherche d'abord dans la langue de l'utilisateur ;
si le rappel est trop faible (KB incomplète dans cette langue), on élargit
toutes langues confondues — le générateur traduira/adaptera la réponse.
"""
from __future__ import annotations

from app.config import get_settings
from app.rag.embeddings import EmbeddingService
from app.rag.lexical import LexicalIndex
from app.rag.vectorstore import QdrantStore


class HybridRetriever:
    def __init__(self, store: QdrantStore, lexical: LexicalIndex, embeddings: EmbeddingService):
        self.store = store
        self.lexical = lexical
        self.embeddings = embeddings

    def retrieve(self, query: str, lang: str) -> list[dict]:
        s = get_settings()
        dense = self._dense(query, s.retrieval_top_k, lang)
        sparse = self.lexical.search(query, s.retrieval_top_k, lang)

        # Rappel insuffisant dans la langue → élargir toutes langues
        if len(dense) + len(sparse) < 3:
            dense = dense or self._dense(query, s.retrieval_top_k, None)
            sparse = sparse or self.lexical.search(query, s.retrieval_top_k, None)

        fused = self._rrf({"dense": dense, "bm25": sparse}, k=s.rrf_k)
        return fused[: s.retrieval_final_k]

    def _dense(self, query: str, top_k: int, lang: str | None) -> list[dict]:
        vector = self.embeddings.embed_query(query)
        if vector is None:   # mode dégradé : BM25 seul
            return []
        return self.store.search(vector, top_k, lang)

    @staticmethod
    def _rrf(result_lists: dict[str, list[dict]], k: int) -> list[dict]:
        """Fusion RRF. Conserve l'origine et le score brut de chaque retriever :
        le pipeline s'en sert pour juger la confiance (preuve lexicale vs dense)."""
        scores: dict[str, float] = {}
        docs: dict[str, dict] = {}
        origins: dict[str, dict[str, float]] = {}
        for origin, results in result_lists.items():
            for rank, doc in enumerate(results):
                did = doc["id"]
                scores[did] = scores.get(did, 0.0) + 1.0 / (k + rank + 1)
                docs.setdefault(did, doc)
                origins.setdefault(did, {})[origin] = float(doc.get("score", 0.0))
        ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
        return [{**docs[did], "rrf_score": score, "origins": origins[did]}
                for did, score in ranked]
