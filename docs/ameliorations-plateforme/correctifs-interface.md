# Correctifs d'interface — vocabulaire, annuaire, missions, barre latérale

Regroupe quatre sujets plus courts. Voir le [sommaire](README.md).

---

## 3 — Retrait du vocabulaire technique

Commit `116f855`

### Ce qui a changé

XPARK doit se présenter comme une solution logistique, pas comme un projet
d'ingénierie logicielle. Les textes **visibles** exposant des technologies
internes ont été reformulés en langage métier.

| Écran | Avant | Après |
|---|---|---|
| Optimisateur | « plan généré … via RabbitMQ » | « plan d'affectation calculé en moins de 5 secondes » |
| Optimisateur (panneau) | « Optimisation via RabbitMQ (Greedy → Génétique → Recherche locale) » | « Optimisation du planning en cours » |
| IBOA | badge « RabbitMQ connecté » | « Collecte des événements active » |
| IBOA | « Vérifiez `docker compose up -d iboa` » | message invitant à réessayer puis à contacter l'administrateur |
| IBOA | « pipeline RabbitMQ → scoring → alerte » | « détectée, évaluée puis remontée en alerte » |
| FAQ | 4 réponses citant microservices, RabbitMQ, RAG, passerelle API | description fonctionnelle des domaines métier |
| Timeline | profil de démo « full stack developer » avec badges html/CSS/NodeJS/Django/MySQL/PostgreSQL | événement logistique XPARK |

**Les commentaires de code restent techniques** : ils s'adressent aux
développeurs, pas aux utilisateurs.

Le site vitrine, le portail client et la base de connaissances de l'assistant
Ayshaa ont été audités : ils étaient **déjà exempts** de ces termes.

### Tester

Parcourir `/gestion/optimisateur`, `/monitoring/iboa`, `/pages/faq`,
`/pages/timeline` : aucun nom de technologie ne doit apparaître.

---

## 4 — Créer une mission pour un client

Commit `0c135b8`

### Ce qui a changé

Un bouton **« Créer une mission »** apparaît sur les lignes de rôle `CLIENT`
dans `/users` (et dans le menu des fiches de l'annuaire). Il ouvre l'assistant
de création **existant** avec le client déjà sélectionné, rappelé dans le titre
et dans un bandeau.

### Bug de fond corrigé

`CreateMissionDto` **ne transportait aucun client** : une mission créée depuis
le back-office n'était rattachée à personne, et n'était donc **jamais
facturable**. Le champ a été ajouté de bout en bout (DTO backend → entité →
DTO front → assistant).

### Comment ça marche

`/users` → bouton → `/gestion/missions?clientId=…` → la page résout le client,
ouvre `MissionWizardModal` avec la prop `client`, puis **nettoie l'URL** pour
qu'un rafraîchissement ne rouvre pas l'assistant. Si le client est introuvable,
l'assistant s'ouvre quand même, sans pré-sélection.

Aucune logique de création dupliquée : c'est le même assistant que le bouton
« Nouvelle mission ».

### Fichiers

- `Mission.Application/DTOs/CreateMissionDto.cs`, `Mission.Infrastructure/Services/MissionService.cs`
- `types/mission.ts`, `app/(admin)/gestion/missions/page.tsx`,
  `app/(admin)/gestion/missions/components/MissionWizardModal.tsx`,
  `app/(admin)/users/page.tsx`

### RBAC

Bouton visible pour `ADMIN`, `ADMINISTRATEUR`, `GESTIONNAIRE` uniquement.

### Tester

1. `/users`, filtrer sur le rôle CLIENT → bouton camion sur chaque ligne.
2. Cliquer → la page Missions s'ouvre, l'assistant affiche « Mission créée pour
   *client* ».
3. Compléter et enregistrer → la mission apparaît avec le client en colonne.
4. Cette mission devient facturable dans `/invoices/create-invoice`.

Vérifié : `POST /missions` avec `clientIdUtilisateur=37` → mission créée avec
`clientNom = « brh Saber »`.

---

## 5 — Annuaire clients dynamique

Commit `0c135b8` · Page `/users/contacts`

### Ce qui a changé

La page affichait des contacts **factices** issus du template (Paul Halpern,
coolweb.com…). Elle affiche désormais les vrais clients avec, pour chacun :
nom, société et ville, statut réel du compte, e-mail, téléphone, **nombre de
missions** et **dernière activité**.

S'y ajoutent : 4 indicateurs de synthèse, recherche (nom, société, e-mail,
ville, téléphone), filtre par statut, tri par activité décroissante, états de
chargement / erreur / vide, et des actions réelles (e-mail, appel, créer une
mission, voir les missions).

