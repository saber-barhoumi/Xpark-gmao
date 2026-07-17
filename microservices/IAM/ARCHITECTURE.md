# IAM — Clean Architecture

> Premier microservice XPARK migré en Clean Architecture (juillet 2026).
> **Aucune fonctionnalité modifiée** : mêmes routes, mêmes contrats JSON, même
> schéma de base, même comportement JWT/MFA — seul le code a été réorganisé en
> couches. Vérifié après migration : build 0 erreur, image Docker, login admin
> et client, profil, user-management, employés, MFA, historique de connexions,
> RBAC (401 sans jeton), fichiers statiques /uploads, chaîne backoffice :3000.

## 1. Structure

```
microservices/IAM/
├── IAM.Domain/                ← cœur métier (ne dépend de rien*)
│   └── Entities/              Utilisateur (+TPH Client/Chauffeur), Employee,
│                              entités MFA (TotpSecret, EmailOtp, LoginHistory, AuthAuditLog)
│
├── IAM.Application/           ← cas d'usage (dépend du Domain uniquement)
│   ├── DTOs/                  contrats d'entrée/sortie de l'API (Auth, User,
│   │                          Employee, Client, Chauffeur, Admin)
│   ├── Interfaces/            IAuthService, IUserService, IEmployeeService,
│   │                          IClientService, IJwtService, IEmailService, IMfaService
│   └── Mapping/               IamProfile (AutoMapper entités ⇄ DTOs)
│
├── IAM.Infrastructure/        ← détails techniques (implémente l'Application)
│   ├── Data/                  IamDbContext (EF Core / PostgreSQL partagé)
│   ├── Services/              AuthService, UserService, EmployeeService,
│   │                          ClientService, JwtService, TotpService,
│   │                          MfaService, EmailService (MailKit)
│   ├── EmailTemplates/        gabarit HTML XPARK + logo (copiés au publish)
│   └── DependencyInjection.cs AddIamInfrastructure(config)
│
└── IAM.API/                   ← présentation (dépend d'Application + Infrastructure)
    ├── Controllers/           Auth, Users, UserManagement, Employees, Clients
    ├── Middleware/            ErrorHandlingMiddleware (erreurs → JSON propre)
    ├── Program.cs             pipeline HTTP, JWT bearer, Swagger, CORS,
    │                          MassTransit, bootstrap schéma audit
    └── Dockerfile             build multi-étages 4 projets
```

\* concession pragmatique : `XparkGMAO.Shared` (enums transverses du système —
`TypeUtilisateur`, statuts…) car la base PostgreSQL est **partagée** entre
microservices ; ces enums sont le vocabulaire commun du système.

## 2. Flux de dépendances (vers l'intérieur)

```
IAM.API ──────────► IAM.Application ────► IAM.Domain
   │                      ▲
   └──► IAM.Infrastructure┘        (Infrastructure implémente les interfaces
                                    de l'Application ; l'API ne référence
                                    l'Infrastructure QUE pour AddIamInfrastructure)
```

- Les contrôleurs n'injectent **que des interfaces** (`IAuthService`…) — ils ne
  connaissent aucune classe concrète.
- `DependencyInjection.cs` est l'**unique point de câblage** : DbContext +
  7 services. `Program.cs` appelle `AddIamInfrastructure(builder.Configuration)`.

## 3. Flux d'une requête (ex. login avec MFA)

```
POST /api/auth/login
  → AuthController (API)            valide le modèle, extrait IP/User-Agent
  → IAuthService (Application)      contrat
  → AuthService (Infrastructure)    vérifie BCrypt, verrouillage, appelle
  → IMfaService                     méthodes MFA actives ?
       oui → jeton "mfa_pending" (rejeté par [Authorize] via OnTokenValidated)
             + envoi OTP email (IEmailService/MailKit, gabarit XPARK)
       non → IJwtService            émet le JWT final (claims userId/role/nom)
  → IamDbContext (Infrastructure)   historique de connexion + audit
  ← AuthResponseDto (Application)   même contrat JSON qu'avant la migration
```

## 4. Pourquoi chaque code est là (décisions)

| Code | Couche | Raison |
|---|---|---|
| Entités (Utilisateur, MFA…) | Domain | modèle métier persistant, zéro dépendance technique |
| DTOs | Application | contrats des cas d'usage — l'API les expose, l'Infrastructure les remplit |
| Interfaces de services | Application | le « quoi » appartient aux cas d'usage ; le « comment » est un détail |
| Implémentations de services | Infrastructure | elles dépendent d'EF Core, BCrypt, MailKit, QRCoder, JWT — des détails techniques (pas de couche repository introduite : les services utilisaient déjà le DbContext directement — en créer une aurait été une réécriture, contraire à l'objectif) |
| IamDbContext | Infrastructure | EF Core = détail de persistance |
| JwtService/TotpService | Infrastructure | cryptographie et formats de jetons = détails |
| EmailTemplates | Infrastructure | ressource du service d'email ; `Content CopyToOutputDirectory` les propage jusqu'au publish de l'API (chemin résolu via `AppContext.BaseDirectory`, inchangé) |
| Contrôleurs, middleware, Program | API | frontière HTTP |
| MassTransit (Program) | API | configuration d'hôte ; `IPublishEndpoint` consommé par l'Infrastructure via le package `MassTransit` (abstractions) |

Cas particulier : `IMfaService` était déclaré **dans** `MfaService.cs` — il a
été extrait vers `Application/Interfaces` (une interface de cas d'usage ne vit
pas dans un fichier d'implémentation).

## 5. Astuce de migration sans réécriture

Les services historiques comptaient sur les *implicit usings* du SDK Web
(`IConfiguration`, `ILogger<>`…). Plutôt que d'éditer chaque fichier,
`IAM.Infrastructure.csproj` déclare :

```xml
<FrameworkReference Include="Microsoft.AspNetCore.App" />
<Using Include="IAM.Application.Interfaces" />
<Using Include="Microsoft.Extensions.Configuration" />
<Using Include="Microsoft.Extensions.Logging" />
```

→ le code déplacé compile **à l'identique** (zéro modification de logique).

## 6. Intégrations préservées

- **JWT partagé** : mêmes clés/issuer/audience — les jetons IAM restent valides
  pour Mission/Fleet/Finance/Chat (aucun autre service touché).
- **RabbitMQ/MassTransit** : publication d'événements (`XparkGMAO.Shared.Events`)
  inchangée.
- **Base partagée** : aucun changement de schéma ; le bootstrap SQL idempotent
  (AuthAuditLogs) reste dans Program.cs.
- **/uploads statiques** : UseStaticFiles + volume `./data/uploads` inchangés.
- **Docker** : contexte `./microservices` conservé ; seul le chemin du
  Dockerfile change dans docker-compose (`IAM/IAM.API/Dockerfile`), restore en
  couches pour un cache optimal.

## 7. Vérifications effectuées (protocole de migration)

| Vérification | Résultat |
|---|---|
| `dotnet build` Release | ✅ 0 erreur |
| `docker compose build iam-api` | ✅ |
| /health | ✅ healthy |
| Login admin + client | ✅ 200 (JWT valide) |
| /api/auth/profile · /user-management · /employees · /mfa/settings · /security/login-history | ✅ 200 |
| RBAC sans jeton | ✅ 401 |
| Chaîne backoffice :3000 (nginx → gateway → IAM) | ✅ 200 |
| Statiques /uploads | ✅ route active |
| Logs conteneur | ✅ aucune erreur |
