using IAM.Infrastructure.Data;
using IAM.Application.DTOs;
using IAM.Domain.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Enums;
using XparkGMAO.Shared.Events;

namespace IAM.Infrastructure.Services;

public class EmployeeService(IamDbContext db, IPublishEndpoint bus) : IEmployeeService
{
    public async Task<List<EmployeeDto>> GetAllAsync() =>
        (await db.Employees.ToListAsync()).Select(ToDto).ToList();

    public async Task<EmployeeDto> GetByIdAsync(long id)
    {
        var e = await db.Employees.FindAsync(id)
            ?? throw new KeyNotFoundException("Employé introuvable.");
        return ToDto(e);
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto)
    {
        var exists = await db.Employees.AnyAsync(e => e.NumeroMatricule == dto.NumeroMatricule);
        if (exists) throw new InvalidOperationException("Numéro matricule déjà utilisé.");

        var emp = new Employee
        {
            Name                 = dto.Name,
            Prenom               = dto.Prenom,
            NumeroMatricule      = dto.NumeroMatricule,
            Post                 = dto.Post,
            Service              = dto.Service,
            Telephone            = dto.Telephone,
            DateEmbauche         = dto.DateEmbauche,
            NumeroPermis         = dto.NumeroPermis,
            CategoriePermis      = dto.CategoriePermis,
            DateExpirationPermis = dto.DateExpirationPermis,
            Specialty            = dto.Specialty,
            Level                = dto.Level,
        };

        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        await bus.Publish(new EmployeeCreatedEvent(
            emp.IdEmployee, emp.Name, emp.Prenom,
            emp.Post.ToString(), emp.Service.ToString()));

        return ToDto(emp);
    }

    public async Task<EmployeeDto> UpdateAsync(long id, UpdateEmployeeDto dto)
    {
        var emp = await db.Employees.FindAsync(id)
            ?? throw new KeyNotFoundException("Employé introuvable.");

        if (dto.Name      is not null) emp.Name      = dto.Name;
        if (dto.Prenom    is not null) emp.Prenom    = dto.Prenom;
        if (dto.Post      is not null) emp.Post      = dto.Post.Value;
        if (dto.Service   is not null) emp.Service   = dto.Service.Value;
        if (dto.Statut    is not null) emp.Statut    = dto.Statut.Value;
        if (dto.Telephone is not null) emp.Telephone = dto.Telephone;

        await db.SaveChangesAsync();
        return ToDto(emp);
    }

    public async Task DeleteAsync(long id)
    {
        var emp = await db.Employees.FindAsync(id)
            ?? throw new KeyNotFoundException("Employé introuvable.");
        emp.Activ = false;
        await db.SaveChangesAsync();
    }

    public async Task<List<EmployeeDto>> GetByPostAsync(PostEmployee post) =>
        (await db.Employees.Where(e => e.Post == post && e.Activ).ToListAsync()).Select(ToDto).ToList();

    public async Task<List<EmployeeDto>> GetByStatutAsync(StatutEmployee statut) =>
        (await db.Employees.Where(e => e.Statut == statut && e.Activ).ToListAsync()).Select(ToDto).ToList();

    private static EmployeeDto ToDto(Employee e) => new(
        e.IdEmployee, e.Name, e.Prenom, e.NumeroMatricule,
        e.Post.ToString(), e.Service.ToString(), e.Statut.ToString(),
        e.Telephone, e.DateEmbauche,
        e.NumeroPermis, e.CategoriePermis?.ToString(),
        e.DateExpirationPermis, e.Specialty?.ToString(), e.Level?.ToString());
}
