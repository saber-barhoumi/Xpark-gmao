# IntelligentBusinessOwnerAssistant (IBOA) — Documentation Complète

> Troisième système IA de XPARK GMAO (après `CalculateurPrixTrajetIA` et `OptimisateurFlotteIA`).
> Implémente la `FICHE_TECHNIQUE_IntelligentBusinessOwnerAssistant` : **monitoring temps réel
> de l'entreprise** avec alertes intelligentes multi-canal (WhatsApp, Email, PDF, Excel).

**Port : 5008 · Conteneur : `xpark-iboa` · Stack : Python 3.11 + FastAPI + RabbitMQ + PostgreSQL**

---

## 1. Vision (FICHE §1)

Transformer le propriétaire d'entreprise de **« gestionnaire actif »** (qui consulte
l'application en permanence) en **« décideur informé »** (qui reçoit proactivement
les informations pertinentes, au bon moment, sur le bon canal) :

| Canal | Usage |
|---|---|
| **WhatsApp** (Twilio) | Alertes CRITIQUES, concises, temps réel (< 1 min) |
| **Email** (SMTP) | Alertes IMPORTANTES avec détails HTML + calcul de criticité |
| **PDF** | Rapport quotidien structuré (résumé exécutif, événements, alertes) |
| **Excel** | Export complet du jour (SUMMARY, EVENTS, ALERTS, TOP_TYPES) |

## 2. Le pipeline intelligent (FICHE §2.1 / §7.2)

```
Microservices XPARK (Fleet, Mission, Optimiseur…)
        │  PUBLISH xpark.fleet.* / xpark.mission.* / xpark.finance.* …
        ▼
RabbitMQ — exchange topic « xpark.ai » (queue durable iboa.events, binding xpark.#)
        ▼
┌──────────────────── IBOA (port 5008) ────────────────────┐
│ 1. EVENT RECEIVER    parse + validation (malformé → skip) │
│ 2. CONTEXT ENRICHER  fréquence du même problème (7 jours) │
│ 3. ANALYZER/SCORER   criticité 1-100 explicable (§5.1)    │
│ 4. AGGREGATOR        dédup 15min · regroupement · fatigue │
│ 5. FORMATTER         WhatsApp concis · Email HTML · PDF   │
│ 6. DELIVERY ENGINE   Twilio / SMTP · retry ×3 · simulation│
│ 7. AUDIT LOGGER      chaque décision + envoi tracés en DB │
└────────────────────────────────────────────────────────────┘
        ▼                    ▼                     ▼
   WhatsApp             Email/PDF             Dashboard React
   propriétaire         manager               /monitoring/iboa
```

## 3. Scoring de criticité (FICHE §5.1)

`Criticité = Base(type d'événement) + Modificateurs` — chaque score est **explicable**
(le détail du calcul est stocké et affiché dans le dashboard) :

| Modificateur | Points |
|---|---|
| Base par type (ex: panne 70, cash-flow critique 90, mission terminée 15) | 5–90 |
| Sévérité déclarée HIGH / CRITICAL | +10 / +20 |
| Mission active impactée | +20 |
| Client PREMIUM / VIP | +15 |
| Impact financier > 500 TND | +10 |
| Récurrence (3+ événements similaires en 7 jours) | +5 |
| Cas spéciaux (profit −20%, cash < 5000 TND, client stratégique…) | +15–20 |

**Classification** : ≥85 **CRITIQUE** → WhatsApp + Email immédiat · 60-84 **IMPORTANT**
→ Email · 30-59 **NORMAL** → batch horaire groupé · <30 **INFO** → rapport quotidien seulement.

Exemple validé (§3.1 de la fiche) : panne moteur + mission active + client PREMIUM
+ coût 450 TND = **100/100 CRITIQUE**.

## 4. Anti-spam (FICHE §5.2) — testé unitairement

- **R1 Déduplication** : même type + même objet (véhicule/mission/client) en < 15 min → supprimé
- **R2 Regroupement** : 3+ événements du même type en 30 min → 1 méta-alerte groupée
- **R3 Timing smart** : CRITIQUE immédiat · NORMAL en batch horaire · INFO en rapport
- **R4 Fatigue** : > 20 alertes/jour (configurable) → tout passe en batch sauf CRITIQUE
- **Heures calmes** (22h→7h par défaut) : seul le CRITIQUE passe en WhatsApp

## 5. Événements réellement émis aujourd'hui

| Événement | Source | Déclencheur |
|---|---|---|
| `xpark.mission.task-completed` | Mission.API | Clôture d'une mission |
| `xpark.mission.task-cancelled` | Mission.API | Annulation d'une mission |
| `xpark.fleet.vehicle-breakdown` | Fleet.API | Statut véhicule → HORS_SERVICE / BESOIN_MAINTENANCE |
| `xpark.fleet.maintenance-due` | Fleet.API | Statut véhicule → EN_MAINTENANCE |
| `xpark.fleet.vehicle-added` | Fleet.API | Création d'un véhicule |
| `xpark.optimization.plan-generated` | OptimisateurFlotteIA | Plan d'optimisation généré |
| *40+ autres types* (§2.2) | — | Scoring déjà implémenté ; il suffit que le service source publie sur `xpark.ai` |

