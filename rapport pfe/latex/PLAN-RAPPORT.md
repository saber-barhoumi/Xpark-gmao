# Plan du rapport PFE — XPARK GMAO

> Document de cadrage **Phase 1**. Aucun fichier LaTeX n'est produit tant que ce
> plan n'est pas validé.

---

## 0. Ce qui a été lu pour établir ce plan

| Source | Ce qui en a été retenu |
|---|---|
| `Rapport Stage Pédagogique.pdf` | Règles de forme impératives (voir §1) |
| `Guide Rédaction Journal Bord.pdf` | Trame du journal de bord → annexe B |
| `dernier-version-rapport1111.pdf` (100 p.) | Structure de référence : 3 chapitres de cadrage + 6 chapitres de sprint |
| `Copy of Presentation - SmartIntern...pdf` | Confirme l'ordre attendu : organisme → problématique → existant → solution → besoins → classes → architecture → technologies |
| `Page Garde Rapport Stage(Fr).docx` | Gabarit page de garde + formulaire de validation de dépôt |
| `Conception_et_Diagrammes/` | 52 fichiers, dont **49 uniques** (3 doublons, §5) |
| `Logos_et_Technologies/` | 24 fichiers, dont **7 sans contrepartie** dans le projet (§5) |
| Dépôt `Xpark gmao` | 12 microservices, 3 frontaux, 54 routes back-office, 20 services docker-compose |

## 1. Règles de forme extraites du guide (à appliquer sans exception)

| Règle | Valeur |
|---|---|
| Volume | **≈ 40 pages hors annexes** |
| Police corps | Times New Roman **12 pt** |
| Marges | **2,5 cm** partout |
| Interligne | **1,15** |
| Justification | Gauche + droite |
| Alinéa 1re ligne | **0,50 cm** |
| Pagination | **bas à droite**, forme `n/N` |
| Impression | recto-verso |
| Titre du document | 24 pt centré |
| Titres | gras, taille décroissante, numérotés `1`, `1.1`, `1.1.1` |
| Figures | légende **+ référence obligatoire dans le texte**, numérotées par type (`Fig. 1`, `Tab. 1`) |
| Citations | guillemets français « » |
| Code source | **proscrit du corps** → annexes |
| Chaque chapitre | introduction → développement → conclusion enchaînant sur le suivant |
| Planning | sur **une page complète**, en fin de description du travail |
| Fin de document | Bibliographie / Netographie |

---

## 2. Table des matières proposée

### Pages liminaires (numérotation romaine)

| # | Pièce | Source |
|---|---|---|
| i | Page de garde | gabarit `.docx` reproduit en LaTeX |
| ii | Formulaire de validation de dépôt | idem |
| iii | Dédicaces | à rédiger |
| iv | Remerciements | à rédiger |
| v | Table des matières | auto |
| vi | Table des figures | auto |
| vii | Liste des tableaux | auto |
| viii | Liste des acronymes | auto (glossaries) |

### Corps (numérotation arabe, ≈ 42 p.)

| Ch. | Titre | Pages |
|---|---|---|
| — | **Introduction générale** | 2 |
| 1 | **Étude préalable** | 6 |
| 2 | **Étude et analyse globale du projet** | 7 |
| 3 | **Environnement de travail et architecture** | 6 |
| 4 | **Sprint 1 — Socle d'identités, d'accès et de sécurité** | 4 |
| 5 | **Sprint 2 — Référentiel de flotte et d'équipements** | 4 |
| 6 | **Sprint 3 — Chaîne commerciale : demande, devis, mission, suivi** | 5 |
| 7 | **Sprint 4 — Maintenance curative et prédictive** | 4 |
| 8 | **Sprint 5 — Facturation, alertes et journal métier** | 4 |
| 9 | **Sprint 6 — Collaboration et services d'aide à la décision** | 4 |
| — | **Conclusion générale et perspectives** | 2 |
| — | Références / Netographie | 1 |
| — | Annexes A à D | hors quota |

### Détail des chapitres de cadrage

**Chapitre 1 — Étude préalable**
1.1 Présentation de l'organisme d'accueil
1.2 Problématique du transport de marchandises
1.3 Étude de l'existant · 1.3.1 Solutions du marché · 1.3.2 Critique de l'existant
1.4 Solution proposée : la plateforme XPARK GMAO
1.5 Méthodologie de travail · 1.5.1 Cycle en cascade · 1.5.2 Approche agile · 1.5.3 Scrum · 1.5.4 Choix retenu et justification

