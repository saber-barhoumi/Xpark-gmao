using System.Text;
using FluentValidation;
using IAM.API.Data;
using IAM.API.Mapping;
using IAM.API.Middleware;
using IAM.API.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using XparkGMAO.Shared.Events;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ──────────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// ─── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<IamDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── AutoMapper ───────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(IamProfile));

// ─── FluentValidation ─────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IMfaService, MfaService>();
builder.Services.AddHttpContextAccessor();

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        // Les jetons MFA "pending" (emis apres le mot de passe, avant le 2e facteur)
        // sont signes avec la meme cle : on les rejette explicitement pour qu'ils
        // ne passent JAMAIS un [Authorize] — seul /auth/mfa/verify les accepte
        // via une validation manuelle dediee.
        opt.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                if (ctx.Principal?.FindFirst("token_use")?.Value == "mfa_pending")
                    ctx.Fail("Jeton MFA pending — 2e facteur requis.");
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// ─── MassTransit / RabbitMQ ───────────────────────────────────────────────────
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Host"], "/", h =>
        {
            h.Username(builder.Configuration["RabbitMQ:Username"]!);
            h.Password(builder.Configuration["RabbitMQ:Password"]!);
        });
        cfg.ConfigureEndpoints(ctx);
    });
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opt => opt.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// ─── Controllers & Swagger ────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IAM.API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.ApiKey,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── MFA & Security tables (FICHE Authentication & Security) — idempotent ────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IamDbContext>();
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""UserMfaSettings"" (
            ""Id"" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""UserId"" BIGINT NOT NULL UNIQUE,
            ""AuthenticatorEnabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""AuthenticatorSecret"" TEXT NULL,
            ""EmailOtpEnabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DefaultMethod"" VARCHAR(30) NOT NULL DEFAULT 'AUTHENTICATOR',
            ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT now(),
            ""UpdatedAt"" TIMESTAMPTZ NOT NULL DEFAULT now());
        CREATE TABLE IF NOT EXISTS ""EmailOtps"" (
            ""Id"" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""UserId"" BIGINT NOT NULL,
            ""CodeHash"" TEXT NOT NULL,
            ""ExpiryTime"" TIMESTAMPTZ NOT NULL,
            ""IsUsed"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""UsedAt"" TIMESTAMPTZ NULL,
            ""Attempts"" INT NOT NULL DEFAULT 0,
            ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT now());
        CREATE INDEX IF NOT EXISTS ""IX_EmailOtps_UserId_CreatedAt"" ON ""EmailOtps"" (""UserId"", ""CreatedAt"");
        CREATE TABLE IF NOT EXISTS ""LoginHistory"" (
            ""Id"" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""UserId"" BIGINT NOT NULL,
            ""LoginMethod"" VARCHAR(30) NOT NULL,
            ""MfaMethod"" VARCHAR(30) NULL,
            ""IpAddress"" VARCHAR(64) NULL,
            ""UserAgent"" VARCHAR(500) NULL,
            ""IsSuccessful"" BOOLEAN NOT NULL,
            ""FailureReason"" VARCHAR(255) NULL,
            ""LoggedInAt"" TIMESTAMPTZ NOT NULL DEFAULT now());
        CREATE INDEX IF NOT EXISTS ""IX_LoginHistory_UserId_LoggedInAt"" ON ""LoginHistory"" (""UserId"", ""LoggedInAt"");
        CREATE TABLE IF NOT EXISTS ""AuthAuditLogs"" (
            ""Id"" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""UserId"" BIGINT NULL,
            ""Action"" VARCHAR(80) NOT NULL,
            ""Description"" TEXT NULL,
            ""IpAddress"" VARCHAR(64) NULL,
            ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT now());
        CREATE INDEX IF NOT EXISTS ""IX_AuthAuditLogs_UserId_CreatedAt"" ON ""AuthAuditLogs"" (""UserId"", ""CreatedAt"");
    ");
}
// ─────────────────────────────────────────────────────────────────────────────

// Monolith owns all migrations — IAM.API is a read/write consumer of the shared DB.
// No db.Database.Migrate() call here.

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "IAM.API" }));

app.Run();
