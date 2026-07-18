using Microsoft.EntityFrameworkCore;
using Mission.Infrastructure.Data;
using Mission.Domain.Entities;
using MissionEntity = Mission.Domain.Entities.Mission;

namespace Mission.Infrastructure.Repositories;

public class MissionRepository(MissionDbContext context) : GenericRepository<MissionEntity>(context), IMissionRepository
{
    public async Task<MissionEntity?> GetWithDetailsAsync(long id)
        => await _dbSet.FirstOrDefaultAsync(m => m.IdMission == id);

    public async Task<IEnumerable<MissionEntity>> GetByStatutAsync(StatutMission statut)
        => await _dbSet
            .Where(m => m.Statut == statut)
            .OrderByDescending(m => m.DateDepart)
            .ToListAsync();
}
