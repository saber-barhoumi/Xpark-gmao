using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PredictionPanne.Infrastructure;
using PredictionPanne.Infrastructure.Data;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Couche Infrastructure (DbContext + moteur de prédiction + service)
builder.Services.AddPredictionPanneInfrastructure(builder.Configuration);

// JWT — même clé partagée que les autres services du système
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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PredictionPanne.API", Version = "v1" });
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

// ── Schéma : SQL brut idempotent, convention du projet ───────────────────────
// Le système n'utilise pas les migrations EF (voir Mission.API/Program.cs) :
// chaque service crée ses propres tables de façon idempotente au démarrage.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PredictionDbContext>();
    try
    {
        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "PredictionsPanne" (
                "IdPrediction"               BIGSERIAL PRIMARY KEY,
                "VehiculeId"                 BIGINT       NOT NULL,
                "TypePanne"                  VARCHAR(30)  NOT NULL,
                "NiveauRisque"               VARCHAR(20)  NOT NULL,
                "Probabilite"                DOUBLE PRECISION NOT NULL DEFAULT 0,
                "ScoreConfiance"             DOUBLE PRECISION NOT NULL DEFAULT 0,
                "DatePanneEstimee"           TIMESTAMPTZ  NULL,
                "DateMaintenanceRecommandee" TIMESTAMPTZ  NULL,
                "DureeVieRestanteJours"      INTEGER      NULL,
                "KilometrageRestant"         DOUBLE PRECISION NULL,
                "PieceARemplacer"            TEXT         NULL,
                "Explication"                TEXT         NOT NULL DEFAULT '',
                "Recommandation"             TEXT         NOT NULL DEFAULT '',
                "Source"                     VARCHAR(20)  NOT NULL DEFAULT 'REGLES',
                "VersionModele"              VARCHAR(50)  NOT NULL DEFAULT 'regles-v1',
                "DateCalcul"                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                "Realisee"                   BOOLEAN      NULL,
                "DateVerification"           TIMESTAMPTZ  NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_PredictionsPanne_Vehicule_Date"
                ON "PredictionsPanne" ("VehiculeId", "DateCalcul");
            """);
        Log.Information("Schéma PredictionsPanne vérifié.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Impossible de vérifier le schéma PredictionsPanne.");
    }
}

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "PredictionPanne.API" }));

app.Run();
