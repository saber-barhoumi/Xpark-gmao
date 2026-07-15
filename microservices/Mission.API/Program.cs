using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Mission.API.Data;
using Mission.API.Mapping;
using Mission.API.Messaging;
using Mission.API.Middleware;
using Mission.API.Repositories;
using Mission.API.Services;
using Mission.API.Startup;
using Serilog;
using XparkGMAO.Shared.AiTelemetry.Extensions;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Database – shared xpark_gmao (monolith manages migrations)
builder.Services.AddDbContext<MissionDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(typeof(MissionProfile));

// Repositories & Services
builder.Services.AddScoped<IMissionRepository, MissionRepository>();
builder.Services.AddScoped<IMissionService, MissionService>();
builder.Services.AddScoped<IHistoricalMigrationService, HistoricalMigrationService>();

// OptimisateurFlotteIA — event-driven flow (RabbitMQ, FICHE §2.3):
// publish xpark.missions.ready-for-optimization / consume xpark.optimization.plan-generated
builder.Services.AddSingleton<OptimizationPlanStore>();
builder.Services.AddSingleton<IOptimizerEventBus, OptimizerEventBus>();
builder.Services.AddScoped<IOptimizationService, OptimizationService>();
builder.Services.AddHostedService<OptimizerPlanConsumer>();

