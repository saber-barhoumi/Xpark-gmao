using AutoMapper;
using IAM.API.DTOs;
using IAM.API.Entities;

namespace IAM.API.Mapping;

public class IamProfile : Profile
{
    public IamProfile()
    {
        CreateMap<Utilisateur, UserProfileDto>()
            .ConstructUsing(u => new UserProfileDto(
                u.IdUtilisateur, u.Nom, u.Prenom, u.Email,
                u.Telephone, u.Role.ToString(), u.Actif,
                u.EmailConfirmed, u.HasPin, u.DateCreation,
                u.Photo, u.Statut.ToString()));

        CreateMap<Employee, EmployeeDto>()
            .ConstructUsing((e, _) => new EmployeeDto(
                e.IdEmployee, e.Name, e.Prenom, e.NumeroMatricule,
                e.Post.ToString(), e.Service.ToString(), e.Statut.ToString(),
                e.Telephone, e.DateEmbauche,
                e.NumeroPermis, e.CategoriePermis?.ToString(),
                e.DateExpirationPermis, e.Specialty?.ToString(), e.Level?.ToString()));
    }
}
