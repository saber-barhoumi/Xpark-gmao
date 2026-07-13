# Installation, configuration, exécution & test

## 1. Prérequis

- Node.js 18+ et npm
- L'application **Expo Go** sur le téléphone (Android/iOS), ou un émulateur
  Android Studio / simulateur iOS
- Le backend XPARK GMAO démarré (`docker compose up -d`) sur le PC
- Téléphone et PC sur le **même réseau Wi-Fi**

## 2. Installation

```bash
cd xpark-driver
npm install
```

## 3. Configuration réseau (l'étape à ne pas rater)

```bash
cp .env.example .env
```

Éditer `.env` et remplacer l'IP par celle du PC qui héberge XPARK :

```
EXPO_PUBLIC_IAM_API_URL=http://192.168.1.20:5001/api
EXPO_PUBLIC_MISSION_API_URL=http://192.168.1.20:5003/api
```

- Trouver l'IP du PC : `ipconfig` (Windows) → « Adresse IPv4 » (ex. 192.168.1.20).
- **Émulateur Android** : utiliser `10.0.2.2` au lieu de l'IP (alias vers le
  localhost du PC).
- Vérifier que le pare-feu Windows autorise les ports 5001 et 5003 sur le réseau
  privé.

> Pourquoi : sur le téléphone, `localhost` désigne le téléphone lui-même. Il faut
> l'adresse réseau du PC pour joindre les API.

## 4. Lancer

```bash
npx expo start
```

- Scanner le QR code avec **Expo Go** (Android) / l'appareil photo (iOS), ou
- appuyer `a` (émulateur Android) / `i` (simulateur iOS).

## 5. Comptes chauffeur de test

Comptes existants (rôle CHAUFFEUR) : `sami.hamdi@xpark.tn`,
`nizar.gharbi@xpark.tn`, `riadh.maaloul@xpark.tn`. Le mot de passe est défini
côté XPARK (demander au gestionnaire ou le réinitialiser via le flux habituel).

Pour un test de bout en bout, une mission doit avoir `ChauffeurNom` = « Prénom
Nom » du compte (ex. « Sami Hamdi ») pour apparaître dans **Mes missions**.

## 6. Tester la boucle complète

1. Se connecter dans l'app avec un compte chauffeur.
2. Ouvrir une mission EN_COURS → **Navigation** → **Démarrer la mission**.
3. Se déplacer (ou simuler un itinéraire sur l'émulateur).
4. Sur un navigateur, ouvrir le Front Office client `/account/tracking` de cette
   mission → le camion apparaît à la position réelle, badge **« GPS en direct »**.

Vérification API directe :
```bash
# dernière position reçue
curl http://192.168.1.20:5003/api/tracking/mission/28/live -H "Authorization: Bearer <token>"
```

## 7. Vers la production

- **Clé Google Maps (Android)** : nécessaire pour `react-native-maps` en build
  autonome. L'ajouter dans `app.json` :
  `android.config.googleMaps.apiKey`. iOS utilise Apple Maps (aucune clé).
- **Build** : `eas build` (Expo Application Services) pour générer l'APK/IPA.
- **HTTPS** : exposer les API derrière la passerelle nginx en HTTPS ; Android
  bloque le HTTP en clair en production (ajouter une exception réseau si besoin
  en interne).

## 8. Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| « Réseau indisponible » au login | mauvaise IP dans `.env` | mettre l'IP LAN du PC, pas localhost |
| Aucune mission listée | `ChauffeurNom` ≠ nom du compte | aligner le nom (voir §5) ou implémenter le lien Utilisateur↔Employee |
| Le camion ne bouge pas côté client | suivi non démarré / position > 60 s | appuyer « Démarrer la mission » ; vérifier `/live` |
| Carte grise (Android build) | clé Google Maps manquante | ajouter la clé (voir §7) |
