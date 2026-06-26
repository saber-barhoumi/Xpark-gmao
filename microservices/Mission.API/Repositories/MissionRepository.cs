using Microsoft.EntityFrameworkCore;
using Mission.API.Data;
using Mission.API.Entities;
using MissionEntity = Mission.API.Entities.Mission;

namespace Mission.API.Repositories;

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
