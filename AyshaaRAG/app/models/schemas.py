"""
Schémas Pydantic des échanges API — contrat documenté dans docs/api.md.
La validation stricte (longueurs, types) est la première ligne de défense.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000,
                         description="Message de l'utilisateur (fr / en / darija)")
    session_id: str | None = Field(default=None, max_length=64,
                                   description="UUID de session ; absent au 1er message")


class Source(BaseModel):
    title: str = ""
    section: str = ""
    topic: str = ""


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    lang: str
    provider: str
    sources: list[Source] = []
    suggestions: list[str] = []


class GreetingResponse(BaseModel):
    message: str
    suggestions: list[str]
    lang: str


class HealthResponse(BaseModel):
    status: str
    components: dict


class ReindexResponse(BaseModel):
    chunks: int
    qdrant_indexed: int | bool
