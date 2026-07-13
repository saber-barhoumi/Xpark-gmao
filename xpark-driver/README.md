# 📱 XPARK Driver

Application mobile des chauffeurs XPARK — pont entre la position réelle du
camion et l'écosystème XPARK GMAO. Le chauffeur se connecte, voit ses missions,
démarre une mission et **son téléphone envoie sa position GPS en temps réel** au
backend → le client voit son camion bouger sur la carte du Front Office.

```
Téléphone chauffeur (GPS) → Mission.API /tracking/ping → carte client Front Office
```

## Technologie

**Expo (React Native) + TypeScript + Expo Router.** Choisi pour : compétences
React/TS réutilisées, seule stack offrant le GPS **arrière-plan**
(`expo-location` + `expo-task-manager`) et une carte native (`react-native-maps`).
Détails et alternatives : [docs/02-decisions.md](docs/02-decisions.md).

## Écrans

Login · Tableau de bord · Mes missions · Détails mission · **Navigation (carte +
GPS)** · Profil · Réglages.

## Démarrage rapide

```bash
cd xpark-driver
npm install
cp .env.example .env      # y mettre l'IP LAN du PC qui héberge XPARK (pas localhost !)
npx expo start            # scanner le QR avec Expo Go, ou 'a' (Android) / 'i' (iOS)
```

⚠️ Sur un vrai téléphone, `localhost` désigne le téléphone : mettre l'IP LAN de
la machine XPARK dans `.env` (ex. `http://192.168.1.20:5003/api`). Émulateur
Android : `10.0.2.2`. Voir [docs/06-installation.md](docs/06-installation.md).

## Documentation

Tout est expliqué dans [`docs/`](docs/README.md) : architecture, décisions,
écrans, GPS/tracking, intégration backend, schéma de données, installation,
test et évolutions.

## Structure

```
xpark-driver/
├── app/                      # écrans (Expo Router, file-based)
│   ├── login.tsx  index.tsx  _layout.tsx
│   ├── (tabs)/               # onglets : dashboard, missions, profile, settings
│   ├── mission/[id].tsx      # détails mission
│   └── navigation/[id].tsx   # carte + GPS temps réel
├── src/
│   ├── theme/                # identité visuelle XPARK
│   ├── api/                  # client HTTP + auth + missions + tracking
│   ├── auth/                 # session (SecureStore)
│   ├── tracking/             # tâche GPS arrière-plan, villes, route OSRM
│   ├── hooks/  components/  types/
├── assets/logo.png           # logo XPARK
└── docs/                     # documentation complète
```
