"""
Mémoire de conversation — fenêtre glissante persistée en SQLite.

Rôle : donner au LLM les derniers échanges pour comprendre « et pour Sfax ? »
après « combien coûte Tunis → Sousse ? ». Une fenêtre de N tours suffit pour
un assistant de site vitrine ; un résumé progressif serait surdimensionné.

Pourquoi SQLite : persistance à travers les redémarrages sans dépendance
supplémentaire ; l'écriture est minuscule (2 lignes par échange). Pour un
scaling multi-instances, remplacer par Redis — l'interface ConversationStore
ne change pas (docs/deployment.md).

Confidentialité : les conversations sont purgées après TTL (24 h par défaut)
et aucune donnée personnelle n'est demandée ni stockée côté serveur.
"""
from __future__ import annotations

import sqlite3
import threading
import time
import uuid
from pathlib import Path
from typing import Protocol

from app.config import get_settings


class ConversationStore(Protocol):
    def new_session(self) -> str: ...
    def append(self, session_id: str, role: str, content: str) -> None: ...
    def history(self, session_id: str, max_turns: int) -> list[dict]: ...
    def purge_expired(self) -> int: ...


class SqliteStore:
    def __init__(self, db_path: str | None = None) -> None:
        path = Path(db_path or get_settings().memory_db)
        path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._db = sqlite3.connect(str(path), check_same_thread=False)
        self._db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at REAL NOT NULL
            )""")
        self._db.execute(
            "CREATE INDEX IF NOT EXISTS ix_messages_session ON messages (session_id, id)")
        self._db.commit()

    def new_session(self) -> str:
        return str(uuid.uuid4())

    def append(self, session_id: str, role: str, content: str) -> None:
        with self._lock:
            self._db.execute(
                "INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)",
                (session_id, role, content[:4000], time.time()))
            self._db.commit()

    def history(self, session_id: str, max_turns: int) -> list[dict]:
        """Derniers `max_turns` messages, du plus ancien au plus récent."""
        with self._lock:
            rows = self._db.execute(
                "SELECT role, content FROM messages WHERE session_id = ? "
                "ORDER BY id DESC LIMIT ?", (session_id, max_turns)).fetchall()
        return [{"role": r, "content": c} for r, c in reversed(rows)]

    def purge_expired(self) -> int:
        ttl = get_settings().memory_ttl_hours * 3600
        cutoff = time.time() - ttl
        with self._lock:
            cur = self._db.execute("DELETE FROM messages WHERE created_at < ?", (cutoff,))
            self._db.commit()
        return cur.rowcount
