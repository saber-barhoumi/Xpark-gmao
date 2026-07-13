# Les écrans — XPARK Driver

Pour chaque écran : **ce qu'il fait / pourquoi / comment / comment tester**.

## 1. Login — `app/login.tsx`

- **Quoi** : connexion du chauffeur (email + mot de passe XPARK).
- **Pourquoi** : accès sécurisé ; vérifie que le compte est bien un chauffeur.
- **Comment** : `AuthContext.signIn` → `IAM.API /auth/login` → JWT décodé
  (identité, rôle) → stocké en SecureStore. Refuse la MFA (compte terrain).
- **Tester** : saisir un compte chauffeur → arrive au Dashboard. Mauvais mot de
  passe → message d'erreur. Rouvrir l'app → toujours connecté (session mémorisée).

## 2. Dashboard — `app/(tabs)/index.tsx`

- **Quoi** : écran principal ; salutation, véhicule courant, mission active
  (statut, distance, départ, client), compteurs (en attente / en cours /
  terminées), accès rapide à la navigation et aux détails.
- **Pourquoi** : donner l'essentiel en un coup d'œil, sans friction.
- **Comment** : `useMissions` charge `GET /missions/driver` ; la mission active
  = première EN_COURS sinon EN_ATTENTE. Tirer pour rafraîchir.
- **Tester** : avec une mission EN_COURS assignée, la carte « Mission #… »
  apparaît ; le bouton **Naviguer** ouvre la carte.

## 3. Mes missions — `app/(tabs)/missions.tsx`

- **Quoi** : liste de toutes les missions, filtrable (Toutes / En attente / En
  cours / Terminées).
- **Pourquoi** : le chauffeur retrouve et ouvre n'importe quelle mission.
- **Comment** : même source (`useMissions`) + filtre local ; chaque ligne ouvre
  les détails.
- **Tester** : changer de filtre → la liste et les compteurs s'ajustent.

## 4. Détails mission — `app/mission/[id].tsx`

- **Quoi** : trajet (enlèvement/livraison/distance/départ), client &
  marchandises, véhicule, timeline (confirmée → affecté → départ → livraison),
  bouton **Démarrer la navigation**.
- **Pourquoi** : toutes les infos d'une mission avant de partir.
- **Comment** : retrouve la mission par `id` dans la liste chargée.
- **Tester** : ouvrir une mission → vérifier les sections ; la timeline reflète
  le statut.

## 5. Navigation — `app/navigation/[id].tsx` ★

- **Quoi** : **carte interactive** avec la position GPS temps réel du téléphone,
  la destination, l'itinéraire, la distance restante, la vitesse, l'ETA, et le
  bouton **Démarrer / Terminer le suivi**.
- **Pourquoi** : c'est le pont GPS ; démarrer le suivi envoie la position à
  XPARK → le client voit le camion bouger.
- **Comment** : `expo-location.watchPositionAsync` pour l'affichage ; l'itinéraire
  via OSRM (`src/tracking/route.ts`) ; **Démarrer** appelle
  `startTracking(mission, véhicule, jeton)` (tâche d'arrière-plan). Détails :
  [gps-tracking.md](04-gps-tracking.md).
- **Tester** : accorder la localisation → le camion apparaît et suit vos
  déplacements ; **Démarrer la mission** → bandeau « Suivi actif » ; vérifier
  côté backend que `GET /tracking/mission/{id}/live` renvoie votre position.

## 6. Profil — `app/(tabs)/profile.tsx`

- **Quoi** : identité chauffeur, véhicule courant, statistiques (missions
  livrées, km parcourus, total).
- **Comment** : identité depuis la session ; stats calculées depuis les missions.
- **Tester** : le nombre de missions livrées et les km correspondent à
  l'historique.

## 7. Réglages — `app/(tabs)/settings.tsx`

- **Quoi** : langue, notifications, infos compte, **déconnexion**.
- **Comment** : `signOut` efface la session et **arrête le suivi GPS**.
- **Tester** : se déconnecter → retour au Login ; le suivi éventuel s'arrête.
