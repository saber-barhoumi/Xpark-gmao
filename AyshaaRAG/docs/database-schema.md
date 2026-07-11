# Schémas de données

## 1. Qdrant — collection `ayshaa_kb`

| Propriété | Valeur |
|---|---|
| Vecteur | 384 × float32 (paraphrase-multilingual-MiniLM-L12-v2) |
| Distance | Cosinus |
| Index | HNSW (défaut Qdrant) |
| ID de point | UUID v5 déterministe (namespace + fichier + section + n° de morceau) |

### Payload de chaque point

| Champ | Type | Exemple | Rôle |
|---|---|---|---|
| `text` | string | `"[XPARK — L'entreprise > Qui est XPARK ?]\nXPARK est…"` | passage injecté dans le prompt |
| `source` | string | `entreprise-services.fr.md` | fichier d'origine (traçabilité) |
| `title` | string | `XPARK — L'entreprise et ses services` | affiché comme source au widget |
| `section` | string | `Qui est XPARK ?` | idem |
| `lang` | string | `fr` \| `en` \| `ar` | **filtre de recherche** (langue de l'utilisateur) |
| `topic` | string | `entreprise`, `reservation`, `suivi`, `compte`, `interne` | analyses / suggestions |
| `audience` | string | `all` \| `client` \| `staff` | filtrage futur par profil |

Volumétrie actuelle : **81 points** (15 documents × ~5-6 sections).

## 2. SQLite — mémoire de conversation (`/data/ayshaa_memory.db`)

```sql
CREATE TABLE messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL,                                  -- UUID v4
    role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content     TEXT NOT NULL,                                  -- tronqué à 4000 car.
    created_at  REAL NOT NULL                                   -- epoch (purge TTL)
);
CREATE INDEX ix_messages_session ON messages (session_id, id);
```

- Lecture : `ORDER BY id DESC LIMIT 8` puis inversion → fenêtre glissante.
- Purge : `DELETE WHERE created_at < now - 24 h` au démarrage et via
  `/admin/stats`.
- Aucune donnée personnelle : pas de nom, email ni IP stockés.

## 3. Index BM25 (en mémoire)

Reconstruit au démarrage et à chaque `/admin/reindex` depuis les mêmes
chunks : `corpus[i] = tokenize(normalize_arabic(chunk.text))`. Pas de
persistance nécessaire (< 100 ms à construire).