### Décision importante

L'annuaire part de la liste des **comptes** (`/user-management`) et non de
`/clients` : ce dernier ne renvoie que les clients disposant d'une fiche société
(**2 sur 9** en base). Les clients inscrits depuis le portail — précisément ceux
qui ont des missions — en étaient absents. La fiche société n'est qu'un
enrichissement (société, ville).

### Fichiers

- `app/(admin)/users/contacts/useContacts.ts` — nouveau, agrège 3 sources
- `app/(admin)/users/contacts/page.tsx`, `components/Contacts.tsx`
- `services/clientService.ts` — champs société complets
- `data.ts` statique **supprimé**

### Tester

`/users/contacts` : les 9 clients apparaissent, les plus actifs en tête (« brh
Saber », 3 missions). Rechercher « sfax » → filtre sur société/ville. Filtrer
par statut. Le menu d'une fiche permet de créer une mission.

---

## 7 — Barre latérale

Commit `f1b7567`

### Le symptôme

La navigation s'affichait « parfois correctement, parfois à moitié masquée ».

### Quatre causes cumulées

1. **Le contexte de mise en page supprimait les attributs de `<html>`.** La
   fonction de nettoyage de l'effet retirait `data-sidenav-size` ; comme l'effet
   dépend des réglages, elle s'exécutait avant **chaque** re-exécution (tout
   changement de thème, de couleur, de taille) et pas seulement au démontage :
   l'attribut disparaissait et la barre retombait sur la largeur par défaut du
   CSS. Pire, elle passait les **mauvaises valeurs** (la couleur du menu pour
   l'attribut de taille) ; or la fonction utilitaire **pose** la valeur quand
   l'attribut est absent au lieu de la retirer, ce qui pouvait écrire
   `data-sidenav-size="light"` — une taille invalide qui cassait durablement
   l'affichage. Le nettoyage a été supprimé : ces attributs vivent le temps de
   l'application et chaque exécution les réécrit correctement.

2. **Le bouton de repli ne traitait que deux états.** Depuis `condensed`, il ne
   faisait **rien** : une fois repliée, la barre ne pouvait plus être dépliée.

3. **Le bouton du bandeau supérieur** enchaînait des `if` indépendants terminés
   par un `else if` ; `sm-hover` et `sm-hover-active` n'étaient couverts par
   aucune branche.

4. **La logique responsive n'avait aucun cas « grand écran ».** Une taille
   imposée par une petite fenêtre était persistée dans le navigateur et jamais
   restaurée — la barre restait repliée d'une session à l'autre, même après
   rafraîchissement. Et elle se déclenchait en continu, annulant tout repli
   volontaire. Elle ne réagit plus qu'au **franchissement d'un palier**
   (mobile ≤ 768, tablette ≤ 1140, bureau au-delà) ; à l'intérieur d'un palier,
   le choix de l'utilisateur est respecté.

**Filet de sécurité** : une taille absente ou invalide dans le stockage local
(réglage corrompu par l'ancien bug) retombe sur `default`.

### Fichiers

- `context/useLayoutContext.tsx`
- `components/layout/LeftSideBar/index.tsx`
- `components/layout/TopBar/components/LeftSideBarToggle.tsx`

### Tester

1. Cliquer plusieurs fois sur le bouton de repli : `default ↔ condensed` à
   chaque clic (vérifié sur 4 clics consécutifs).
2. Rafraîchir : l'état est conservé et cohérent.
3. Réduire la fenêtre sous 1140 px puis revenir en grand : la barre se déplie.
4. Naviguer entre les pages : aucun changement d'affichage.
