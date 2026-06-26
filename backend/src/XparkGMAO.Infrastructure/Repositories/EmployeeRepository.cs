using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

public class EmployeeRepository : GenericRepository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(XparkDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Employee>> GetByPostAsync(PostEmployee post)
    {
        return await _context.Employees
            .Where(e => e.Post == post && e.Activ)
            .ToListAsync();
    }

    public async Task<IEnumerable<Employee>> GetByStatutAsync(StatutEmployee statut)
    {
        return await _context.Employees
            .Where(e => e.Statut == statut && e.Activ)
            .ToListAsync();
    }

    public async Task<IEnumerable<Employee>> GetByFiltersAsync(PostEmployee? post, StatutEmployee? statut)
    {
        var query = _context.Employees.Where(e => e.Activ).AsQueryable();

        if (post.HasValue)
            query = query.Where(e => e.Post == post.Value);

        if (statut.HasValue)
            query = query.Where(e => e.Statut == statut.Value);

        return await query.ToListAsync();
    }

    public async Task<Employee?> GetByMatriculeAsync(string numeroMatricule)
    {
        return await _context.Employees
            .FirstOrDefaultAsync(e => e.NumeroMatricule == numeroMatricule && e.Activ);
    }
}
