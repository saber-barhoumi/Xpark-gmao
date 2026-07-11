"""Chunker — front-matter, découpe par titres, IDs UUID, fil de provenance."""
import uuid
from pathlib import Path

from app.rag.chunking import chunk_document, load_knowledge_base, parse_front_matter

KNOWLEDGE = Path(__file__).resolve().parents[1] / "knowledge"


def test_front_matter_parsing():
    meta, body = parse_front_matter("---\nlang: fr\ntopic: test\n---\n## Titre\ncontenu")
    assert meta["lang"] == "fr"
    assert meta["topic"] == "test"
    assert body.startswith("## Titre")


def test_chunks_have_uuid_ids_and_metadata():
    chunks = chunk_document(KNOWLEDGE / "entreprise-services.fr.md")
    assert chunks, "le document doit produire des chunks"
    for c in chunks:
        uuid.UUID(c.id)  # lève si l'ID n'est pas un UUID valide (exigence Qdrant)
        assert c.metadata["lang"] == "fr"
        assert c.text.startswith("["), "le fil de provenance doit préfixer le texte"


def test_full_kb_loads_all_three_languages():
    chunks = load_knowledge_base(KNOWLEDGE)
    langs = {c.metadata["lang"] for c in chunks}
    assert langs == {"fr", "en", "ar"}
    assert len(chunks) >= 40  # 15 documents × ~4 sections minimum


def test_chunk_ids_are_deterministic():
    a = chunk_document(KNOWLEDGE / "entreprise-services.fr.md")
    b = chunk_document(KNOWLEDGE / "entreprise-services.fr.md")
    assert [c.id for c in a] == [c.id for c in b]
