# Documentation PlantUML — XPARK GMAO

Ensemble des diagrammes de la plateforme, **generes par analyse du code**
du depot. Chaque boite, chaque fleche et chaque cardinalite correspond a un
artefact reellement present : conteneur declare dans `docker-compose.yml`,
controleur, entite, `DbSet`, routing key, hub SignalR, route nginx.

Quand une information manque, elle est **signalee dans le README concerne**
plutot que comblee par une hypothese. Voir « Ce qui n'a pas pu etre genere ».

## Chiffres

| | |
|---|---|
| Diagrammes `.puml` | **218** |
| Fichiers README | **14** |
| Dossiers | **36** |
| Microservices documentes | **12** |

## Organisation

```text
docs/diagrams/
├── README.md                  ce fichier
├── platform/                  22 diagrammes — vue d'ensemble de la plateforme
├── architecture/              2 diagrammes — architectures logique et physique
├── infrastructure/            6 diagrammes — socle technique
├── frontend/                  6 diagrammes — back-office React
├── shared/                    6 diagrammes — bibliotheques communes
├── backend/                   README seul (sources absentes du depot)
└── microservices/             176 diagrammes repartis sur 12 services
    ├── AI-Optimizer/      15 diagrammes + README
    ├── AI-Predictor/      16 diagrammes + README
    ├── Alerts/            13 diagrammes + README
    ├── Ayshaa-RAG/        15 diagrammes + README
    ├── Chat/              13 diagrammes + README
    ├── Finance/           13 diagrammes + README
    ├── Fleet/             16 diagrammes + README
    ├── IAM/               14 diagrammes + README
    ├── IBOA/              15 diagrammes + README
    ├── Maintenance/       14 diagrammes + README
    ├── Mission/           16 diagrammes + README
    └── PredictionPanne/   16 diagrammes + README
```

Les services dont un `<Service>-sequence.puml` couvrait plusieurs scenarios
possedent en plus un sous-dossier `sequence/`, un fichier par scenario.

## Convention de nommage

| Portee | Motif | Exemple |
|---|---|---|
| Plateforme | `platform-<sujet>.puml` | `platform-database-er.puml` |
| Infrastructure | `<brique>.puml` | `rabbitmq-topology.puml` |
| Back-office | `frontend-<sujet>.puml` | `frontend-routing.puml` |
| Commun | `shared-<sujet>.puml` | `shared-events.puml` |
| Microservice | `<Service>-<sujet>.puml` | `Mission/Mission-sequence.puml` |

Les 13 sujets presents pour **chaque** microservice :

`sequence` · `usecase` · `communication` · `entities` · `class-architecture` ·
`class-domain` · `component` · `package` · `activity` · `state` · `database` ·
`api-flow` · `service-flow`

Le diagramme de classes est scinde en deux : `class-architecture` montre les
couches et les interfaces, `class-domain` ne retient que les entites metier,
sans aucune trace d'infrastructure.

## Mise en page des cas d'utilisation

Les `<Service>-usecase.puml` suivent une disposition unique, pensee pour
qu'aucun trait ne contourne la frontiere ni ne traverse un autre element.
Elle repose sur une propriete de PlantUML : sous `left to right direction`,
les indications de sens subissent une rotation d'un quart de tour.

| Ecrit | Effet reel | Usage |
|---|---|---|
| `-up-\|>` | le parent passe **a gauche** | acteur porteur d'associations dont le parent ne l'est pas |
| `-down-\|>` | le parent passe **a droite** | acteur purement structurel, repousse vers la gauche |
| `-left-\|>` / `-right-\|>` | **meme colonne**, ordre vertical impose | deux acteurs porteurs d'associations |

Regles appliquees :

1. **Tous les acteurs sont a gauche**, en arbre d'heritage
   `Gestionnaire / Technicien / Chauffeur → Employe → Utilisateur`,
   `Client → Utilisateur`. `Responsable` regroupe la combinaison
   ADMIN + GESTIONNAIRE, de loin la plus frequente dans les habilitations.
2. **Tout acteur qui porte au moins une association occupe la colonne
   accolee a la frontiere.** Chaque association ne franchit alors qu'une
   seule colonne. Les acteurs purement structurels s'effacent vers la gauche.
3. **Un cas d'utilisation n'est relie qu'a un seul acteur** : quand plusieurs
   le revendiquent, l'association part de leur plus proche ancetre commun,
   et les sous-acteurs en heritent par generalisation.
4. **La frontiere est subdivisee en domaines fonctionnels** (`package`).
   Un cas atteint par `<< include >>` reste **hors domaine** : il occupe la
   colonne suivante, et l'enfermer tirerait tout son domaine avec lui.
