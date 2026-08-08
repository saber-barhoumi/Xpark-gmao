# Pré-requis avant génération LaTeX — XPARK GMAO

Trois listes à traiter avant la Phase 2.

**URL de référence** (relevées dans `docker-compose.yml`) :

| Application | URL |
|---|---|
| Back-office | `http://localhost:3000` |
| Portail client | `http://localhost:3001` |
| Passerelle API | `http://localhost:8080` |
| Application chauffeur | Expo Go / émulateur Android |

---

## 1. Les 28 captures d'écran

Destination : `rapport pfe/latex/figures/captures/`
Format : PNG, largeur ≥ 1400 px, navigateur en 1440×900, **thème clair**,
fenêtre maximisée, données réalistes (pas de « test test »), aucune donnée
personnelle réelle visible.

### Sprint 1 — Identités, accès et sécurité (5)

| # | Fichier | Écran | Route |
|---|---|---|---|
| 1 | `s1-connexion.png` | Formulaire de connexion, champs remplis | `/auth/login` |
| 2 | `s1-double-facteur.png` | Saisie du code à second facteur | `/auth/login` (après soumission d'un compte MFA activé) |
| 3 | `s1-connexion-pin.png` | Connexion chauffeur par code PIN | `/auth/login-pin` |
| 4 | `s1-comptes-attente.png` | Liste des comptes en attente d'approbation | `/users/pending` |
| 5 | `s1-comptes-archives.png` | Comptes archivés + action de restauration | `/users/archives` |

### Sprint 2 — Référentiel de flotte et d'équipements (5)

| # | Fichier | Écran | Route |
|---|---|---|---|
| 6 | `s2-liste-vehicules.png` | Tableau des véhicules avec filtres | `/gestion/vehicules` |
| 7 | `s2-fiche-vehicule.png` | Formulaire d'immatriculation / modification | `/gestion/vehicules` (ouvrir la fiche) |
| 8 | `s2-liste-equipements.png` | Inventaire des équipements | `/gestion/equipements` |
| 9 | `s2-detail-equipement.png` | Détail d'un équipement, affectation, garantie | `/gestion/equipements/:id` |
| 10 | `s2-carburant.png` | Suivi des pleins et statistiques de consommation | `/operations/carburant` |

### Sprint 3 — Chaîne commerciale (6)

| # | Fichier | Écran | Route |
|---|---|---|---|
| 11 | `s3-portail-reservation.png` | Formulaire de réservation côté client | `http://localhost:3001/account/reserver` |
| 12 | `s3-estimation-tarifaire.png` | Fourchette de prix rendue par l'IA | idem, après estimation |
| 13 | `s3-demandes-transport.png` | Demandes en attente de devis (back-office) | `/gestion/demandes-transport` |
| 14 | `s3-suivi-devis-client.png` | Devis reçu et accepté côté client | `http://localhost:3001/account/demandes` |
| 15 | `s3-carte-suivi.png` | Carte de suivi GPS d'une mission en cours | `/gestion/suivi` |
| 16 | `s3-app-chauffeur.png` | Écran mission de l'application chauffeur | app Expo, onglet *missions* |

### Sprint 4 — Maintenance curative et prédictive (4)

| # | Fichier | Écran | Route |
|---|---|---|---|
| 17 | `s4-ordres-travail.png` | Tableau kanban des ordres de travail | `/maintenance/ordres-travail` |
| 18 | `s4-interventions.png` | Liste des interventions + changement de statut | `/maintenance/interventions` |
| 19 | `s4-pieces-rechange.png` | Stock de pièces, alerte de stock faible | `/maintenance/pieces-rechange` |
| 20 | `s4-prediction-pannes.png` | Tableau de bord des risques de panne | `/maintenance/prediction-pannes` |

### Sprint 5 — Facturation, alertes et journal métier (4)

| # | Fichier | Écran | Route |
|---|---|---|---|
| 21 | `s5-liste-factures.png` | Liste des factures avec statuts | `/invoices` |
| 22 | `s5-creation-facture.png` | Création d'une facture à partir de missions | `/invoices/create-invoice` |
| 23 | `s5-centre-alertes.png` | Centre d'alertes métier | `/alertes` |
| 24 | `s5-journal-iboa.png` | Journal des événements et alertes IBOA | `/monitoring/iboa` |

### Sprint 6 — Collaboration et aide à la décision (4)

| # | Fichier | Écran | Route |
|---|---|---|---|
| 25 | `s6-messagerie.png` | Conversation temps réel avec pièce jointe | `/apps/chat` |
| 26 | `s6-assistant-ayshaa.png` | Question posée à l'assistant et réponse sourcée | `http://localhost:3001/account/assistant` |
| 27 | `s6-optimisateur.png` | Plan d'affectation proposé par le moteur | `/gestion/optimisateur` |
| 28 | `s6-tableau-bord.png` | Tableau de bord analytique consolidé | `/analytics` |

### Captures optionnelles (si le volume le permet)

`opt-dashboard-accueil.png` → `/dashboard` · `opt-profil.png` → `/users/profile`
· `opt-securite.png` → `/security` · `opt-portail-accueil.png` → `http://localhost:3001`

---

## 2. Diagrammes à réexporter

### 2.1 Les 3 fichiers corrompus

| PNG à remplacer | Contenu erroné actuel | Source `.puml` |
|---|---|---|
| `Mission-communication.png` | copie du use case Mission | `docs/diagrams/microservices/Mission/Mission-communication.puml` |
| `Maintenance-entities.png` | copie du use case Maintenance | `docs/diagrams/microservices/Maintenance/Maintenance-entities.puml` |
| `Maintenance-seq-intervention.png` | copie de la séquence ordre-travail | `docs/diagrams/microservices/Maintenance/sequence/Maintenance-seq-intervention.puml` |

### 2.2 Les 4 diagrammes d'entités manquants (services Python)

| PNG attendu | Source `.puml` |
|---|---|
| `AI-Optimizer-entities.png` | `microservices/AI-Optimizer/AI-Optimizer-entities.puml` |
| `AI-Predictor-entities.png` | `microservices/AI-Predictor/AI-Predictor-entities.puml` |
| `Ayshaa-RAG-entities.png` | `microservices/Ayshaa-RAG/Ayshaa-RAG-entities.puml` |
| `IBOA-entities.png` | `microservices/IBOA/IBOA-entities.puml` |

### 2.3 Les 12 diagrammes de classes du domaine (corps du rapport)

`<Service>-class-domain.png` pour : AI-Optimizer, AI-Predictor, Alerts,
Ayshaa-RAG, Chat, Finance, Fleet, IAM, IBOA, Maintenance, Mission,
PredictionPanne.

### 2.4 Les 12 diagrammes de classes d'architecture (annexe D)

`<Service>-class-architecture.png`, mêmes services.

### 2.5 Deux diagrammes complémentaires

| PNG attendu | Source `.puml` |
|---|---|
| `IBOA-classifier-ia-pipeline.png` | `microservices/IBOA/IBOA-classifier-ia-pipeline.puml` |
| `PredictionPanne-classifier-ia-pipeline.png` | `microservices/PredictionPanne/PredictionPanne-classifier-ia-pipeline.puml` |

### 2.6 Commande unique

Depuis la racine du dépôt, `plantuml.jar` à côté :

```
java -DPLANTUML_LIMIT_SIZE=16384 -jar plantuml.jar -tpng ^
  -o "..\rapport pfe\ressource rapport pfe\Conception_et_Diagrammes" ^
  "docs\diagrams\microservices\*\*.puml" ^
  "docs\diagrams\microservices\*\sequence\*.puml"
```

Réexporte tout, écrase les 3 corrompus et produit les 30 manquants.
**À refaire aussi : `physical-architecture.png`** — le port publié du
back-office vient d'être corrigé (3000 et non 8080).

### 2.7 Diagrammes à produire (n'existent pas en source)

| Figure | Chapitre | Remarque |
|---|---|---|
| Cas d'utilisation **global** | 2.4 | Je peux l'écrire en PlantUML si vous le souhaitez |
| Planning des sprints (Gantt) | 2.5.3 | Dépend de vos dates réelles de sprint |
| Logo de l'entreprise d'accueil | page de garde | à fournir en PNG fond transparent |

---

## 3. Champs de la page de garde

Relevés dans `Page Garde Rapport Stage(Fr).docx`.

### 3.1 Page de garde

| # | Champ | Exemple attendu |
|---|---|---|
| 1 | Année universitaire | `2025 - 2026` |
| 2 | Filière / département | `INFORMATIQUE` |
| 3 | Intitulé exact du sujet | ex. « Conception et développement d'une plateforme de gestion de flotte et de transport de marchandises » |
| 4 | Réalisé par — prénom et nom | |
| 5 | Encadrant académique (ESPRIT) — civilité + prénom + nom | |
| 6 | Encadrant entreprise — civilité + prénom + nom | |
| 7 | Nom de l'entreprise d'accueil | |
| 8 | Logo de l'entreprise | fichier PNG |
| 9 | Logo de l'établissement | à confirmer : le gabarit en contient un |

### 3.2 Formulaire de validation de dépôt (page suivante)

| # | Champ |
|---|---|
| 10 | Nom et prénom de l'étudiant (répété) |
| 11 | Nom et prénom de l'encadrant entreprise + emplacement cachet et signature |
| 12 | Nom et prénom de l'encadrant académique + emplacement signature |

### 3.3 Éléments complémentaires à rédiger

| # | Élément | Attendu |
|---|---|---|
| 13 | Dédicaces | 5 à 10 lignes, à qui vous dédiez le travail |
| 14 | Remerciements | encadrants, entreprise, jury, famille — noms exacts |
| 15 | Résumé français | 8 à 10 lignes + 5 mots-clés |
| 16 | Abstract anglais | même longueur + 5 keywords |
| 17 | Période de stage | dates de début et de fin |
| 18 | Composition de l'équipe | pour le tableau « Équipe et rôles » du §2.5.1 |
| 19 | Dates des 6 sprints | pour le Gantt du §2.5.3 |

### 3.4 Points ouverts du plan

| # | Question |
|---|---|
| 20 | Trello, WhatsApp, Jitsi Meet, LinkedIn : réellement utilisés pendant le stage ? |
| 21 | Découpage en 6 sprints validé, ou votre backlog réel en prévoyait un autre ? |
| 22 | Nom de l'entreprise à faire figurer dans le §1.1 « Présentation de l'organisme d'accueil » |
