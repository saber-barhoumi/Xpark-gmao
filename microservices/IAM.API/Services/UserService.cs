using IAM.API.Data;
using IAM.API.DTOs;
using IAM.API.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Enums;
using XparkGMAO.Shared.Events;

namespace IAM.API.Services;

public class UserService(IamDbContext db, IPublishEndpoint bus) : IUserService
{
    public async Task<UserProfileDto> GetProfileAsync(long userId)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");
        return ToDto(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(long userId, UpdateProfileDto dto)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (dto.Nom      is not null) user.Nom      = dto.Nom;
        if (dto.Prenom   is not null) user.Prenom   = dto.Prenom;
        if (dto.Telephone is not null) user.Telephone = dto.Telephone;
        user.DateModification = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task ChangePasswordAsync(long userId, ChangePasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw new ArgumentException("Les mots de passe ne correspondent pas.");

        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.MotDePasse))
            throw new UnauthorizedAccessException("Mot de passe actuel incorrect.");

        user.MotDePasse       = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.DateModification = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<List<UserProfileDto>> GetAllUsersAsync()
    {
        var users = await db.Utilisateurs.ToListAsync();
        return users.Select(ToDto).ToList();
    }

    public async Task ApproveUserAsync(long adminId, ApproveUserDto dto)
    {
        var user = await db.Utilisateurs.FindAsync(dto.UserId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        user.Statut          = StatutUtilisateur.ACTIF;
        user.DateApprobation = DateTime.UtcNow;
        user.ApprouvePar     = adminId;
        await db.SaveChangesAsync();

        await bus.Publish(new UserApprovedEvent(user.IdUtilisateur, user.Email));
    }

    public async Task RejectUserAsync(long adminId, RejectUserDto dto)
    {
        var user = await db.Utilisateurs.FindAsync(dto.UserId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        user.Statut      = StatutUtilisateur.DESACTIVE;
        user.RaisonRejet = dto.Raison;
        user.ApprouvePar = adminId;
        await db.SaveChangesAsync();
    }

    public async Task ChangeRoleAsync(long adminId, ChangeRoleDto dto)
    {
        var user = await db.Utilisateurs.FindAsync(dto.UserId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        user.Role             = dto.NewRole;
        user.DateModification = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task SuspendUserAsync(long adminId, long userId)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        user.Statut           = StatutUtilisateur.SUSPENDU;
        user.DateModification = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await bus.Publish(new UserStatusChangedEvent(userId, StatutUtilisateur.SUSPENDU.ToString()));
    }

    public async Task ActivateUserAsync(long adminId, long userId)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        user.Statut           = StatutUtilisateur.ACTIF;
        user.DateModification = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await bus.Publish(new UserStatusChangedEvent(userId, StatutUtilisateur.ACTIF.ToString()));
    }

    private static UserProfileDto ToDto(Utilisateur u) => new(
        u.IdUtilisateur, u.Nom, u.Prenom, u.Email,
        u.Telephone, u.Role.ToString(), u.Actif,
        u.EmailConfirmed, u.HasPin, u.DateCreation,
        u.Photo, u.Statut.ToString());
}