**Chapitre 2 — Étude et analyse globale**
2.1 Identification des acteurs (Client, Chauffeur, Technicien, Gestionnaire, Administrateur + acteurs secondaires)
2.2 Besoins fonctionnels par domaine
2.3 Besoins non fonctionnels (sécurité, performance, disponibilité, maintenabilité, portabilité)
2.4 Diagramme de cas d'utilisation global
2.5 Pilotage du projet avec Scrum · 2.5.1 Équipe et rôles · 2.5.2 Product backlog · 2.5.3 Découpage en 6 sprints

**Chapitre 3 — Environnement de travail et architecture**
3.1 Environnement matériel
3.2 Environnement logiciel · 3.2.1 Outils · 3.2.2 Langages et frameworks
3.3 Architecture logique en 4 niveaux
3.4 Architecture physique et déploiement conteneurisé
3.5 Choix structurants : Clean Architecture, base partagée, double bus de messages

### Trame commune aux 6 chapitres de sprint

```
n.0  Introduction
n.1  Planification du sprint
     n.1.1 Objectifs
     n.1.2 Backlog du sprint            (tableau)
n.2  Élaboration technique
     n.2.1 Modélisation fonctionnelle   (cas d'utilisation + description textuelle)
     n.2.2 Conception statique          (entités / classes)
     n.2.3 Conception dynamique         (séquence)
     n.2.4 Intégration                  (communication)
n.3  Réalisation et tests de validation (captures + tableau de tests)
n.4  Conclusion
```

---

## 3. Affectation sprint → modules → diagrammes

### Sprint 1 — Socle d'identités, d'accès et de sécurité → **IAM**

| Rôle | Fichier |
|---|---|
| Cas d'utilisation | `IAM-usecase.png` |
| Entités | `IAM-entities.png` |
| Classes | `IAM-class-architecture.png` **à exporter** |
| Séquence 1 | `IAM-seq-inscription.png` |
| Séquence 2 | `IAM-seq-approbation-compte.png` |
| Communication | `IAM-communication.png` |
| Captures | connexion, MFA, comptes en attente, archives |

### Sprint 2 — Référentiel de flotte et d'équipements → **Fleet**

| Rôle | Fichier |
|---|---|
| Cas d'utilisation | `Fleet-usecase.png` |
| Entités | `Fleet-entities.png` |
| Classes | `Fleet-class-domain.png` **à exporter** |
| Séquence 1 | `Fleet-seq-immatriculation.png` |
| Séquence 2 | `Fleet-seq-changement-etat.png` |
| Séquence 3 | `Fleet-seq-suivi-echeances.png` |
| Communication | `Fleet-communication.png` |
| Captures | liste véhicules, fiche véhicule, équipements, carburant |

### Sprint 3 — Chaîne commerciale → **Mission + AI-Predictor**

| Rôle | Fichier |
|---|---|
| Cas d'utilisation | `Mission-usecase.png` |
| Entités | `Mission-entities.png` |
| Classes | `Mission-class-domain.png` **à exporter** |
| Séquence 1 | `Mission-seq-demande-transport.png` |
| Séquence 2 | `Mission-seq-devis.png` |
| Séquence 3 | `Mission-seq-suivi-direct.png` |
| Communication | `Mission-communication.png` **corrompu — à réexporter** |
| Estimation IA | `AI-Predictor-usecase.png`, `AI-Predictor-sequence.png`, `AI-Predictor-communication.png` |
| Captures | portail client, devis, carte de suivi, app chauffeur |

### Sprint 4 — Maintenance curative et prédictive → **Maintenance + PredictionPanne**

| Rôle | Fichier |
|---|---|
| Cas d'utilisation | `Maintenance-usecase.png` |
| Entités | `Maintenance-entities.png` **corrompu — à réexporter** |
| Séquence 1 | `Maintenance-seq-ordre-travail.png` |
| Séquence 2 | `Maintenance-seq-intervention.png` **corrompu — à réexporter** |
| Communication | `Maintenance-communication.png` |
| Prédiction | `PredictionPanne-usecase.png`, `-entities.png`, `-sequence.png`, `-communication.png` |
| Captures | kanban ordres de travail, interventions, stock, prédiction pannes |

### Sprint 5 — Facturation, alertes et journal métier → **Finance + Alerts + IBOA**

| Rôle | Fichier |
|---|---|
| Finance | `Finance-usecase.png`, `-entities.png`, `-sequence.png`, `-communication.png` |
| Alertes | `Alerts-usecase.png`, `-entities.png`, `-sequence.png`, `-communication.png` |
| Journal métier | `IBOA-usecase.png`, `IBOA-sequence.png`, `IBOA-communication.png` |
| Entités IBOA | `IBOA-entities.png` **à exporter** |
| Captures | factures, création facture, centre d'alertes, tableau IBOA |

