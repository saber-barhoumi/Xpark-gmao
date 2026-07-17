"""
Index lexical BM25 — seconde jambe du retrieval hybride.

Pourquoi BM25 en plus du dense : les requêtes de chat contiennent des termes
exacts (« MFA », « facture », « +216 », noms de villes) où la correspondance
lexicale bat l'embedding ; et la darija romanisée (« chhal el prix ») matche
mieux lexicalement que sémantiquement. BM25 est aussi le filet de sécurité si
le modèle d'embedding est indisponible.

L'index vit en mémoire (reconstruit au démarrage et au /admin/reindex) :
la KB fait quelques centaines de chunks, c'est instantané.
"""
from __future__ import annotations

import re

from rank_bm25 import BM25Okapi

from app.rag.chunking import Chunk
from app.agent.language import normalize_arabic

_TOKEN_RE = re.compile(r"[\w؀-ۿ]+")


def tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(normalize_arabic(text.lower()))


class LexicalIndex:
    def __init__(self) -> None:
        self._bm25: BM25Okapi | None = None
        self._chunks: list[Chunk] = []

    @property
    def size(self) -> int:
        return len(self._chunks)

    def build(self, chunks: list[Chunk]) -> None:
        self._chunks = chunks
        corpus = [tokenize(c.text) for c in chunks]
        self._bm25 = BM25Okapi(corpus) if corpus else None

    def search(self, query: str, top_k: int, lang: str | None = None) -> list[dict]:
        if not self._bm25:
            return []
        scores = self._bm25.get_scores(tokenize(query))
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        out: list[dict] = []
        for i in ranked:
            if scores[i] <= 0:
                break
            c = self._chunks[i]
            if lang and c.metadata.get("lang") != lang:
                continue
            out.append({"id": c.id, "score": float(scores[i]), "text": c.text, **c.metadata})
            if len(out) >= top_k:
                break
        return out
