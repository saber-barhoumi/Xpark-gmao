# IntelligentBusinessOwnerAssistant (IBOA)

> Service de monitoring temps réel & alertes intelligentes — port **5008**.
> Documentation complète : [`../INTELLIGENT_BUSINESS_OWNER_ASSISTANT.md`](../INTELLIGENT_BUSINESS_OWNER_ASSISTANT.md)

## Démarrage rapide

```bash
docker compose up -d iboa      # depuis la racine du projet
# Swagger : http://localhost:5008/docs
# Dashboard : http://localhost:3000/monitoring/iboa
```

## Pipeline

RabbitMQ (`xpark.#` sur exchange `xpark.ai`) → normalisation → enrichissement
(historique 7 jours) → **scoring 1-100** → **agrégation anti-spam** (dédup 15 min,
regroupement, fatigue) → formatage par canal → **livraison** (WhatsApp Twilio /
Email SMTP, simulés sans identifiants) → audit PostgreSQL.

## API

| Endpoint | Description |
|---|---|
| `GET /health` | État service + RabbitMQ + mode WhatsApp/Email |
| `GET /events?limit=50` | Événements scorés récents |
| `GET /alerts?limit=50` | Alertes émises (canal, statut, contenu) |
| `GET /stats` | Compteurs du jour |
| `GET/PUT /preferences` | Préférences propriétaire (numéro, seuils, heures calmes) |
| `GET /reports/daily.pdf` | Rapport quotidien PDF |
| `GET /reports/daily.xlsx` | Export Excel du jour |
| `POST /test-event` | Injecte un événement de test dans le bus réel |
| `POST /batch/flush` | Force l'envoi du résumé groupé horaire |

## Tests

```bash
python test_iboa.py       # unitaires (scoring §5.1, anti-spam §5.2, formatters §4)
python test_e2e_iboa.py   # bout-en-bout contre la stack Docker
```

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `RABBITMQ_HOST/USER/PASS` | rabbitmq / xpark / xpark_secret | Bus d'événements |
| `DATABASE_URL` | postgres partagé xpark_gmao | Persistence |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM` | *(vide → simulation)* | WhatsApp réel |
| `SMTP_HOST/PORT/USER/PASS/FROM` | *(vide → simulation)* | Email réel |
| `IBOA_BATCH_INTERVAL_MIN` | 60 | Fréquence du batch groupé |
