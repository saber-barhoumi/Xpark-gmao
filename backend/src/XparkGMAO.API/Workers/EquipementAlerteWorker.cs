using XparkGMAO.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace XparkGMAO.API.Workers
{
    public class EquipementAlerteWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EquipementAlerteWorker> _logger;

        public EquipementAlerteWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<EquipementAlerteWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Equipement Alerte Worker démarré.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    var prochainDeclenchement = now.Date.AddDays(1).AddHours(8); // 08:00 UTC demain
                    if (now.Hour < 8) prochainDeclenchement = now.Date.AddHours(8); // 08:00 UTC aujourd'hui

                    var delai = prochainDeclenchement - now;
                    _logger.LogInformation("Prochaine vérification des alertes équipements dans {Delai}", delai);
                    
                    await Task.Delay(delai, stoppingToken);

                    await LancerAlertesAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur dans EquipementAlerteWorker.");
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task LancerAlertesAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IEquipementRepository>();

            // 1. Équipements à remplacer
            var aRemplacer = await repo.GetEquipementsARemplacerAsync();
            if (aRemplacer.Any())
            {
                _logger.LogWarning("[Alerte Équipement] {Count} équipement(s) à remplacer.", aRemplacer.Count);
            }

            // 2. Garanties expirantes dans 30 jours
            var garanties = await repo.GetEquipementsGarantieExpiranteAsync(joursAvant: 30);
            if (garanties.Any())
            {
                _logger.LogInformation("[Alerte Équipement] {Count} garantie(s) expirante(s) dans 30 jours.", garanties.Count);
            }

            // 3. Rotation faible (> 6 mois sans mission)
            var stagnants = await repo.GetEquipementsRotationFaibleAsync(moisSansUtilisation: 6);
            if (stagnants.Any())
            {
                _logger.LogInformation("[Alerte Équipement] {Count} équipement(s) à rotation faible (> 6 mois).", stagnants.Count);
            }
        }
    }
}