Un événement de test complet (panne critique client PREMIUM) peut être injecté depuis
le dashboard (« Simuler une panne critique ») ou `POST /test-event`.

## 6. Mode SIMULATION vs envoi réel

Sans identifiants configurés, les envois sont **simulés** : le message complet
(exactement celui qui partirait) est journalisé et visible dans l'onglet Alertes
avec le statut `SENT_SIMULATED`. Pour activer l'envoi réel, décommenter dans
`docker-compose.yml` :

```yaml
- TWILIO_ACCOUNT_SID=ACxxxx          # WhatsApp réel
- TWILIO_AUTH_TOKEN=xxxx
- TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
- SMTP_HOST=smtp.gmail.com           # Email réel
- SMTP_USER=xxxx@gmail.com
- SMTP_PASS=app-password
```
Aucun changement de code — le retry ×3 avec backoff (§5.3) s'applique aux deux modes.

## 7. Où le voir dans l'application ?

**Menu latéral → « Assistant IBOA »** (badge rouge IA) → page `/monitoring/iboa` :
- Badges d'état : RabbitMQ connecté, mode WhatsApp/Email
- 4 compteurs du jour (CRITIQUE / IMPORTANT / NORMAL / INFO)
- Onglet **Événements** : flux temps réel (rafraîchi 15 s), clic = calcul de criticité détaillé
- Onglet **Alertes** : canal, destinataire, statut (SENT/SIMULATED/SUPPRESSED/BATCHED)
- Onglet **Préférences** : numéro WhatsApp, email, seuils, heures calmes, anti-fatigue
- Boutons : rapport PDF, export Excel, simulation de panne critique

## 8. Tous les fichiers

### `IntelligentBusinessOwnerAssistant/` (service Python — port 5008)
| Fichier | Module fiche §7.2 |
|---|---|
| `main.py` | API FastAPI (health, events, alerts, stats, preferences, reports, test-event) |
| `rabbitmq_consumer.py` | 1. EVENT_RECEIVER — queue `iboa.events`, binding `xpark.#` |
| `pipeline.py` | Orchestration 2→7 + batch horaire + heures calmes |
| `scorer.py` | 3. EVENT_ANALYZER — 45+ types, score 1-100 explicable |
| `aggregator.py` | 4. ALERT_AGGREGATOR — R1/R2/R3/R4 anti-spam |
| `formatters.py` | 5. MESSAGE_FORMATTER — WhatsApp/Email/batch/PDF/Excel |
| `delivery.py` | 6. DELIVERY_ENGINE — Twilio + SMTP + simulation + retry ×3 |
| `storage.py` | 7. AUDIT_LOGGER + schéma §7.3 (IboaEvents/IboaAlerts/IboaPreferences/IboaAuditLog) |
| `models.py` | Contrats Pydantic (§3.1 événement standard) |
| `test_iboa.py` | Tests unitaires scoring + agrégation + formatters |
| `test_e2e_iboa.py` | Test E2E complet contre la stack Docker |

### Émetteurs .NET
| Fichier | Rôle |
|---|---|
| `microservices/Fleet.API/Messaging/XparkEventBus.cs` | Publisher RabbitMQ (nouveau) |
| `microservices/Fleet.API/Services/VehiculeService.cs` | Événements breakdown / maintenance-due / vehicle-added |
| `microservices/Mission.API/Messaging/OptimizerEventBus.cs` | `PublishAsync` générique ajouté |
| `microservices/Mission.API/Services/MissionService.cs` | Événements task-completed / task-cancelled |

### Frontend (thème Reback)
| Fichier | Rôle |
|---|---|
| `app/(admin)/monitoring/iboa/page.tsx` | Dashboard IBOA (3 onglets) |
| `services/iboaService.ts` | Client API (health/events/alerts/stats/prefs/reports) |
| `routes/index.ts` + `assets/data/menu-items.ts` | Route + menu « Assistant IBOA » |

### Base de données (schéma §7.3, créé automatiquement au démarrage)
`IboaEvents` (événements scorés) · `IboaAlerts` (envois + statuts) ·
`IboaPreferences` (propriétaire) · `IboaAuditLog` (traçabilité complète)

## 9. Lancer & tester

```bash
docker compose up -d iboa                 # http://localhost:5008/docs (Swagger)

# Tests unitaires (sans infra)
cd IntelligentBusinessOwnerAssistant && python test_iboa.py

# Test E2E complet (stack Docker démarrée)
python test_e2e_iboa.py

# Suivre le pipeline en direct
docker logs -f xpark-iboa
```

**Parcours de démo** (http://localhost:3000) :
1. Menu → **Assistant IBOA** → « Simuler une panne critique » → l'événement traverse
   RabbitMQ, est scoré 100/100 CRITIQUE, une alerte WhatsApp + Email (simulée) apparaît
2. Missions → terminer une mission → événement `task-completed` (INFO) dans le flux
3. Véhicules → passer un véhicule en HORS_SERVICE → alerte panne réelle
4. Télécharger le rapport PDF / l'export Excel du jour
5. Onglet Préférences → configurer numéro WhatsApp + seuils
