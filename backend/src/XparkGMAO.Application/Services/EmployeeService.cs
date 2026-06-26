using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.Interfaces.Repositories;

namespace XparkGMAO.Application.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IEmployeeRepository _repository;

    public EmployeeService(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<Employee>> GetAllAsync()
    {
        return (await _repository.GetAllAsync()).Where(e => e.Activ);
    }

    public async Task<Employee?> GetByIdAsync(long id)
    {
        var employee = await _repository.GetByIdAsync(id);
        return (employee != null && employee.Activ) ? employee : null;
    }

    public async Task<IEnumerable<Employee>> GetByPostAsync(PostEmployee post)
    {
        return await _repository.GetByPostAsync(post);
    }

    public async Task<IEnumerable<Employee>> GetByStatutAsync(StatutEmployee statut)
    {
        return await _repository.GetByStatutAsync(statut);
    }

    public async Task<IEnumerable<Employee>> GetByFiltersAsync(PostEmployee? post, StatutEmployee? statut)
    {
        return await _repository.GetByFiltersAsync(post, statut);
    }

    public async Task<Employee> CreateAsync(EmployeeDto dto)
    {
        // Vérification des doublons sur le numéro matricule
        var existant = await _repository.GetByMatriculeAsync(dto.NumeroMatricule);
        if (existant != null)
            throw new InvalidOperationException($"Un employé avec le matricule '{dto.NumeroMatricule}' existe déjà.");

        var employee = new Employee
        {
            Name = dto.Name,
            Prenom = dto.Prenom,
            NumeroMatricule = dto.NumeroMatricule,
            Post = Enum.Parse<PostEmployee>(dto.Post, true),
            Service = Enum.Parse<ServiceEmployee>(dto.Service, true),
            Statut = Enum.Parse<StatutEmployee>(dto.Statut, true),
            Telephone = dto.Telephone,
            DateEmbauche = DateTime.SpecifyKind(dto.DateEmbauche, DateTimeKind.Utc),
            Activ = true,
            // Specialized fields
            NumeroPermis = dto.NumeroPermis,
            CategoriePermis = string.IsNullOrEmpty(dto.CategoriePermis) ? null : Enum.Parse<CategoriePermis>(dto.CategoriePermis, true),
            DateExpirationPermis = dto.DateExpirationPermis.HasValue ? DateTime.SpecifyKind(dto.DateExpirationPermis.Value, DateTimeKind.Utc) : null,
            Specialty = string.IsNullOrEmpty(dto.Specialty) ? null : Enum.Parse<SpecialtyTechnician>(dto.Specialty, true),
            Level = string.IsNullOrEmpty(dto.Level) ? null : Enum.Parse<LevelTechnician>(dto.Level, true)
        };

        return await _repository.AddAsync(employee);
    }

    public async Task UpdateAsync(long id, EmployeeDto dto)
    {
        var employee = await _repository.GetByIdAsync(id);
        if (employee == null || !employee.Activ) throw new KeyNotFoundException("Employé introuvable");

        // Vérification des doublons sur le numéro matricule (exclure l'employé actuel)
        if (employee.NumeroMatricule != dto.NumeroMatricule)
        {
            var existant = await _repository.GetByMatriculeAsync(dto.NumeroMatricule);
            if (existant != null)
                throw new InvalidOperationException($"Un employé avec le matricule '{dto.NumeroMatricule}' existe déjà.");
        }

        employee.Name = dto.Name;
        employee.Prenom = dto.Prenom;
        employee.NumeroMatricule = dto.NumeroMatricule;
        employee.Post = Enum.Parse<PostEmployee>(dto.Post, true);
        employee.Service = Enum.Parse<ServiceEmployee>(dto.Service, true);
        employee.Statut = Enum.Parse<StatutEmployee>(dto.Statut, true);
        employee.Telephone = dto.Telephone;
        employee.DateEmbauche = DateTime.SpecifyKind(dto.DateEmbauche, DateTimeKind.Utc);

        // Specialized fields
        employee.NumeroPermis = dto.NumeroPermis;
        employee.CategoriePermis = string.IsNullOrEmpty(dto.CategoriePermis) ? null : Enum.Parse<CategoriePermis>(dto.CategoriePermis, true);
        employee.DateExpirationPermis = dto.DateExpirationPermis.HasValue ? DateTime.SpecifyKind(dto.DateExpirationPermis.Value, DateTimeKind.Utc) : null;
        employee.Specialty = string.IsNullOrEmpty(dto.Specialty) ? null : Enum.Parse<SpecialtyTechnician>(dto.Specialty, true);
        employee.Level = string.IsNullOrEmpty(dto.Level) ? null : Enum.Parse<LevelTechnician>(dto.Level, true);

        await _repository.UpdateAsync(employee);
    }

    public async Task DeactivateAsync(long id)
    {
        var employee = await _repository.GetByIdAsync(id);
        if (employee != null)
        {
            employee.Activ = false;
            await _repository.UpdateAsync(employee);
        }
    }
}
