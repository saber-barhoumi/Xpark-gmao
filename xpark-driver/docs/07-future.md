# Évolutions & extensions — XPARK Driver

Pistes documentées pour la suite (rapport PFE + développement futur), classées
par valeur.

## 1. Lien Utilisateur ↔ Employee (fiabiliser les missions du chauffeur)

**Aujourd'hui** : `GET /api/missions/driver` filtre par `ChauffeurNom` (nom
dénormalisé). **Limite** : fragile aux homonymes / changements de nom.
**Évolution** : ajouter une colonne `Utilisateur.EmployeeId` (ou
`Employee.UtilisateurId`), la renseigner à la création des comptes chauffeurs,
mettre l'`EmployeeId` dans le JWT, et filtrer les missions par identifiant.
Impact : une migration DB + 1 claim JWT + 1 ligne de filtre. Aucune UI à changer.

## 2. Temps réel par SignalR (push au lieu de polling)

**Aujourd'hui** : le Front Office interroge `/live` toutes les 5 s.
**Évolution** : un hub SignalR (Chat.API en héberge déjà un) où le `ping`
publie la position et le client est notifié instantanément. Latence quasi nulle,
moins de requêtes. L'app pousse toujours via REST ; seul le canal
backend→client change. Documenté dans [decisions.md](02-decisions.md) (ADR-4).

## 3. File d'attente hors-ligne

**Évolution** : si le réseau tombe, stocker les positions localement (SQLite /
AsyncStorage) et les rejouer à la reconnexion → aucune perte de trace sur les
zones sans couverture. `src/tracking/locationTask.ts` est le seul point à
enrichir.

## 4. Navigation turn-by-turn

**Évolution** : bouton « Ouvrir dans Google Maps / Waze » (deep link) pour le
guidage vocal, tout en gardant le suivi XPARK en arrière-plan. Simple et très
utile pour les chauffeurs.

## 5. Boîtier GPS véhicule (au lieu du téléphone)

**Évolution** : un traceur embarqué qui POST directement `/tracking/ping`.
L'architecture est déjà prête : le backend et la carte client ne changent pas
(même endpoint, même table). L'app mobile reste utile pour missions/statuts.

## 6. Preuve de livraison (POD)

**Évolution** : à l'arrivée, capture photo + signature du destinataire, envoyées
au backend et jointes à la mission. Nouvel écran + endpoint d'upload.

## 7. Notifications push

**Évolution** : `expo-notifications` — prévenir le chauffeur d'une nouvelle
mission affectée, d'un changement, ou d'un rappel. Nécessite un service d'envoi
(Expo Push) côté backend.

## 8. Statistiques & gamification

**Évolution** : score de ponctualité, éco-conduite (à partir de la vitesse/cap
déjà collectés), classement — motivant pour les chauffeurs et exploitable par la
direction dans le Back Office Analyses.

## 9. Internationalisation (i18n)

**Évolution** : l'app est en français ; extraire les libellés et ajouter arabe
(tounsi) / anglais, cohérent avec le reste de l'écosystème XPARK (le Front Office
et l'assistante Ayshaa sont déjà trilingues).
