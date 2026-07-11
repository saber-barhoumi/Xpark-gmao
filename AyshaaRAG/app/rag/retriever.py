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
from app.rag.language import expand_arabizi
from app.rag.lexical import LexicalIndex
from app.rag.vectorstore import QdrantStore


class HybridRetriever:
    def __init__(self, store: QdrantStore, lexical: LexicalIndex, embeddings: EmbeddingService):
        self.store = store
        self.lexical = lexical
        self.embeddings = embeddings

    def retrieve(self, query: str, lang: str) -> list[dict]:
        s = get_settings()
        # Darija romanisée : étendre la requête BM25 avec les équivalents arabes
        # (la KB tounsi est en écriture arabe)
        lexical_query = expand_arabizi(query) if lang == "ar" else query

        dense = self._dense(query, s.retrieval_top_k, lang)
        sparse = self.lexical.search(lexical_query, s.retrieval_top_k, lang)

        # Rappel insuffisant dans la langue → élargir toutes langues
        if len(dense) + len(sparse) < 3:
            dense = dense or self._dense(query, s.retrieval_top_k, None)
            sparse = sparse or self.lexical.search(lexical_query, s.retrieval_top_k, None)

        fused = self._rrf({"dense": dense, "bm25": sparse}, k=s.rrf_k)

        # Boost léger des chunks dans la langue de l'utilisateur (re-ranking)
        for doc in fused:
            if doc.get("lang") == lang:
                doc["rrf_score"] *= 1.15
        fused.sort(key=lambda d: d["rrf_score"], reverse=True)

        return self._select_context(fused, s.retrieval_final_k)

    @staticmethod
    def _select_context(fused: list[dict], final_k: int) -> list[dict]:
        """Sélection du contexte : seuil RELATIF au meilleur score + dédoublonnage
        par section. Évite d'injecter un 2e chunk hors sujet juste parce qu'il
        existe — la cause des réponses « collées » sans rapport avec la question."""
        if not fused:
            return []
        top = fused[0]["rrf_score"]
        selected: list[dict] = []
        seen_sections: set[tuple] = set()
        for doc in fused:
            if len(selected) >= final_k:
                break
            if doc["rrf_score"] < 0.60 * top and selected:
                break   # trop loin du meilleur → bruit
            key = (doc.get("source"), doc.get("section"))
            if key in seen_sections:
                continue
            seen_sections.add(key)
            selected.append(doc)
        return selected

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