### Sprint 6 — Collaboration et aide à la décision → **Chat + Ayshaa-RAG + AI-Optimizer**

| Rôle | Fichier |
|---|---|
| Messagerie | `Chat-usecase.png`, `-entities.png`, `-sequence.png`, `-communication.png` |
| Assistant RAG | `Ayshaa-RAG-usecase.png`, `-sequence.png`, `-communication.png` |
| Optimisation | `AI-Optimizer-usecase.png`, `-sequence.png`, `-communication.png` |
| Entités IA | `Ayshaa-RAG-entities.png`, `AI-Optimizer-entities.png` **à exporter** |
| Captures | messagerie temps réel, assistant, optimisateur de tournées |

---

## 4. Placement des logos

| Logo | Chapitre | Section |
|---|---|---|
| `problematique.webp` | 1 | 1.2 Problématique |
| `methodo-agile.webp` | 1 | 1.5.2 Approche agile |
| `methodo-scrum.jpg` | 1 | 1.5.3 Scrum |
| `trello logo.jpg` | 2 | 2.5 Pilotage (**si réellement utilisé**) |
| `logo react.png`, `logo typescript.png`, `logo javascript.png` | 3 | 3.2.2 Frontaux |
| `logo dotnet.png`, `logo Csharp.png` | 3 | 3.2.2 Services métier |
| `logo-python.jpg` | 3 | 3.2.2 Services d'aide à la décision |
| `logo postgres.png` | 3 | 3.2.2 Persistance |
| `logo rabbitmq.png` | 3 | 3.2.2 Messagerie |
| `logo docker.png` | 3 | 3.2.2 Conteneurisation + 3.4 |
| `logo git.png` | 3 | 3.2.1 Gestion de version |
| `logo postman.png` | 3 | 3.2.1 Tests d'API |
| `logo linux.png` / `logo ubuntu.jpg` | 3 | 3.1 Environnement matériel |
| `whatsapplogo.jpg`, `logo jitsi meet.png`, `linkedinlogo.png` | 3 | 3.2.1 Communication d'équipe (**si réellement utilisés**) |

### Logos à écarter

`logo aws.png`, `logo azure.jpg`, `logo sqlserver.jpg`, `logo jenkins.png` : **aucune trace dans le dépôt.** Pas de `Jenkinsfile`, pas de `.github/workflows`, pas de `.gitlab-ci.yml`, aucune chaîne de connexion SQL Server, aucun manifeste cloud. Les faire figurer en « technologies utilisées » serait une affirmation fausse dans un rapport soutenu.

### Logos manquants (placeholders prévus)

Next.js · Expo / React Native · Vite · nginx · Qdrant · Ollama · FastAPI · Entity Framework Core · SignalR · MassTransit · JWT · Visual Studio Code

---

## 5. Défauts relevés dans les ressources

### 5.1 Trois exports corrompus (vérifiés par empreinte MD5 puis à l'œil)

| Fichier | Contenu réel | Action |
|---|---|---|
| `Mission-communication.png` | copie de `Mission-usecase.png` | réexporter depuis `docs/diagrams/microservices/Mission/Mission-communication.puml` |
| `Maintenance-entities.png` | copie de `Maintenance-usecase.png` | réexporter depuis `Maintenance-entities.puml` |
| `Maintenance-seq-intervention.png` | copie de `Maintenance-seq-ordre-travail.png` | réexporter depuis `sequence/Maintenance-seq-intervention.puml` |

### 5.2 Diagrammes existants en source mais non exportés

- **24 diagrammes de classes** (`class-architecture` + `class-domain` × 12). Le rapport de référence place un diagramme de classes dans **chaque** sprint : ils sont nécessaires.
- **4 diagrammes d'entités** des services Python : AI-Optimizer, AI-Predictor, Ayshaa-RAG, IBOA.
- 2 `classifier-ia-pipeline` (IBOA, PredictionPanne) — utiles au sprint 4 et 5.

### 5.3 Diagrammes à produire

- **Cas d'utilisation global** (§2.4) : n'existe pas ; les 12 diagrammes sont par service.
- **Planning des sprints / Gantt** (§2.5.3) : à produire.
- **Product backlog** : tableau LaTeX, pas d'image nécessaire.

### 5.4 Captures d'écran

**Aucune capture n'est présente.** Le rapport de référence en compte une soixantaine. Environ **28 captures** sont nécessaires (4 à 5 par sprint). Elles seront toutes remplacées par des cadres placeholder nommés.

### 5.5 Logo de l'entreprise d'accueil

Requis par le gabarit de page de garde. Absent.

---

## 6. Règle de placeholder

Trois macros seront définies dans `preambule/macros.tex` :

