# RBAC — XPARK GMAO

Documente le contrôle d'accès par rôle (RBAC) du back-office XPARK GMAO :
architecture, rôles, matrice de permissions, correctifs apportés, et
limites connues. Rédigé après un audit complet suite à un test montrant
qu'un compte `CHAUFFEUR` pouvait voir/atteindre la quasi-totalité du
back-office admin.

## 1. Architecture actuelle

### Modèle de rôles

Un seul enum, source de vérité, partagé par tous les services :

```csharp
// microservices/XparkGMAO.Shared/Enums/SharedEnums.cs
public enum Role { CLIENT = 1, CHAUFFEUR = 2, TECHNICIEN = 3, GESTIONNAIRE = 4, ADMINISTRATEUR = 5, ADMIN = 6 }
```

Deux copies mortes du même enum existent dans `Finance.Domain.Entities.Enums`
et `Maintenance.Domain.Entities.Enums` — non référencées ailleurs dans leur
service respectif, laissées telles quelles (hors périmètre de ce correctif).

### JWT

`IAM.Infrastructure.Services.JwtService.GenerateToken` place le rôle dans le
claim standard `ClaimTypes.Role` (valeur = `Role.ToString()`, ex. `"CHAUFFEUR"`),
plus `userId`, `nom`, `prenom`. Aucun claim de permission fine — uniquement
le rôle. C'est ce que lisent `[Authorize(Roles=...)]` et `User.IsInRole()`
côté back-end, et ce que décode le front (`role` dans le payload).

### Autorisation back-end

