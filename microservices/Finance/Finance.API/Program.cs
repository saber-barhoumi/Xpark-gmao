using System.Text;
using Finance.Infrastructure;
using Finance.Infrastructure.Data;
using Finance.Application.Mapping;
using Finance.API.Middleware;
using Finance.Application.Interfaces;
using Finance.Infrastructure.Repositories;
using Finance.Application.Interfaces;
using Finance.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Database – shared xpark_gmao (monolith manages migrations)
// Couche Infrastructure (DbContext + repositories + services)
builder.Services.AddFinanceInfrastructure(builder.Configuration);

builder.Services.AddAutoMapper(typeof(FinanceProfile));

// Repositories & Services

// JWT
// La clé de signature ne figure plus dans appsettings.json (fichier versionné) :
// elle vient de l'environnement. Sans elle, on échouait sur une
// NullReferenceException opaque au démarrage — d'où ce contrôle explicite.
// 32 caractères est le minimum imposé par HMAC-SHA256.
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException(
        "Configuration manquante : Jwt__Key doit être défini et faire au moins " +
        "32 caractères. Renseignez JWT_KEY dans le fichier .env " +
        "(voir .env.example).");
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

// ─── CORS ───────────────────────────────────────────────────────────
// En production, définir CORS_ORIGINS (domaines séparés par des virgules) pour
// n'autoriser que le back-office et le portail client. Sans cette variable — le
// cas sur un poste de développement — toutes les origines restent acceptées.
var originesCors = (builder.Configuration["CORS_ORIGINS"] ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(opt => opt.AddPolicy("XparkCors", p =>
{
    if (originesCors.Length == 0)
        p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    else
        p.WithOrigins(originesCors).AllowAnyMethod().AllowAnyHeader();
}));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Finance.API", Version = "v1" });
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

app.UseSerilogRequestLogging();
app.UseCors("XparkCors");
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "Finance.API" }));

app.Run();