5. **Acteurs secondaires a droite**, hors frontiere, relies par une
   association simple : aucun stereotype en dehors de `<< include >>` et
   `<< extend >>`, qui ne relient que des cas d'utilisation entre eux.
   Deux liens invisibles les tiennent en place : un lien de rang depuis
   le cas le plus a droite, qui les pousse tous dans la meme derniere
   colonne, et un chainage de meme colonne qui les aligne verticalement.
   Sans le premier, un acteur rattache a un cas de la colonne 0 se posait
   AU-DESSUS du cadre au lieu d'etre a sa droite.

## Obtenir un format paysage sur un gros diagramme

Le probleme et sa cause. Les acteurs occupent la colonne de gauche, les
cas d'utilisation la colonne suivante : la hauteur est donc
proportionnelle au NOMBRE de cas, et un service a 28 cas produit une
bande verticale illisible. On ne peut pas y remedier en repartissant les
domaines horizontalement : essai fait sur IAM, des que les domaines
occupent plusieurs colonnes, l'acteur qui possede les cas de la colonne
de droite est ejecte hors du cadre et ses associations traversent tout le
diagramme. **Acteurs a gauche et domaines cote a cote sont
incompatibles** ; c'est une contrainte du graphe, pas de PlantUML.

Trois leviers agissent reellement, dans cet ordre :

1. **Deplacer le detail vers la droite.** Un cas atteint par
   `<< include >>` ou `<< extend >>` occupe la colonne suivante. Ecrire
   l'extension dans le sens `base <.. extension : << extend >>` plutot
   que `extension ..> base` : le trace est identique, la pointe reste sur
   le cas de base comme l'exige UML, mais Graphviz classe alors
   l'extension APRES sa base, donc a droite. Ecrite dans l'autre sens,
   elle remontait d'un cran a gauche, dans la colonne des acteurs.
   Chaque cas ainsi deplace raccourcit la colonne principale ET elargit
   le diagramme : le rapport largeur / hauteur progresse deux fois.

2. **Factoriser.** Les variantes d'une meme capacite (activer /
   desactiver, consulter / modifier, referencer / modifier) deviennent un
   seul cas. Un diagramme de cas d'utilisation exprime des buts
   d'utilisateur, pas la liste des endpoints. Toutes les fusions
   pratiquees ici sont consignees en commentaire dans le generateur et
   resumees plus bas.

3. **Regler `nodesep` et `ranksep`.** `nodesep` resserre l'axe qui
   deborde - l'empilement a l'interieur d'une colonne - et `ranksep`
   aere celui qui manque de matiere - l'ecart entre colonnes. Les
   valeurs retenues sont `nodesep 18` et `ranksep 80`. Sans toucher au
   contenu, ce seul reglage a fait passer IAM de 1,00 a 1,21.

Resultat mesure, largeur / hauteur du rendu PNG :

| Service | Avant | Apres | Rapport |
|---|---|---|---|
| IAM | 1013 x 2332 | 1289 x 1067 | 0,43 -> **1,21** |
| Maintenance | 592 x 2140 | 954 x 1056 | 0,28 -> **0,90** |
| Fleet | 590 x 1993 | 968 x 905 | 0,30 -> **1,07** |
| Chat | 706 x 1318 | 1101 x 799 | 0,54 -> **1,38** |
| Mission | 1344 x 1443 | 1758 x 1149 | 0,93 -> **1,53** |

Fleet et Maintenance restent legerement en portrait. Les descendre au
format paysage demanderait de fusionner des capacites reellement
distinctes - par exemple confondre l'inspection d'un vehicule avec
l'affectation d'un equipement. Le gain de forme ne vaut pas cette perte
de sens : ces deux diagrammes tiennent desormais sur une page A4
portrait, ce qui etait l'objectif.

## Cas d'utilisation regroupes

Le diagramme exprime des buts metier, pas la liste des actions des
controleurs. Les regroupements pratiques :

