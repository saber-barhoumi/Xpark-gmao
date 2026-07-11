"""
Ingestion des documents de la base de connaissances → chunks indexables.

Format source : Markdown avec front-matter (--- key: value ---) :
    lang     : fr | en | ar
    topic    : identifiant du sujet (services, reservation, …)
    audience : visitor | client | staff | all
    title    : titre lisible du document

Stratégie de découpage (documentée dans docs/rag-pipeline.md) :
 1. découpe d'abord par titres Markdown (## / ###) — les sections de la KB
    sont des unités de sens autonomes, la meilleure frontière possible ;
 2. si une section dépasse MAX_CHARS, re-découpe par paragraphes avec
    chevauchement pour ne pas couper une information à la frontière.
Chaque chunk garde le fil « Titre du doc > Titre de section » dans son texte :
cela améliore le retrieval ET donne au LLM le contexte de provenance.
"""
from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path

# Namespace fixe → IDs déterministes : réindexer un contenu inchangé produit
# les mêmes IDs (idempotence), et Qdrant exige des IDs au format UUID.
_NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

MAX_CHARS = 1400      # ≈ 350-400 tokens — assez grand pour une idée complète
OVERLAP_CHARS = 150   # chevauchement lors des re-découpes


@dataclass
class Chunk:
    id: str
    text: str
    metadata: dict = field(default_factory=dict)


def parse_front_matter(raw: str) -> tuple[dict, str]:
    """Extrait le front-matter YAML minimal (clé: valeur, une par ligne)."""
    meta: dict = {}
    body = raw
    if raw.startswith("---"):
        end = raw.find("\n---", 3)
        if end != -1:
            for line in raw[3:end].strip().splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip()
            body = raw[end + 4:]
    return meta, body.strip()


def _split_by_headings(body: str) -> list[tuple[str, str]]:
    """[(titre de section, contenu)] — le préambule sans titre garde ''. """
    parts: list[tuple[str, str]] = []
    current_title = ""
    current_lines: list[str] = []
    for line in body.splitlines():
        if re.match(r"^#{2,3}\s", line):
            if current_lines and "".join(current_lines).strip():
                parts.append((current_title, "\n".join(current_lines).strip()))
            current_title = line.lstrip("#").strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines and "".join(current_lines).strip():
        parts.append((current_title, "\n".join(current_lines).strip()))
    return parts


def _split_long(text: str) -> list[str]:
    """Re-découpe par paragraphes avec chevauchement si la section est trop longue."""
    if len(text) <= MAX_CHARS:
        return [text]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    out: list[str] = []
    buf = ""
    for p in paragraphs:
        if buf and len(buf) + len(p) + 2 > MAX_CHARS:
            out.append(buf)
            buf = buf[-OVERLAP_CHARS:] + "\n\n" + p  # chevauchement
        else:
            buf = f"{buf}\n\n{p}".strip()
    if buf:
        out.append(buf)
    return out


def chunk_document(path: Path) -> list[Chunk]:
    meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
    doc_title = meta.get("title", path.stem)
    chunks: list[Chunk] = []
    for section_title, section_text in _split_by_headings(body):
        for i, piece in enumerate(_split_long(section_text)):
            breadcrumb = f"{doc_title}" + (f" > {section_title}" if section_title else "")
            text = f"[{breadcrumb}]\n{piece}"
            uid = str(uuid.uuid5(_NS, f"{path.name}:{section_title}:{i}:{piece[:64]}"))
            chunks.append(Chunk(id=uid, text=text, metadata={
                "source": path.name,
                "title": doc_title,
                "section": section_title,
                "lang": meta.get("lang", "fr"),
                "topic": meta.get("topic", "general"),
                "audience": meta.get("audience", "all"),
            }))
    return chunks


def load_knowledge_base(directory: Path) -> list[Chunk]:
    """Charge tous les .md du dossier knowledge/ en chunks prêts à indexer."""
    chunks: list[Chunk] = []
    for path in sorted(directory.glob("*.md")):
        chunks.extend(chunk_document(path))
    return chunks
