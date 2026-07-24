# Présentation experte — Refonte front-office XPARK

Support de présentation orale (soutenance / revue). Structure : problème →
analyse → solution → décisions → bénéfices.

## 1. Problèmes initiaux

Cinq pages du back-office étaient des **écrans de démonstration** hérités du
template d'admin, pas des outils métier :

- **Données statiques** codées en dur (projets fictifs, avatars de démo,
  contenu « session tracking » / « shipping » dans la FAQ).
- **Interactions mortes** : filtres, tris, recherches, paginations et menus
  d'actions présents à l'écran mais **sans aucun code derrière**.
- **Faible valeur métier** : la « wallet » était un patchwork de widgets ;
  la page carburant n'offrait ni filtre, ni export, ni analyse par type.

## 2. Analyse

- La codebase suit déjà un patron clair sur les pages abouties (Missions,
  Demandes de Transport, Prédiction de pannes) : **service typé →
  orchestrateur → composants de présentation**, avec états et filtres.
- Le design system est homogène : React-Bootstrap, `IconifyIcon`, ApexCharts,
  classes `bg-soft-*`, avatars. Inutile d'inventer ; il faut **s'aligner**.
- Certaines API réelles existaient déjà (Fleet `/carburants/stats`) mais
  n'étaient pas pleinement exploitées ; d'autres domaines n'ont pas encore de
  microservice (projets, GED, trésorerie) → une **couche mock** est le bon
  intermédiaire.

## 3. Solutions mises en œuvre

| Page | Solution |
|---|---|
| Carburant | Tableau de bord analytique : filtres serveur/client, 6 KPIs, 3 graphes (dont répartition par type), table triable/paginée avec prix/L et taux de conso, export CSV/PDF |
| Projets | Couche service typée + page dynamique (états, filtres, stats, détail, pagination) |
| Fichiers | Service (fichiers, dossiers, stockage) + sidebar et liste dynamiques, actions branchées |
| Trésorerie | Recentrage finance : solde, flux mensuels, dépenses par catégorie, historique filtrable |
| FAQ | Hero + recherche + catégories + accordéon + contact, contenu XPARK réel |

## 4. Décisions techniques

- **Couche service mock plutôt que données en dur dans le composant.** Isole
  un point de bascule unique vers l'API et rend le composant testable. Le mock
  est un détail d'implémentation, pas une impasse.
- **Filtrage serveur vs client réfléchi** (carburant) : véhicule et dates au
  backend (agrégation), type et recherche au client (réactivité immédiate).
- **Dérivés en `useMemo`** plutôt que dupliqués dans l'état : une seule source
  de vérité, pas de désynchronisation.
- **Suppression du code mort** (≈ 600 lignes dans le file-manager, 8 composants
  de template dans la wallet) plutôt que de le laisser dormir.
- **Préservation stricte** du module carburant existant (OCR, bulk-delete,
  saisie) : améliorer sans casser.

## 5. Décisions UX

- **États systématiques** loading / error / empty : l'utilisateur n'est jamais
  devant un écran vide inexpliqué.
- **Retour immédiat** : recherche instantanée, tri au clic, favoris optimistes.
- **Hiérarchie visuelle** : KPIs en tête, graphes ensuite, table détaillée en
  bas ; badges colorés selon des seuils (consommation, statut).
- **Cohérence** : les cinq pages partagent couleurs, cartes, typographie et
  espacements — l'ensemble se lit comme **une seule application**.

## 6. Bénéfices

- Des pages **réellement utilisables** et connectables à un backend, pas des
  maquettes.
- **Maintenabilité** : modèles typés, composants réutilisables, patron
  reproductible documenté (`developer-guide.md`).
- **Qualité vérifiée** : `tsc` et `vite build` verts, cinq pages testées dans
  le navigateur sans erreur console, aucune régression.
- **Valeur métier** : analyse carburant, pilotage de projets, GED, trésorerie
  et self-service FAQ — des outils qui servent l'exploitation.

## 7. Perspectives

- Brancher les services mock (projets, GED, trésorerie) sur de vrais
  microservices quand ils existeront (agrégations Finance/Fleet/Maintenance
  déjà identifiées).
- Relier le formulaire FAQ au module Support (création de ticket).
- Envisager du code-splitting pour réduire la taille des bundles (avertissement
  Vite, non bloquant).
