# 📚 Portail client XPARK — Documentation des fonctionnalités

Documentation des 6 fonctionnalités du portail client (`http://localhost:3001/account`),
anciennement marquées « BIENTÔT » dans la sidebar.

## Sommaire

| Fonctionnalité | Route | Documentation |
|---|---|---|
| 📍 Suivi en direct | `/account/tracking` | [01-suivi-en-direct.md](01-suivi-en-direct.md) |
| 💰 Finances | `/account/finances` | [02-finances.md](02-finances.md) |
| 📄 Documents | `/account/documents` | [03-documents.md](03-documents.md) |
| 📊 Analyses | `/account/analytics` | [04-analyses.md](04-analyses.md) |
| 🤖 Assistant IA | `/account/assistant` | [05-assistant-ia.md](05-assistant-ia.md) |
| 🎫 Support | `/account/support` | [06-support.md](06-support.md) |
| 💬 Dialogues & notifications | (transverse) | [07-dialogues-et-notifications.md](07-dialogues-et-notifications.md) |

## Architecture générale

```
frontend/frontoffice/
├── app/account/                    # 1 dossier = 1 page du portail
│   ├── tracking/page.js            # 📍 Suivi en direct
│   ├── finances/page.js            # 💰 Finances
│   ├── documents/page.js           # 📄 Documents
│   ├── analytics/page.js           # 📊 Analyses
│   ├── assistant/page.js           # 🤖 Assistant IA (UI seulement)
│   └── support/page.js             # 🎫 Support
├── lib/                            # Logique métier / accès API (séparée de l'UI)
│   ├── missionService.js           # Mission.API (:5003) + IA prix (:8000)  [existant]
│   ├── financeService.js           # Finance.API (:5005) — factures client  [nouveau]
│   ├── supportService.js           # Mission.API /api/support — tickets     [nouveau]
│   ├── assistantEngine.js          # Cerveau de l'assistant IA              [nouveau]
│   └── documentTemplates.js        # Templates HTML imprimables (PDF)       [nouveau]
└── components/portal/
    ├── ClientPortalLayout.js       # Shell du portail (sidebar mise à jour)
    ├── ui.js                       # Briques UI partagées (StatCard, Badge…) [nouveau]
    ├── charts.js                   # Graphiques SVG sans dépendance          [nouveau]
    └── Feedback.js                 # Dialogues + toasts (fini window.alert)  [nouveau]
```

### Backend modifié

| Service | Changement | Fichier |
|---|---|---|
| Mission.API | Table `SupportTickets` (SQL idempotent au démarrage) | `microservices/Mission.API/Program.cs` |
| Mission.API | Entité + DbSet SupportTicket | `Entities/SupportTicket.cs`, `Data/MissionDbContext.cs` |
| Mission.API | Contrôleur `/api/support` (client + staff) | `Controllers/SupportController.cs` |
| Finance.API | `GET /api/factures/my` (client via JWT) + rôle staff exigé sur `/client/{id}` | `Controllers/FacturesController.cs` |

## Principes appliqués

- **Sécurité** : les endpoints client (`/my`) résolvent l'identité depuis le claim
  `userId` du JWT — un client ne voit jamais les données d'un autre.
- **Organisation** : logique métier dans `lib/`, UI dans `app/` et `components/` —
  jamais mélangées dans le même fichier.
- **Zéro dépendance ajoutée** : graphiques en SVG maison, documents en HTML
  imprimable, chat en React pur.
- **Charte graphique** : variables du portail (`--pcard`, `--pborder`, `--pmuted`),
  rouge onpoint `#C11425`, sombre `#0F1B24` — dark mode automatiquement supporté.

## Test rapide

```bash
docker compose build mission-api finance-api frontoffice
docker compose up -d mission-api finance-api frontoffice
# → http://localhost:3001/auth/login puis chaque page /account/*
```
