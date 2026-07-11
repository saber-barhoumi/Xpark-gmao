"""Retrieval lexical + fusion RRF — sans Qdrant ni modèle (unitaires purs)."""
from pathlib import Path

from app.rag.chunking import load_knowledge_base
from app.rag.lexical import LexicalIndex
from app.rag.retriever import HybridRetriever

KNOWLEDGE = Path(__file__).resolve().parents[1] / "knowledge"


def _index() -> LexicalIndex:
    idx = LexicalIndex()
    idx.build(load_knowledge_base(KNOWLEDGE))
    return idx


def test_bm25_finds_pricing_in_french():
    hits = _index().search("combien coûte un transport prix devis", top_k=5, lang="fr")
    assert hits
    assert any(h["topic"] == "reservation" for h in hits)


def test_bm25_finds_mfa_in_english():
    hits = _index().search("authenticator MFA security code", top_k=5, lang="en")
    assert hits
    assert any(h["topic"] == "compte" for h in hits)


def test_bm25_finds_tracking_in_arabic():
    hits = _index().search("كيفاش نتبع التوصيلة", top_k=5, lang="ar")
    assert hits
    assert any(h["topic"] == "suivi" for h in hits)


def test_rrf_fusion_prefers_documents_ranked_in_both_lists():
    both = {"id": "A", "text": "a", "score": 0.9}
    dense_only = {"id": "B", "text": "b", "score": 0.5}
    sparse_only = {"id": "C", "text": "c", "score": 3.2}
    fused = HybridRetriever._rrf({"dense": [both, dense_only], "bm25": [both, sparse_only]}, k=60)
    assert fused[0]["id"] == "A"
    assert {d["id"] for d in fused} == {"A", "B", "C"}
    assert set(fused[0]["origins"]) == {"dense", "bm25"}
    assert fused[1]["origins"].keys() != fused[0]["origins"].keys()
