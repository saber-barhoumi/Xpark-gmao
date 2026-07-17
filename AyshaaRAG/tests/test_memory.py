"""Mémoire de conversation — fenêtre glissante et isolation des sessions."""
from app.memory.store import SqliteStore


def _store(tmp_path):
    return SqliteStore(db_path=str(tmp_path / "mem.db"))


def test_window_returns_last_turns_in_order(tmp_path):
    store = _store(tmp_path)
    sid = store.new_session()
    for i in range(10):
        store.append(sid, "user", f"q{i}")
        store.append(sid, "assistant", f"a{i}")
    hist = store.history(sid, max_turns=4)
    assert [m["content"] for m in hist] == ["q8", "a8", "q9", "a9"]


def test_sessions_are_isolated(tmp_path):
    store = _store(tmp_path)
    s1, s2 = store.new_session(), store.new_session()
    store.append(s1, "user", "bonjour")
    assert store.history(s2, 8) == []
