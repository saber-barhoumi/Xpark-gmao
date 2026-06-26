using XparkGMAO.Core.Entities.GestionAdministrative;

namespace XparkGMAO.Core.Interfaces.Repositories;

public interface IEmployeeRepository : IGenericRepository<Employee>
{
    Task<IEnumerable<Employee>> GetByPostAsync(PostEmployee post);
    Task<IEnumerable<Employee>> GetByStatutAsync(StatutEmployee statut);
    Task<IEnumerable<Employee>> GetByFiltersAsync(PostEmployee? post, StatutEmployee? statut);
    Task<Employee?> GetByMatriculeAsync(string numeroMatricule);
}
