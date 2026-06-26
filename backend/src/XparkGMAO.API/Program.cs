using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using FluentValidation.AspNetCore;
using XparkGMAO.Infrastructure.Data;
using XparkGMAO.Infrastructure.Data.Seeders;
using XparkGMAO.Infrastructure.Repositories;
using XparkGMAO.Infrastructure.Services;
using XparkGMAO.Application.Services;
using XparkGMAO.Application.Mapping;
using XparkGMAO.Core.Config;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.API.Middleware;
using XparkGMAO.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ===== DATABASE =====
builder.Services.AddDbContext<XparkDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== JWT AUTHENTICATION =====
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]
    ?? throw new InvalidOperationException("JWT Secret is not configured"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ClockSkew = TimeSpan.Zero
    };

    // Support JWT token from query string for SignalR WebSocket connections
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                (path.StartsWithSegments("/chatHub") || path.StartsWithSegments("/kanbanHub")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ===== REPOSITORIES =====
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IVehiculeRepository, VehiculeRepository>();
builder.Services.AddScoped<IMissionRepository, MissionRepository>();
builder.Services.AddScoped<IInterventionRepository, InterventionRepository>();
builder.Services.AddScoped<IFactureRepository, FactureRepository>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IChauffeurRepository, ChauffeurRepository>();
builder.Services.AddScoped<IAlertRepository, AlerteRepository>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IDevisRepository, DevisRepository>();
builder.Services.AddScoped<IEquipementRepository, EquipementRepository>();

// ===== SERVICES =====
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IVehiculeService, VehiculeService>();
builder.Services.AddScoped<IMissionService, MissionService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IFacturationService, FacturationService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IAlertService, AlerteService>();
builder.Services.AddScoped<IDailyAlertCheckerService, DailyAlertCheckerService>();
builder.Services.AddHostedService<XparkGMAO.API.Workers.AlertCheckerBackgroundService>();
builder.Services.AddScoped<ReservationService>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<ISourceService, SourceService>();
builder.Services.AddScoped<ICarburantService, CarburantService>();
builder.Services.AddScoped<IKPIService, KPIService>();
builder.Services.AddScoped<IEquipementsService, EquipementsService>();
builder.Services.AddHostedService<XparkGMAO.API.Workers.EquipementAlerteWorker>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();

// ===== EMAIL CONFIG & SERVICES =====
builder.Services.Configure<EmailConfig>(
    builder.Configuration.GetSection("EmailConfig"));
builder.Services.AddScoped<IImapEmailService, ImapEmailService>();
builder.Services.AddScoped<ISmtpEmailSenderService, SmtpEmailSenderService>();

// ===== SIGNALR =====
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.ReferenceHandler =
        System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.PayloadSerializerOptions.DefaultIgnoreCondition =
        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// ===== AUTOMAPPER =====
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// ===== FLUENT VALIDATION =====
builder.Services.AddValidatorsFromAssemblyContaining<XparkGMAO.Application.Validators.CreateVehiculeValidator>();

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// ===== SWAGGER =====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "XPARK GMAO API",
        Version = "v1",
        Description = "API de gestion de flotte automobile avec IA - XPARK GMAO",
        Contact = new OpenApiContact
        {
            Name = "XPARK Team",
            Email = "contact@xpark.tn"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization. Entrez: 'Bearer {votre_token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

var app = builder.Build();

// ===== MIGRATION ET SEEDING =====
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<XparkDbContext>();
        db.Database.Migrate();
        DataSeeder.Seed(db);
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Base de données migrée et données initiales chargées.");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erreur lors de la migration de la base de données.");
    }
}

// ===== MIDDLEWARE PIPELINE =====
app.UseErrorHandling();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "XPARK GMAO API v1");
        c.RoutePrefix = "swagger";
    });
}

// // app.UseHttpsRedirection(); // Désactivé pour le développement local car cela peut bloquer la négociation SignalR via CORS/Redirects // Désactivé pour le développement local afin d'éviter les problèmes de redirection SignalR (HTTP -> HTTPS)
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");
app.MapHub<KanbanHub>("/kanbanHub");

app.Run();
