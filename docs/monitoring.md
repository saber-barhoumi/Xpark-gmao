# Supervision XPARK GMAO

## 1. Demarrer la pile de supervision

La pile de supervision est lancee avec Docker Compose depuis la racine du depot :

```bash
docker compose up -d postgres rabbitmq nginx prometheus grafana
```

Le projet principal reste le service Docker Compose de la plateforme XPARK. Les services de supervision sont declarés dans la même configuration, ce qui permet de les lancer en meme temps sans creer d'architecture fictive.

## 2. Acces aux outils

- Prometheus : http://localhost:9090
- Grafana : http://localhost:3005
- Portail XPARK : http://localhost:8080

## 3. Configuration Grafana

Grafana utilise automatiquement la source de donnees Prometheus par provisionnement. Le fichier de configuration est accessible dans `monitoring/grafana/provisioning/datasources/datasource.yml`.

Les identifiants par defaut sont :

- utilisateur : `admin`
- mot de passe : `changeme`

Il est recommande de remplacer ces valeurs par des variables d'environnement `GRAFANA_ADMIN_USER` et `GRAFANA_ADMIN_PASSWORD` dans le fichier `.env` de la racine.

## 4. Tableaux de bord disponibles

Le dashboard provisionne est :

- `XPARK monitoring overview`

Il monitore la disponibilite des cibles XPARK et l'etat des services obtenus via les endpoints `/health` et `/metrics`.

## 5. Metriques collectees

Les metriques realistes collectees par la pile sont :

- disponibilite des services via `up{job="xpark-health"}`
- etat de santhe de `Ayshaa-RAG` via `up{job="xpark-ayshaa"}`
- end points de controle `/health` exposes par les services .NET
- endpoint `/metrics` expose par Ayshaa-RAG

La plateforme ne declare pas de `/metrics` pour les services .NET ; la supervision s'appuie donc sur les points de control de sante reels existants dans le code.

## 6. Verification du fonctionnement

Dans l'interface Prometheus :

1. ouvrir la page `Status > Targets`
2. verifier que les cibles `xpark-health` et `xpark-ayshaa` sont en etat `UP`
3. utiliser des requetes du type `up` et `rate` pour valider les donnees

Dans Grafana :

1. ouvrir le dashboard `XPARK monitoring overview`
2. confirmer que les panneaux sont alimentes par Prometheus
3. verifier que les services sont visibles et que les cibles sont `UP`

## 7. Depannage frequent

- `Target down` : verifier que le service concerné est lance et accessible sur le reseau Docker ; par exemple `docker compose ps`
- `Grafana ne charge pas` : verifier l'authentification et la presence de la source de donnees Prometheus
- `Prometheus ne scrute pas` : verifier que le nom du service et le port dans `monitoring/prometheus.yml` correspondent aux conteneurs Docker
- `ngrok` ou acces public : la supervision est locale; pour une mise en ligne publique il faut configurer la passerelle externe et les secrets correspondants du serveur cible

## 8. Arret et redemarrage

```bash
docker compose stop prometheus grafana
docker compose start prometheus grafana
```

ou :

```bash
docker compose down
docker compose up -d
```

## 9. Points de vigilance

- Le projet n'a pas de telemetry Prometheus native pour l'ensemble des services .NET ; le monitoring est donc centré sur les endpoints de santhe et sur les metriques dites par Ayshaa-RAG.
- Le deploiement public est une configuration externe, pas un service auto-heberge par GitHub Actions sans runner et secrets appropries.
