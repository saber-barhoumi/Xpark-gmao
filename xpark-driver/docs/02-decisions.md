# Décisions techniques (ADR) — XPARK Driver

Chaque décision : contexte → alternatives → choix → conséquences.

## ADR-1 — Expo (React Native) + TypeScript

**Contexte** : app mobile pour chauffeurs, GPS temps réel y compris en
arrière-plan, à intégrer à XPARK (React/TS partout).
**Alternatives** :
- *React Native « bare »* : plus de configuration native (Xcode/Gradle,
  modules de localisation à câbler à la main).
- *Flutter* : excellent, mais langage Dart → ne réutilise pas les compétences
  React/TS ni le code/typage partagé avec XPARK.
- *PWA (web mobile)* : pas de GPS **arrière-plan** fiable, pas de service de
  premier plan Android → éliminatoire pour du suivi de livraison.
**Choix** : **Expo**. Fournit `expo-location` + `expo-task-manager` (GPS
arrière-plan clé en main), `react-native-maps`, build EAS, et Expo Router
(routage par fichiers familier). TypeScript pour la robustesse.
**Conséquences** : itération rapide (Expo Go), une seule base pour Android/iOS,
et le chemin de mise en production est documenté (EAS Build + clé Google Maps).

## ADR-2 — Expo Router (routage par fichiers)

**Alternatives** : React Navigation configuré à la main.
**Choix** : Expo Router — même modèle mental que Next.js (déjà utilisé dans le
Front Office XPARK), moins de code de configuration, liens typés.
**Conséquences** : structure `app/` lisible, redirections et gardes d'auth
simples (`<Redirect>`).

## ADR-3 — Suivi GPS via une tâche d'arrière-plan (task-manager)

**Contexte** : le chauffeur ne garde pas l'app au premier plan en conduisant ;
la position doit continuer d'être envoyée écran verrouillé.
**Alternatives** : `watchPositionAsync` au premier plan seulement (s'arrête en
arrière-plan) → insuffisant.
**Choix** : `Location.startLocationUpdatesAsync` + `TaskManager.defineTask`,
avec **foreground service** Android et `UIBackgroundModes: location` iOS.
**Conséquences** : la tâche s'exécute hors du contexte React → la configuration
active (jeton, mission, véhicule) est persistée en **AsyncStorage** et relue par
la tâche. Voir [gps-tracking.md](04-gps-tracking.md).

## ADR-4 — Transport REST (ping/live), pas de WebSocket pour le MVP

**Contexte** : envoyer la position et la lire côté client.
**Alternatives** : SignalR/WebSocket (push temps réel).
**Choix** : **REST** — `POST /tracking/ping` (écriture) + `GET .../live`
(lecture, le Front Office interroge déjà en boucle). Plus simple, robuste sur
réseau mobile intermittent, aucune infrastructure temps réel à ajouter.
**Conséquences** : latence d'affichage ≈ intervalle de polling (5 s), largement
suffisant pour un camion. Migration SignalR documentée comme évolution.

## ADR-5 — Session via expo-secure-store

**Alternatives** : AsyncStorage (non chiffré).
**Choix** : `expo-secure-store` (Keychain iOS / Keystore Android) pour le jeton
JWT → « se souvenir de la session » sûr.
**Conséquences** : le chauffeur reste connecté entre les ouvertures ; `logout`
efface le jeton **et** arrête le suivi GPS.

## ADR-6 — Résolution des missions par nom (temporaire)

**Contexte** : le compte de connexion (`Chauffeur : Utilisateur`) et la fiche RH
(`Employee`, référencée par `Mission.EmployeeId`) ne sont pas liés par une clé
étrangère ; la mission stocke un `ChauffeurNom` dénormalisé.
**Choix** : `GET /api/missions/driver` filtre par `ChauffeurNom == prénom+nom`
(claims du JWT).
**Conséquences** : fonctionne avec les données actuelles. **Évolution
recommandée** : ajouter `Utilisateur.EmployeeId` (ou `Employee.UtilisateurId`)
et filtrer par identifiant — voir [future.md](07-future.md).

## ADR-7 — Nom de dossier `xpark-driver` (sans espace)

**Contexte** : le nom voulu est « XPARK Driver ».
**Choix** : dossier `xpark-driver` (kebab-case). Les outils React Native / Metro
/ EAS gèrent mal les espaces dans les chemins.
**Conséquences** : le **nom affiché** de l'app reste « XPARK Driver »
(`app.json → expo.name`).

## ADR-8 — Cartes : react-native-maps + itinéraire OSRM

**Choix** : `react-native-maps` (Google Maps sur Android, Apple Maps sur iOS) et
itinéraire réel via **OSRM** (même service que le Front Office), avec repli
ligne directe.
**Conséquences** : rendu natif fluide ; en production Android il faut une **clé
Google Maps** (documentée dans [installation.md](06-installation.md)).
