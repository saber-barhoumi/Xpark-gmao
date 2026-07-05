using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Mission.API.Data;
using Mission.API.Mapping;
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
