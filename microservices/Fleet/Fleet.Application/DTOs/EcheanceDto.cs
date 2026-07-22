namespace Fleet.Application.DTOs;

/// <summary>
/// Échéance de flotte : une date d'expiration à surveiller (assurance, visite
/// technique, carte grise, vignette…). Vue transverse et en LECTURE SEULE qui
/// unifie deux agrégats — DocumentAdministratif et Assurance — pour alimenter
/// le calendrier métier sans imposer au client un appel par véhicule (N+1).
/// </summary>
public record EcheanceDto(
    string   Source,          // "DOCUMENT" ou "ASSURANCE" — agrégat d'origine
    long     RefId,           // IdDocument ou IdAssurance, pour naviguer vers le module
    string   Type,            // ASSURANCE, VISITE_TECHNIQUE, CARTE_GRISE, VIGNETTE…
    string   Libelle,         // libellé prêt à afficher
    string   Reference,       // numéro de police / numéro de document
    DateTime DateExpiration,
    int      JoursRestants,   // négatif si déjà expirée
    long     VehiculeId,
    string   Immatriculation,
    string   Marque,
    string   Modele
);