Pas de passerelle API (Ocelot/YARP) : nginx ne fait que du reverse-proxy de
chemin, sans aucune vérification. Chaque microservice valide son propre JWT
et applique `[Authorize(Roles="...")]` par contrôleur/action — c'est donc
100% la responsabilité de chaque contrôleur, sans policy engine central.
C'était le vrai trou : de nombreux contrôleurs n'avaient qu'un `[Authorize]`
nu (n'importe quel rôle connecté), au lieu d'une liste de rôles.

### Autorisation front-end

`ProtectedRoute` (`frontend/backoffice/src/components/ProtectedRoute.tsx`)
fonctionne correctement : si `allowedRoles` est vide, tout utilisateur
connecté passe ; sinon il vérifie le rôle et redirige vers `/errors/error-403`
en cas de refus. Le bug n'était pas là : 28 des 37 routes protégées
n'avaient tout simplement jamais `allowedRoles` renseigné. La barre latérale
(`menu-items.ts`) n'avait, elle, aucune notion de rôle — une seule liste
statique rendue à tout le monde.

## 2. Rôles existants

`ADMIN`, `ADMINISTRATEUR`, `GESTIONNAIRE`, `TECHNICIEN`, `CHAUFFEUR`, `CLIENT`
(+ `RH`, une chaîne utilisée uniquement par la route front `employees`, sans
existence dans l'enum back-end — héritage non touché).

## 3. Matrice de permissions (source unique)

Groupes réutilisés partout (`frontend/backoffice/src/config/rbac.ts`) :
- **STAFF** = `ADMIN, ADMINISTRATEUR, GESTIONNAIRE`
- **OPS** = STAFF + `TECHNICIEN`
- **SELF** = tout utilisateur connecté, contenu/données bornés à l'appelant

| Module | Route(s) back-office | Accès |
|---|---|---|
| Dashboard | `/dashboard` | SELF (contenu différent par rôle — voir §5) |
| Missions (admin) | `/gestion/missions` | STAFF |
| Mes Missions *(nouveau)* | `/gestion/mes-missions` | CHAUFFEUR |
| Suivi en Direct | `/gestion/suivi` | STAFF |
| Planification | `/apps/calendar` | STAFF |
| Optimisateur IA | `/gestion/optimisateur` | STAFF |
| Messagerie | `/apps/chat` | OPS |
| Tâches (Kanban/détail) | `/tasks/*` | OPS |
| Demandes de Transport | `/gestion/demandes-transport` | STAFF |
| Contacts | `/users/contacts` | OPS |
| Véhicules | `/gestion/vehicules` | OPS |
| Employés & Chauffeurs | `/hr/employees` | `ADMIN, RH` |
| Équipements | `/gestion/equipements` | OPS |
| Interventions / Ordres de Travail / Pièces Rechange | `/maintenance/*` | OPS |
| Prédiction de Pannes | `/maintenance/prediction-pannes` | OPS |
| Factures (liste/créer/aperçu) | `/invoices*` | STAFF |
| Carburant / Sources | `/operations/*` | STAFF |
| Analyses & KPIs | `/analytics` | OPS (widgets internes finement contrôlés — voir §6) |
| Assistant IBOA | `/monitoring/iboa` | STAFF |
| Utilisateurs (comptes/admissions/archives) | `/users`, `/users/pending`, `/users/archives` | par entrée, inchangé |
| Profil, Sécurité (MFA) | `/users/profile`, `/security` | SELF |
| Alertes | `/alertes` | OPS |
| Projets / Fichiers | `/apps/Projects`, `/apps/file-manager` | OPS |
| Trésorerie | `/wallet` | STAFF |
| FAQ / Support | `/pages/faq` | SELF |

`CLIENT` reçoit uniquement le niveau SELF (Dashboard réduit, Profil, Sécurité,
FAQ) — son vrai espace self-service (missions, factures) reste dans
`frontend/frontoffice`, non modifié ici.

## 4. Ce qui a changé

### Front-end (`frontend/backoffice/src`)

- **`config/rbac.ts`** *(nouveau)* — `AppRole`, groupes `STAFF`/`OPS`,
  `roleMatches()`. Le fichier existant
  `components/dashboard/analytics/rbac.ts` (finance/fleet/maintenance
  widgets — logique inchangée) importe désormais son type `AppRole` d'ici
  plutôt que de le redéfinir.
- **`routes/index.ts`** — `allowedRoles` ajouté sur toutes les routes qui en
  étaient dépourvues (matrice ci-dessus), + nouvelle route `mes-missions`.
- **`helpers/Manu.ts`** — `getMenuItems(role)`/`getHorizontalMenuItems(role)`
  filtrent désormais récursivement `MENU_ITEMS` en dérivant les rôles
  autorisés **directement de `APP_ROUTES`** (`ROLES_BY_PATH`, construit à
  partir de `allowedRoles`) : impossible que la barre latérale et la
  protection de route divergent, une seule table à maintenir. Un titre de
  section sans plus aucun élément derrière lui est retiré automatiquement.
- **`assets/data/menu-items.ts`** — `Profil` sorti du sous-menu admin
  « Utilisateurs » (qui reste STAFF) vers une section personnelle « Mon
  Compte », avec l'entrée `Sécurité (MFA)` (route déjà existante, jamais
  présente dans le menu) et `mes-missions` (CHAUFFEUR).
- **`app/(admin)/gestion/mes-missions/page.tsx`** *(nouveau)* — liste en
  lecture seule des missions du chauffeur connecté (`GET /missions/driver`,
  déjà borné côté serveur), + panneau de détail au clic. Aucun montant TND
  affiché (même principe que `analytics/rbac.ts`).
- **`app/(admin)/dashboard/page.tsx`** — branche par rôle : CHAUFFEUR/CLIENT
  reçoivent un tableau de bord réduit (nouveaux composants
  `ChauffeurDashboard`/`ClientDashboard`) au lieu du dashboard exécutif.
  Corrige au passage une fuite : les appels `employeeService.getAll()`,
  `alerteService.getAll()`, `transportRequestService.getAll()` étaient
  déclenchés sans condition pour **tout** rôle au chargement du dashboard —
  ils ne partent plus que pour STAFF/TECHNICIEN.
- **`services/missionService.ts`** — ajout de `getMyDriverMissions()`
  (`GET /missions/driver`).

### Back-end — ajout de `Roles=` sur des `[Authorize]` nus

Même logique partout : le contrôleur exigeait déjà un JWT valide, mais
aucun rôle précis, donc CHAUFFEUR/CLIENT passaient. Chaque changement est un
ajout de `Roles=` sur un attribut existant (ou nouvellement ajouté), aucun
nouveau mécanisme :

| Contrôleur | Actions | Nouveau rôle requis |
|---|---|---|
| `Finance.API/FacturesController` | GetAll, GetById, GetImpayees | STAFF |
| `IAM.API/ClientsController` | GetAll, GetById | STAFF |
| `IAM.API/EmployeesController` | GetAll, GetById, GetByPost, GetByStatut | OPS *(pas STAFF strict — voir note ci-dessous)* |
| `Maintenance.API/InterventionsController` | GetAll, GetById | OPS |
| `Maintenance.API/OrdreTravailController` | GetAll, GetById, GetHistorique, GetKanban, GetKanbanMetadata, GetDetail | OPS |
| `Maintenance.API/PiecesRechangeController` | GetAll, GetById, GetStockFaible | OPS |
| `Fleet.API/EquipementsController` | Lectures + les actions d'écriture qui étaient ouvertes (CheckOut/CheckIn/inspections/notes/contrats — actuellement des stubs sans effet réel) | OPS |
| `Fleet.API/AssurancesController`, `DocumentsController`, `EcheancesController` | toutes (niveau classe) | OPS |
| `Fleet.API/SourcesController` | toutes (niveau classe) | OPS |
| `Fleet.API/VehiculesController` | GetAll, GetById, GetByImmatriculation, GetLatestInfo, GetDisponibles, GetAlertData | OPS |
| `Chat.API/ChatController` | toutes (niveau classe) | OPS |
| `Alerts.API/AlertesController` | GetAll, GetNonLues, CountNonLues, GetByType, MarquerLue, MarquerToutesLues | OPS |

Note EmployeesController : la page front `/hr/employees` reste `ADMIN,RH`
(inchangé), mais l'API est aussi consultée en coulisse par le Dashboard
(compteur de chauffeurs) et les écrans d'affectation de mission pour
STAFF **et** TECHNICIEN — la restreindre à STAFF aurait cassé le dashboard
TECHNICIEN qui fonctionnait déjà (violerait « ne rien casser pour les rôles
existants »). D'où OPS sur les lectures API, tout en gardant la page HR
elle-même verrouillée à `ADMIN,RH`.

Cas particuliers corrigés séparément :
- **`Fleet.API/VehiculesController.GetAlertData`** avait `[AllowAnonymous]`
  — accessible sans authentification du tout. Retiré.
- **`Alerts.API/AlertesController.CountNonLues`** avait aussi
  `[AllowAnonymous]`. Retiré.

### Back-end — IDOR corrigé (`IAM.API/UsersController`)

`GetDetails(id)`, `GetStats(id)`, `UploadAvatar(id, file)`,
`UpdateProfileById(id, ...)` acceptaient n'importe quel `id` sans vérifier
qu'il s'agissait de l'appelant — n'importe quel utilisateur connecté
(CHAUFFEUR inclus) pouvait lire ou modifier le profil de **n'importe qui
d'autre**. Ajout d'un garde `IsSelfOrStaff(id)` (même pattern que les
actions `GetProfile`/`UpdateProfile` déjà correctement bornées via
`User.FindFirst("userId")`) : autorisé si `id == callerId` **ou** si
l'appelant est STAFF ; sinon `403 Forbid()`.

### Back-end — ownership réel sur les missions/tracking du chauffeur

- `Mission.API/MissionsController.GetAll`/`GetById` : `CHAUFFEUR` retiré de
  la liste de rôles — un chauffeur voyait **toutes** les missions de la
  flotte, pas seulement les siennes. Il utilise désormais exclusivement les
  routes `/driver` ci-dessous, correctement bornées.
- **`GET /missions/driver/{id}`** *(nouveau)* — détail d'UNE mission, borné
  au chauffeur connecté (même correspondance de nom que `/missions/driver`
  existant, factorisée dans `MissionService.IsSameDriver`, réutilisée par
  `GetByDriverNameAsync` et le nouveau `GetByIdForDriverAsync`). 404 si la
  mission ne lui appartient pas — alimente le panneau de détail de « Mes
  Missions » côté front.
- `Mission.API/TrackingController.CanRead` (lecture position GPS live/
  historique) : la branche `User.IsInRole("CHAUFFEUR")` autorisait
  n'importe quel chauffeur à lire la position de **n'importe quelle**
  mission. Remplacée par `User.IsInRole("CHAUFFEUR") && IsOwnMission(m)`
  (même correspondance de nom). `Ping` (soumission de position GPS) reçoit
  la même vérification : un chauffeur ne peut plus poster une position pour
  une mission qui n'est pas la sienne.

Ces correctifs réutilisent volontairement l'approche « correspondance par
nom » déjà en place (`Mission.ChauffeurNom`) plutôt que d'inventer un
nouveau mécanisme — voir limite connue ci-dessous.

## 5. Dashboard réduit (CHAUFFEUR / CLIENT)

`app/(admin)/dashboard/page.tsx` branche désormais sur le rôle **après**
avoir appelé tous les hooks React (règle des hooks respectée — pas d'appel
conditionnel) :
- `CHAUFFEUR` → `ChauffeurDashboard` : compteurs (missions en cours /
  terminées / total) via `GET /missions/driver`, liens rapides vers Mes
  Missions / Profil / Sécurité. Aucune donnée fleet-wide chargée.
- `CLIENT` → `ClientDashboard` : message d'accueil + lien Profil (leur
  espace réel est `frontoffice`).