// AI Telemetry — data collector for ML trip-price training dataset
builder.Services.AddAiTelemetry(
    connectionString:   builder.Configuration.GetConnectionString("DefaultConnection")!,
    fleetApiBaseUrl:    builder.Configuration["Services:FleetApi"]   ?? "http://fleet-api:8080/",
    financeApiBaseUrl:  builder.Configuration["Services:FinanceApi"] ?? "http://finance-api:8080/");

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt => opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(opt => opt.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Mission.API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer", BearerFormat = "JWT", In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

var app = builder.Build();

// ── Ensure new Missions columns exist (idempotent) ───────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MissionDbContext>();
    db.Database.ExecuteSqlRaw(@"
        ALTER TABLE ""Missions"" ADD COLUMN IF NOT EXISTS ""VehiculeImmatriculation"" VARCHAR(50);
        ALTER TABLE ""Missions"" ADD COLUMN IF NOT EXISTS ""ChauffeurNom""            VARCHAR(150);
        -- OptimisateurFlotteIA: missions can exist EN_ATTENTE without assignment
        ALTER TABLE ""Missions"" ALTER COLUMN ""EmployeeId"" DROP NOT NULL;
        ALTER TABLE ""Missions"" ALTER COLUMN ""VehiculeId"" DROP NOT NULL;
        ALTER TABLE ""Missions"" ADD COLUMN IF NOT EXISTS ""ClientNom"" VARCHAR(150);

        -- Portail client : tickets de support (feature Support)
        CREATE TABLE IF NOT EXISTS ""SupportTickets"" (
            ""IdTicket""            BIGSERIAL PRIMARY KEY,
            ""ClientIdUtilisateur"" BIGINT       NOT NULL,
            ""ClientNom""           VARCHAR(150) NULL,
            ""Sujet""               VARCHAR(200) NOT NULL,
            ""Categorie""           VARCHAR(50)  NOT NULL DEFAULT 'AUTRE',
            ""Message""             TEXT         NOT NULL,
            ""Statut""              VARCHAR(20)  NOT NULL DEFAULT 'OUVERT',
            ""Reponse""             TEXT         NULL,
            ""MissionId""           BIGINT       NULL,
            ""DateCreation""        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            ""DateMaj""             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ""IX_SupportTickets_Client""
            ON ""SupportTickets"" (""ClientIdUtilisateur"");

        -- XPARK Driver : positions GPS temps réel des chauffeurs (feature tracking)
        CREATE TABLE IF NOT EXISTS ""LivePositions"" (
            ""IdPosition"" BIGSERIAL PRIMARY KEY,
            ""MissionId""  BIGINT           NOT NULL,
            ""DriverId""   BIGINT           NOT NULL,
            ""VehiculeId"" BIGINT           NULL,
            ""Latitude""   DOUBLE PRECISION NOT NULL,
            ""Longitude""  DOUBLE PRECISION NOT NULL,
            ""SpeedKmh""   DOUBLE PRECISION NULL,
            ""Heading""    DOUBLE PRECISION NULL,
            ""Accuracy""   DOUBLE PRECISION NULL,
            ""RecordedAt"" TIMESTAMPTZ      NOT NULL,
            ""ReceivedAt"" TIMESTAMPTZ      NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ""IX_LivePositions_Mission""
            ON ""LivePositions"" (""MissionId"", ""RecordedAt"" DESC);

        -- Portail client : demandes de transport (devis) — étape avant la Mission
        CREATE TABLE IF NOT EXISTS ""TransportRequests"" (
            ""IdTransportRequest""      BIGSERIAL PRIMARY KEY,
            ""ClientIdUtilisateur""     BIGINT       NOT NULL,
            ""ClientNom""               VARCHAR(150) NULL,
            ""DateSouhaitee""           TIMESTAMPTZ  NOT NULL,
            ""VilleDepart""             VARCHAR(100) NOT NULL,
            ""VilleArrivee""            VARCHAR(100) NOT NULL,
            ""CargoDescription""        VARCHAR(500) NOT NULL DEFAULT '',
            ""CargoWeightKg""           DOUBLE PRECISION NOT NULL DEFAULT 0,
            ""PassengerCount""          INT          NOT NULL DEFAULT 1,
            ""VehicleTypeRequested""    VARCHAR(50)  NULL,
            ""DistanceKm""              DOUBLE PRECISION NOT NULL DEFAULT 0,
            ""AiEstimatedPrice""        DOUBLE PRECISION NOT NULL DEFAULT 0,
            ""AiPriceRangeMin""         DOUBLE PRECISION NOT NULL DEFAULT 0,
            ""AiPriceRangeMax""         DOUBLE PRECISION NOT NULL DEFAULT 0,
            ""AiVehicleTypeRecommended"" VARCHAR(50) NULL,
            ""Statut""                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING_QUOTATION',
            ""FinalPrice""              DOUBLE PRECISION NULL,
            ""PricingMethod""           VARCHAR(20)  NULL,
            ""AdminNote""               VARCHAR(1000) NULL,
            ""QuotedByUserId""          BIGINT       NULL,
            ""QuotedByName""            VARCHAR(150) NULL,
            ""DateQuotationEnvoyee""    TIMESTAMPTZ  NULL,
            ""ClientCancelReason""      VARCHAR(500) NULL,
            ""ClientRejectionReason""   VARCHAR(500) NULL,
            ""DateClientReponse""       TIMESTAMPTZ  NULL,
            ""MissionId""               BIGINT       NULL,
            ""DateCreation""            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            ""DateMaj""                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ""IX_TransportRequests_Client""
            ON ""TransportRequests"" (""ClientIdUtilisateur"");
        CREATE INDEX IF NOT EXISTS ""IX_TransportRequests_Statut""
            ON ""TransportRequests"" (""Statut"");
    ");
}
// ─────────────────────────────────────────────────────────────────────────────

// ── AI Telemetry startup sequence ────────────────────────────────────────────
// Step 1: Create AiTripTrainingData table if it does not exist yet (always runs)
app.Services.EnsureAiTelemetryTable();

// Step 2: ONE-TIME historical backfill — comment this out after the first run
//         (safe to leave: idempotent, already-migrated rows are skipped automatically)
await AiHistoricalSeeder.MigrateHistoricalMissionsAsync(app.Services);
// ─────────────────────────────────────────────────────────────────────────────

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "Mission.API" }));

app.Run();
