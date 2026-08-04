# Diagrammes `backend/`

Ce dossier est **vide de diagrammes**, volontairement.

## Pourquoi

L'arborescence demandee prevoit un dossier `backend/`. Le depot contient bien
un dossier `backend/` et le fichier `docker-compose.yml` declare un service
`backend` (publie sur le port 5000, construit depuis `./backend/src`), mais :

```
backend/
└── src/
    └── XparkGMAO.API/
        └── wwwroot/
            └── uploads/     (vide)
```

**`backend/src` ne contient plus aucun fichier source** — ni `.cs`, ni
`.csproj`, ni `Dockerfile` versionne. Le monolithe d'origine a ete decoupe en
huit microservices ; seul le dossier de televersement a survecu.

Le conteneur `xpark-backend` fonctionne encore sur la machine de developpement
parce que son image a ete construite avant la suppression des sources, mais
elle **n'est plus reproductible depuis le depot**.

## Ce qui en depend encore

Une seule chose : le nginx du back-office declare

```
location /kanbanHub  ->  /backend/kanbanHub
```

c'est-a-dire le canal temps reel du tableau Kanban, encore servi par
l'ancien monolithe. C'est signale dans
[`../infrastructure/signalr-topology.puml`](../infrastructure/signalr-topology.puml).

## Consequence

Conformement a la consigne « ne rien inventer », aucun diagramme de classes,
d'entites ou de sequence n'est genere pour ce service : il n'y a pas de code a
analyser. Les diagrammes de la plateforme le representent comme une boite
opaque, sans detail interne.

Si les sources sont restaurees, relancer la generation les prendra en compte.
