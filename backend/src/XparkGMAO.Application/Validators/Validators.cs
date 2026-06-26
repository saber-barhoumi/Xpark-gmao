using FluentValidation;
using XparkGMAO.Core.DTOs.Request;

namespace XparkGMAO.Application.Validators;

/// <summary>
/// Validateur pour la création d'un véhicule
/// </summary>
public class CreateVehiculeValidator : AbstractValidator<CreateVehiculeDto>
{
    public CreateVehiculeValidator()
    {
        RuleFor(x => x.Marque)
            .NotEmpty().WithMessage("La marque est obligatoire")
            .MaximumLength(100).WithMessage("La marque ne peut pas dépasser 100 caractères");

        RuleFor(x => x.Modele)
            .NotEmpty().WithMessage("Le modèle est obligatoire")
            .MaximumLength(100).WithMessage("Le modèle ne peut pas dépasser 100 caractères");

        RuleFor(x => x.Immatriculation)
            .NotEmpty().WithMessage("L'immatriculation est obligatoire")
            .MaximumLength(20).WithMessage("L'immatriculation ne peut pas dépasser 20 caractères");

        RuleFor(x => x.NumeroChassis)
            .NotEmpty().WithMessage("Le numéro de châssis est obligatoire")
            .MaximumLength(50).WithMessage("Le numéro de châssis ne peut pas dépasser 50 caractères");

        RuleFor(x => x.Kilometrage)
            .GreaterThanOrEqualTo(0).WithMessage("Le kilométrage doit être positif ou nul");

        RuleFor(x => x.AnneeConstruction)
            .InclusiveBetween(1990, DateTime.UtcNow.Year + 1)
            .WithMessage($"L'année de construction doit être entre 1990 et {DateTime.UtcNow.Year + 1}");

        RuleFor(x => x.NombrePlaces)
            .InclusiveBetween(1, 100).WithMessage("Le nombre de places doit être entre 1 et 100");

        RuleFor(x => x.ConsommationMoyenne)
            .GreaterThan(0).WithMessage("La consommation moyenne doit être positive");

        RuleFor(x => x.ValeurAcquisition)
            .GreaterThan(0).WithMessage("La valeur d'acquisition doit être positive");
    }
}

/// <summary>
/// Validateur pour la création d'une mission
/// </summary>
public class CreateMissionValidator : AbstractValidator<CreateMissionDto>
{
    public CreateMissionValidator()
    {
        RuleFor(x => x.Destination)
            .NotEmpty().WithMessage("La destination est obligatoire")
            .MaximumLength(300).WithMessage("La destination ne peut pas dépasser 300 caractères");

        RuleFor(x => x.DateDepart)
            .NotEmpty().WithMessage("La date de départ est obligatoire")
            .GreaterThan(DateTime.UtcNow.AddMinutes(-5))
            .WithMessage("La date de départ ne peut pas être dans le passé");

        RuleFor(x => x.DateRetour)
            .GreaterThan(x => x.DateDepart)
            .When(x => x.DateRetour.HasValue)
            .WithMessage("La date de retour doit être après la date de départ");

        RuleFor(x => x.VehiculeId)
            .GreaterThan(0).WithMessage("Un véhicule doit être sélectionné");

        RuleFor(x => x.EmployeeId)
            .GreaterThan(0).WithMessage("Un chauffeur doit être sélectionné");

        RuleFor(x => x.KilometrageDepart)
            .GreaterThanOrEqualTo(0).WithMessage("Le kilométrage de départ doit être positif ou nul");
    }
}

/// <summary>
/// Validateur pour l'inscription
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Nom)
            .NotEmpty().WithMessage("Le nom est obligatoire")
            .MaximumLength(100).WithMessage("Le nom ne peut pas dépasser 100 caractères");

        RuleFor(x => x.Prenom)
            .NotEmpty().WithMessage("Le prénom est obligatoire")
            .MaximumLength(100).WithMessage("Le prénom ne peut pas dépasser 100 caractères");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est obligatoire")
            .EmailAddress().WithMessage("L'email n'est pas valide");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est obligatoire")
            .MinimumLength(8).WithMessage("Le mot de passe doit contenir au moins 8 caractères");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("La confirmation du mot de passe est obligatoire")
            .Equal(x => x.Password).WithMessage("Les mots de passe ne correspondent pas");

        RuleFor(x => x.Telephone)
            .NotEmpty().WithMessage("Le téléphone est obligatoire")
            .MaximumLength(20).WithMessage("Le téléphone ne peut pas dépasser 20 caractères");
    }
}

/// <summary>
/// Validateur pour la connexion
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est obligatoire")
            .EmailAddress().WithMessage("L'email n'est pas valide");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est obligatoire")
            .MinimumLength(6).WithMessage("Le mot de passe doit contenir au moins 6 caractères");
    }
}

/// <summary>
/// Validateur pour la création d'un client
/// </summary>
public class CreateClientValidator : AbstractValidator<CreateClientDto>
{
    public CreateClientValidator()
    {
        RuleFor(x => x.Nom)
            .NotEmpty().WithMessage("Le nom est obligatoire")
            .MaximumLength(100);

        RuleFor(x => x.Prenom)
            .NotEmpty().WithMessage("Le prénom est obligatoire")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est obligatoire")
            .EmailAddress().WithMessage("L'email n'est pas valide");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est obligatoire")
            .MinimumLength(8).WithMessage("Le mot de passe doit contenir au moins 8 caractères")
            .Matches("[A-Z]").WithMessage("Le mot de passe doit contenir au moins une majuscule")
            .Matches("[0-9]").WithMessage("Le mot de passe doit contenir au moins un chiffre");

        RuleFor(x => x.Telephone)
            .NotEmpty().WithMessage("Le téléphone est obligatoire");
    }
}

/// <summary>
/// Validateur pour la création d'une réservation
/// </summary>
public class CreateReservationValidator : AbstractValidator<CreateReservationDto>
{
    public CreateReservationValidator()
    {
        RuleFor(x => x.ClientId)
            .GreaterThan(0).WithMessage("Un client doit être sélectionné");

        RuleFor(x => x.DateDebut)
            .NotEmpty().WithMessage("La date de début est obligatoire")
            .GreaterThan(DateTime.UtcNow.AddMinutes(-5))
            .WithMessage("La date de début ne peut pas être dans le passé");

        RuleFor(x => x.DateFin)
            .NotEmpty().WithMessage("La date de fin est obligatoire")
            .GreaterThan(x => x.DateDebut)
            .WithMessage("La date de fin doit être après la date de début");
    }
}