- STAFF/TECHNICIEN : dashboard exécutif inchangé.

## 6. Analyses & KPIs — permissions fines existantes (non modifiées)

`components/dashboard/analytics/rbac.ts::permissionsFor(role)` continue de
gérer, à l'intérieur de la page `/analytics` (et du dashboard exécutif),
quels widgets un rôle STAFF/TECHNICIEN/CHAUFFEUR voit (finance, flotte,
maintenance, carburant, opérations). Le changement RBAC de cette passe
ajoute uniquement une porte au niveau route (`allowedRoles: OPS` sur
`/analytics`) — CHAUFFEUR n'atteint plus du tout la page (elle ne lui
montrait de toute façon presque rien), CLIENT non plus.

## 7. Tests effectués

Pour chaque rôle disposant d'un compte de test (`ADMIN`, `GESTIONNAIRE`,
`CHAUFFEUR` via `sssabarhoumi@gmail.com`) après reconstruction des
conteneurs Docker concernés (`iam-api`, `fleet-api`, `mission-api`,
`maintenance-api`, `finance-api`, `alerts-api`, `chat-api`, `backoffice`) :

1. Connexion + vérification que la barre latérale ne montre que les
   sections autorisées par la matrice.
2. Navigation directe vers des URLs interdites (ex. `/users`, `/invoices`
   pour CHAUFFEUR) → `403` (redirection `/errors/error-403`), pas le
   contenu de la page.
