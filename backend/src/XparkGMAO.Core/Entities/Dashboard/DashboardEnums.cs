namespace XparkGMAO.Core.Entities.Dashboard
{
    public enum TendanceKPI
    {
        HAUSSE = 1,      // ↗ Valeur en augmentation
        BAISSE = -1,     // ↘ Valeur en diminution
        STABLE = 0       // → Valeur stable
    }

    public enum TypeWidget
    {
        KPI_CARD,              // Carte KPI simple
        LINE_CHART,            // Graphique ligne (évolution)
        BAR_CHART,             // Graphique barres
        PIE_CHART,             // Graphique camembert
        AREA_CHART,            // Graphique aire
        TABLE,                 // Tableau de données
        RECENT_ACTIVITIES,     // Liste activités récentes
        ALERTS,                // Liste alertes
        TOP_5                  // Top 5 (véhicules, chauffeurs, etc.)
    }

    public enum CategorieKPI
    {
        MISSIONS,              // KPIs liés aux missions
        FLOTTE,                // KPIs liés aux véhicules
        FINANCE,               // KPIs financiers
        MAINTENANCE,           // KPIs maintenance
        CARBURANT,             // KPIs consommation
        PERFORMANCE            // KPIs performance globale
    }
}
