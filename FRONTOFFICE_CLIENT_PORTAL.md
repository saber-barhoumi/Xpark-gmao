# Portail Client Frontoffice XPARK — Documentation

> Implémente le cœur de la `FICHE_TECHNIQUE_FRONTOFFICE_XPARK` (§4) sur le site
> client existant (Next.js 14, thème onpoint, port **3001**) : transformer les
> clients « passifs » en clients « actifs » qui réservent et suivent eux-mêmes.

---

## 1. Ce qui est en place

| Fiche §4 | Page | État |
|---|---|---|
| §4.2 Login/Signup + MFA | `/auth/*` (6 pages plein écran) | ✅ (fiche Authentication & Security) |
| §4.3 **Dashboard client** | `/account` | ✅ stats, actions rapides, dernières missions, alerte MFA |
| §4.4 **Réserver véhicule (wizard 3 étapes)** | `/account/reserver` | ✅ avec **estimation prix IA** |
| §4.5 **Mes Missions (suivi)** | `/account/missions` | ✅ filtres par statut, rafraîchi toutes les 20 s |
| Sécurité MFA | `/account/security` | ✅ |
| §4.6 Factures + paiement Stripe | — | ⏭️ phase 2 |
| §11 AI Assistant (agent) · §12 GPS temps réel | — | ⏭️ phase 2 (fiche CONTINUATION) |

## 2. Le flux de bout en bout (la vraie valeur)

```
CLIENT (frontoffice :3001)                    BACKOFFICE (:3000)
──────────────────────────                    ──────────────────
Réserver un véhicule (wizard 3 étapes)
 1. Trajet & date  → villes + distance (CalculateurPrixTrajetIA :8000)
 2. Véhicule & paramètres (type, passagers, fret, autoroute)
 3. Estimation IA (XGBoost) → Confirmer
        │
        ▼
POST /api/missions/client-request  → mission EN_ATTENTE
   (ClientIdUtilisateur = client, sans véhicule/chauffeur)
        │                                     La mission apparaît dans
        │                                     « Optimiser le planning » →
        │                                     OptimisateurFlotteIA l'affecte
        │                                     (ou affectation manuelle)
        ▼
« Mes missions » : ⏳ En attente → 🚚 En cours (véhicule + chauffeur visibles)
                   → ✅ Terminée (coût réel)
        + IBOA reçoit l'événement xpark.mission.client-request (monitoring)
```

**Trois systèmes IA du projet participent** : le prédicteur de prix estime le
tarif au moment de la réservation, l'optimiseur affecte véhicule+chauffeur,
et IBOA notifie le propriétaire de la nouvelle demande.

## 3. Backend — Mission.API (ajouts)

| Endpoint | Accès | Rôle |
|---|---|---|
| `POST /api/missions/client-request` | tout utilisateur connecté | Crée la mission EN_ATTENTE (ClientIdUtilisateur = jeton JWT) |
| `GET /api/missions/my` | tout utilisateur connecté | Missions du client uniquement |
| `GET /api/missions` · `GET /missions/{id}` | **staff seulement** (403 pour CLIENT) | Durcissement sécurité : les clients ne voient plus la liste globale |

- Colonne `ClientIdUtilisateur` (existante en base) désormais mappée dans l'entité
- Événement IBOA `xpark.mission.client-request` publié à chaque réservation

## 4. Fichiers frontoffice

| Fichier | Rôle |
|---|---|
| `lib/missionService.js` | `/missions/my`, `/missions/client-request` + IA prix (villes/distance/predict) |
| `lib/authService.js` | + export `apiFetch` (fetch authentifié réutilisable, refresh silencieux) |
| `app/account/page.js` | **Dashboard** : 4 stats, prochaine mission, actions rapides, 5 dernières missions |
| `app/account/reserver/page.js` | **Wizard 3 étapes** avec barre de progression et estimation IA |
| `app/account/missions/page.js` | **Mes missions** : cartes par statut, polling 20 s, filtres |
| `components/layout/Menu.js` | Menu « Espace Client » : + Réserver / Mes Missions |
| `Dockerfile` / `docker-compose.yml` | `NEXT_PUBLIC_AI_API_URL` (:8000) |

## 5. Testé de bout en bout (stack Docker réelle)

1. Client jetable créé + confirmé + connecté ✔
2. `GET /missions` → **403 pour un CLIENT** (sécurité) ✔
3. Réservation → mission #22 **EN_ATTENTE**, rattachée au client, 95.5 TND estimé ✔
4. `GET /missions/my` → le client voit sa mission ✔
5. Côté admin : la mission est dans le **pool de l'OptimisateurFlotteIA** ✔
6. Affectation (115TUN114 + kamel bouaziz) → le client voit **EN_COURS + véhicule + chauffeur** ✔
7. Nettoyage ✔

## 6. Démo (http://localhost:3001)

1. Menu « Espace Client » → Connexion (ou Inscription)
2. **Réserver un véhicule** → Tunis → Sousse → date demain → type véhicule → l'IA affiche le prix → Confirmer
3. **Mes missions** : la réservation est ⏳ En attente
4. Backoffice (:3000) → Optimisateur IA → « Optimiser le planning » → Appliquer
5. Retour frontoffice : la mission passe 🚚 En cours avec l'immatriculation et le chauffeur

## 7. Phase 2 (fiches DÉBUTANT §4.6 + CONTINUATION)

- Factures client + paiement Stripe (nécessite Finance.API côté client)
- Suivi GPS temps réel sur carte (SignalR + positions véhicules)
- AI Assistant conversationnel (service :5009, intents + actions)
- Notifications multi-canal client (réutiliser le moteur IBOA)
- Multi-tenant entreprises (équipes avec rôles OWNER/MANAGER/FINANCE/VIEWER)