| Service | Cas regroupes | Cas resultant |
|---|---|---|
| IAM | Consulter + Modifier son profil | Gerer son profil |
| IAM | Activer + Desactiver le second facteur | Gerer son second facteur |
| IAM | Se deconnecter + Verrouiller sa session | Cloturer sa session |
| IAM | Approuver + Rejeter un compte | Statuer sur une demande d'inscription |
| IAM | Changer le role + Suspendre + Reactiver | Gerer les habilitations |
| IAM | Restaurer + Purger un compte archive | Gerer les comptes archives |
| IAM | Consulter + Effacer l'historique des connexions | Gerer l'historique des connexions |
| IAM | Gerer les clients + Gerer les employes | Gerer le referentiel des utilisateurs |
| Fleet | Vehicules + disponibilite + equipements + indicateurs | Consulter le parc |
| Fleet | Documents administratifs + echeances | Consulter les pieces administratives |
| Fleet | Sources de carburant + statistiques | Suivre la consommation de carburant |
| Fleet | Affecter + Restituer un equipement | Affecter et restituer un equipement |
| Fleet | Immatriculer + Modifier un vehicule | Tenir la fiche d'un vehicule |
| Fleet | Ajouter + Modifier un equipement | Tenir la fiche d'un equipement |
| Fleet | Document administratif + assurance | Enregistrer une piece administrative |
| Fleet | Retirer vehicule + equipement + piece justificative | Sortir un bien de l'inventaire |
| Maintenance | Modifier + Valider un ordre de travail | Instruire un ordre de travail |
| Maintenance | Modifier + Changer le statut d'une intervention | Suivre une intervention |
| Maintenance | Consommer + Restituer une piece | Consommer ou restituer une piece |
| Maintenance | Referencer + Modifier une piece | Tenir le catalogue des pieces |
| Maintenance | Commenter + Joindre un document | Documenter un ordre de travail |
| Maintenance | Les quatre suppressions reservees a l'administrateur | Purger le dossier de maintenance |
| Chat | Ouvrir une conversation privee + Creer un groupe | Ouvrir une conversation |
| Chat | Epingler + Transferer + Supprimer un message | Agir sur un message |

Sujets supplementaires, uniquement la ou la fonctionnalite existe vraiment :

| Sujet | Services concernes |
|---|---|
| `classifier-ia-pipeline` | IBOA, PredictionPanne |
| `inference-flow` | AI-Optimizer, AI-Predictor, Ayshaa-RAG, IBOA, PredictionPanne |
| `ml-pipeline` | AI-Predictor |
| `optimization-flow` | AI-Optimizer, Mission |
| `prediction-flow` | AI-Predictor, PredictionPanne |
| `rag-flow` | Ayshaa-RAG |

## Regenerer les images

Les fichiers `.puml` sont la source ; **aucune image n'est versionnee**.

### Avec le jar PlantUML

Telecharger `plantuml.jar` depuis <https://plantuml.com/download> (Java 8+ requis).

```bash
# Toute la documentation en PNG
java -jar plantuml.jar -tpng -o rendered "docs/diagrams/**/*.puml"

# En SVG (recommande : texte selectionnable, sans perte)
java -jar plantuml.jar -tsvg -o rendered "docs/diagrams/**/*.puml"

# Un seul dossier
java -jar plantuml.jar -tsvg docs/diagrams/microservices/Mission/*.puml

# Verifier la syntaxe sans rien produire
java -jar plantuml.jar -checkonly "docs/diagrams/**/*.puml"

# Grands diagrammes : lever la limite de taille par defaut
java -DPLANTUML_LIMIT_SIZE=16384 -jar plantuml.jar -tsvg "docs/diagrams/**/*.puml"
```

### Avec Docker (sans installer Java)

```bash
docker run --rm -v "$PWD:/data" plantuml/plantuml -tsvg "/data/docs/diagrams/**/*.puml"
```

### Dependance Graphviz

Les diagrammes de classes, de composants et d'etats necessitent **Graphviz**
(`dot`). Les diagrammes de sequence et d'activite s'en passent.

```bash
java -jar plantuml.jar -testdot     # verifie l'installation
```

- Windows : `winget install graphviz` puis redemarrer le terminal
- Debian/Ubuntu : `sudo apt install graphviz`
- macOS : `brew install graphviz`

## Visualisation dans VS Code

Extension recommandee : **PlantUML** (`jebbs.plantuml`).

```bash
code --install-extension jebbs.plantuml
```

| Raccourci | Action |
|---|---|
| `Alt+D` | Apercu du diagramme sous le curseur |
| `Ctrl+Shift+P` → *PlantUML: Export Current Diagram* | Export du fichier ouvert |
| `Ctrl+Shift+P` → *PlantUML: Export Workspace Diagrams* | Export de tout le dossier |

Reglages utiles (`.vscode/settings.json`) :

```json
{
  "plantuml.render": "Local",
  "plantuml.exportFormat": "svg",
  "plantuml.exportOutDir": "docs/diagrams/rendered",
  "plantuml.diagramsRoot": "docs/diagrams"
}
```

`"plantuml.render": "Local"` evite d'envoyer les diagrammes au serveur public
PlantUML — a privilegier, ces schemas decrivent une architecture interne.

Alternative sans Java : **PlantUML Previewer** ou l'extension *Markdown Preview*
de GitLab. GitHub ne rend pas nativement les blocs PlantUML.

## Ce que les diagrammes reflettent

Releve effectue sur le code au moment de la generation :