```
\figAttendue{chemin/attendu.png}{Légende}{fig:label}
```
Cadre gris, pointillés, hauteur 6 cm, portant en clair le chemin attendu et la
mention « FIGURE À FOURNIR ». La légende et le label sont réels : la figure est
donc **déjà numérotée, déjà référencée dans le texte et déjà listée dans la table
des figures**. Le jour où l'image existe, une seule ligne change.

```
\captureAttendue{chemin/attendu.png}{Légende}{fig:label}{Écran concerné}
```
Variante pour les captures d'interface, avec en plus le nom de l'écran et la
route du back-office à photographier (ex. `/gestion/vehicules`).

```
\figReelle{chemin.png}{Légende}{fig:label}{largeur}
```
Figure normale. Toutes les figures passent par cette macro afin que la mise en
forme (centrage, largeur, légende, espacement) soit identique partout.

Un fichier `INVENTAIRE-FIGURES.md` listera en permanence : figure attendue,
chapitre, statut (fournie / manquante). Il sera régénéré à chaque compilation.

---

## 7. Arborescence LaTeX proposée

```
rapport pfe/latex/
├── main.tex                        point d'entrée, \include des chapitres
├── PLAN-RAPPORT.md                 ce document
├── INVENTAIRE-FIGURES.md           généré : état des figures
├── preambule/
│   ├── packages.tex                paquets et encodage
│   ├── style-esprit.tex            Times 12pt, marges 2,5, interligne 1,15,
│   │                               alinéa 0,5, pagination n/N en bas à droite
│   ├── macros.tex                  \figReelle, \figAttendue, \captureAttendue
│   └── acronymes.tex               glossaire
├── liminaires/
│   ├── page-garde.tex
│   ├── validation-depot.tex
│   ├── dedicaces.tex
│   └── remerciements.tex
├── chapitres/
│   ├── 00-introduction-generale.tex
│   ├── 01-etude-prealable.tex
│   ├── 02-analyse-globale.tex
│   ├── 03-environnement-architecture.tex
│   ├── 04-sprint1-iam.tex
│   ├── 05-sprint2-flotte.tex
│   ├── 06-sprint3-mission.tex
│   ├── 07-sprint4-maintenance.tex
│   ├── 08-sprint5-finance-alertes.tex
│   ├── 09-sprint6-collaboration-ia.tex
│   └── 10-conclusion-generale.tex
├── annexes/
│   ├── A-extraits-code.tex
│   ├── B-journal-de-bord.tex
│   ├── C-jeux-de-tests.tex
│   └── D-diagrammes-complementaires.tex
├── figures/
│   ├── diagrammes/                 copie des PNG de Conception_et_Diagrammes
│   ├── logos/                      copie des PNG de Logos_et_Technologies
│   ├── captures/                   à remplir
│   └── planning/                   Gantt, backlog
├── biblio/
│   └── references.bib
└── compiler.bat                    pdflatex ×2 + biber + makeglossaries
```

**Choix techniques** : classe `report`, `babel` français, `fontspec` + Times
(XeLaTeX) ou `mathptmx` (pdfLaTeX), `biblatex`+`biber`, `glossaries`, `booktabs`,
`float`, `caption`, `fancyhdr`, `lastpage` (pour la forme `n/N`), `graphicx`,
`xcolor`, `tcolorbox` (encadrés de définition), `pdflscape` (diagrammes larges).

**Compilateur retenu : pdfLaTeX + `mathptmx`** — Times sans dépendance système,
compile chez n'importe quel encadrant. XeLaTeX en repli si vous voulez le vrai
Times New Roman.

---

## 8. Arbitrages qui demandent votre décision

1. **6 sprints pour 12 services.** Un sprint par service donnerait 12 chapitres
   et ferait exploser les 40 pages. Le regroupement proposé est par cohérence
   métier. Si votre backlog réel avait un autre découpage, il prime : donnez-le
   et je réaligne.

2. **Volume.** 42 pages estimées contre « ≈ 40 ». Marge de manœuvre : fusionner
   les sprints 5 et 6, ou déplacer les diagrammes de communication en annexe D.

3. **Diagrammes en annexe.** Les 24 diagrammes de classes sont volumineux. Option
   retenue par défaut : un seul par sprint dans le corps (le `class-domain`), les
   `class-architecture` en annexe D.

4. **Organisme d'accueil.** Nom, logo, année universitaire, encadrants
   académique et entreprise : à fournir, la page de garde en dépend.

5. **Trello / WhatsApp / Jitsi / LinkedIn.** À confirmer : réellement utilisés
   pendant le stage ou logos décoratifs ? S'ils ne l'ont pas été, je les écarte.
