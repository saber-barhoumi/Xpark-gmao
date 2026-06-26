using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Interfaces.Repositories;

/// <summary>
/// Interface repository pour les véhicules
/// </summary>
public interface IVehiculeRepository : IGenericRepository<Vehicule>
{
    Task<Vehicule?> GetByImmatriculationAsync(string immatriculation);
    Task<IEnumerable<Vehicule>> GetDisponiblesAsync();
    Task<IEnumerable<Vehicule>> GetByStatutAsync(StatutVehicule statut);
    Task<IEnumerable<Vehicule>> GetByTypeAsync(TypeVehicule type);
    Task<Vehicule?> GetWithDetailsAsync(long id);
}