| Element | Nombre |
|---|---|
| Microservices .NET 8 (Clean Architecture) | 8 |
| Services Python (FastAPI) | 4 |
| Controleurs | 26 |
| Endpoints HTTP (.NET) | 228 |
| Endpoints FastAPI | 28 |
| Entites du domaine | 39 |
| Enumerations partagees | 33 |
| Evenements d'integration declares | 22 |
| Hubs SignalR | 1 |
| Services declares dans docker-compose | 20 |
| Blocs `location` nginx | 38 |
| Routes du back-office | 53 |

## Points d'architecture a connaitre

Trois choix structurants apparaissent dans plusieurs diagrammes et meritent
d'etre compris avant de les lire :

1. **Base de donnees partagee.** Les 8 services .NET ecrivent dans la meme
   base `xpark_gmao`. Chacun ne possede que ses tables et lit les autres en
   SQL direct ; c'est pourquoi `Vehicule`, `Utilisateur` ou `Mission` sont
   redeclares en lecture seule dans plusieurs couches `Domain`.

2. **Deux bus de messages.** MassTransit (messages types, enveloppe JSON) est
   utilise entre services .NET ; un exchange topic `xpark.ai` transporte du
   JSON brut pour que les services Python le consomment directement avec
   `pika`, sans avoir a decoder l'enveloppe MassTransit.

3. **Deux couches nginx.** Le conteneur du back-office reecrit `/api/*` vers
   `/<service>/api/*` et transmet a la passerelle, qui route vers le
   conteneur. Les deux couches emploient le resolveur Docker `127.0.0.11`
   avec une variable dans `proxy_pass`, afin que le nom du conteneur soit
   re-resolu a chaque requete.

## Ce qui n'a pas pu etre genere

| Diagramme demande | Raison |
|---|---|
| `infrastructure/redis-architecture.puml` | **Redis n'est pas utilise.** Le terme n'apparait que dans deux commentaires d'AyshaaRAG le citant comme evolution possible. La limitation de debit est en memoire (`defaultdict`), la memoire de conversation en SQLite. |
| `infrastructure/minio-storage.puml` | **MinIO est absent du depot.** Les fichiers televerses (avatars, pieces jointes) sont ecrits dans un volume Docker partage `./data/uploads`, servi par nginx via `location /uploads/`. |
| `backend/*.puml` | **Les sources du monolithe ne sont plus dans le depot** : `backend/src` ne contient qu'un dossier `wwwroot/uploads` vide. Voir [`backend/README.md`](backend/README.md). |
| `AI-Predictor-training-flow.puml` | **Aucun code d'entrainement dans le depot** : seul l'artefact `model_xgboost.pkl` est versionne. La chaine d'apprentissage est decrite dans `AI-Predictor-ml-pipeline.puml`, en distinguant clairement ce qui est observe de ce qui est deduit. |
| `*-ocr-flow.puml` (tous les microservices) | **Aucun microservice ne fait d'OCR.** L'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts`, qui appelle l'API xAI Grok. |
| `*-rag-flow.puml` sauf Ayshaa-RAG | Un seul service met en oeuvre une recherche augmentee. |
| `*-training-flow.puml` (tous) | Aucun entrainement de modele nulle part dans le depot. |

## Divergences relevees pendant l'analyse

Ces ecarts entre le code et l'intention apparente sont **documentes dans les
diagrammes concernes**, pas corriges :

- **17 des 22 evenements d'integration ne sont ni publies ni consommes.**
  Seul IAM publie (5 evenements) et seul Chat consomme (1). Voir
  `platform-rabbitmq-events.puml` et `shared/shared-events.puml`.
- **`NotificationEmailEvent` n'a aucun publieur ni consommateur** : aucune
  notification par courriel n'est declenchee par le bus. Les courriels
  partent directement d'IAM (MailKit) et d'IBOA (smtplib).
- **`SourcePrediction.MODELE_ML` existe mais aucun modele ML n'est branche** :
  `RuleBasedPredictionEngine` est deterministe. `IPredictionEngine` est le
  point de bascule prevu.
- **La route `/kanbanHub` pointe vers l'ancien monolithe**, dont les sources
  ont disparu du depot.

## Regenerer les diagrammes eux-memes

Les `.puml` ont ete produits par analyse statique du code. Ils ne se
regenerent pas automatiquement : apres une evolution notable de
l'architecture, mettre a jour le diagramme concerne a la main, ou relancer
une passe d'analyse.

Verification rapide apres modification :

```bash
java -jar plantuml.jar -checkonly -failfast2 "docs/diagrams/**/*.puml"
```

## Documentation liee

- [`../ameliorations-plateforme/`](../ameliorations-plateforme/) — correctifs et
  preparation a la production
- [`../frontend-improvements/`](../frontend-improvements/) — evolutions du back-office
- `microservices/*/ARCHITECTURE.md` (dans le code source) — note d'architecture
  par service