3. Appels API directs (`curl` + JWT du rôle testé) sur des endpoints
   interdits → `401`/`403`, jamais les données.
4. CHAUFFEUR spécifiquement : `Mes Missions` ne liste que ses propres
   missions ; `GET /missions/driver/{id}` et le tracking GPS d'une mission
   d'un autre chauffeur renvoient `404`/`403` ; les parcours ADMIN/
   GESTIONNAIRE (affectation de mission, factures, gestion des
   utilisateurs) fonctionnent sans régression.
5. `npx tsc --noEmit` sur le back-office (aucune erreur de type).
6. `dotnet build` sur les 7 services back-end modifiés (0 erreur).

## 8. Limites connues / travail restant

- **Pas de lien `Utilisateur ↔ Employee`.** Un chauffeur n'est identifié,
  côté données, que par correspondance de nom
  (`Mission.ChauffeurNom` ≈ `prénom + nom` du JWT) — pas par une vraie clé
  étrangère. C'est une limite préexistante (déjà signalée par un commentaire
  dans le code d'origine), pas introduite par ce correctif ; les nouvelles
  vérifications d'ownership (mission détail, tracking) en héritent : deux
  chauffeurs homonymes se verraient mutuellement leurs missions. La vraie
  correction — ajouter un `EmployeeId`/`UtilisateurId` sur `Utilisateur` ou
  `Employee` et l'utiliser partout à la place du nom — est un changement de
  modèle de données plus large, sur IAM **et** Mission, hors périmètre de
  cette passe.
- **Asymétries de rôles préexistantes non corrigées** (hors périmètre, déjà
  présentes avant cet audit, laissées pour ne rien casser sans nécessité) :
  `VehiculesController.Create/Update` accepte `ADMIN,GESTIONNAIRE` mais pas
  `ADMINISTRATEUR` ; plusieurs contrôleurs Maintenance acceptent
  `ADMIN,GESTIONNAIRE,TECHNICIEN` sur les écritures mais pas
  `ADMINISTRATEUR` non plus.
- **`EquipementsController`** : les actions CheckOut/CheckIn/inspections/
  notes/contrats sont aujourd'hui des stubs (aucune écriture réelle en
  base) — désormais protégées par rôle par cohérence, mais sans données
  réelles à sécuriser tant qu'elles ne sont pas implémentées.
- **Rôle `RH`** utilisé par la route front `employees` n'existe pas dans
  l'enum back-end `Role` — hérité tel quel, non modifié.
- Les deux copies mortes de l'enum `Role` (`Finance.Domain.Entities.Enums`,
  `Maintenance.Domain.Entities.Enums`) n'ont pas été supprimées (aucune
  référence trouvée, mais hors périmètre d'un correctif de sécurité).
