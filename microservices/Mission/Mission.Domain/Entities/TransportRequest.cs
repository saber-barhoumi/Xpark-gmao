using System.Text.Json.Serialization;

namespace Mission.Domain.Entities;

/// <summary>
/// Demande de transport ("devis") soumise par un client — l'étape AVANT une Mission.
/// Cycle : PENDING_QUOTATION (client peut éditer/annuler) → QUOTATION_SENT (admin a
/// chiffré, client peut seulement accepter/refuser) → ACCEPTED (une Mission a été
/// créée, voir MissionId) ou REJECTED / CANCELLED.
/// </summary>
public class TransportRequest
{
    public long   IdTransportRequest  { get; set; }

    // ── Demande du client ────────────────────────────────────────────────────
    public long    ClientIdUtilisateur { get; set; }
    public string? ClientNom           { get; set; }   // dénormalisé (affichage backoffice)
    public DateTime DateSouhaitee      { get; set; }
    public string   VilleDepart        { get; set; } = string.Empty;
    public string   VilleArrivee       { get; set; } = string.Empty;
    public string   CargoDescription   { get; set; } = string.Empty;
    public double   CargoWeightKg      { get; set; }
    public int      PassengerCount     { get; set; } = 1;
    public string?  VehicleTypeRequested { get; set; }   // choix du client (BERLINE, CAMION...)

    // ── Estimation IA au moment de la soumission (snapshot, non modifiable) ──
    public double  DistanceKm               { get; set; }
    public double  AiEstimatedPrice         { get; set; }
    public double  AiPriceRangeMin          { get; set; }
    public double  AiPriceRangeMax          { get; set; }
    public string? AiVehicleTypeRecommended { get; set; }

    // ── Devis (rempli par le staff à l'étape QUOTATION_SENT) ─────────────────
    // [JsonConverter] : renvoyé en JSON comme "PENDING_QUOTATION" (pas 0) — même
    // convention que Mission.Statut (converti en string via AutoMapper), ici sans
    // DTO de réponse dédié.
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public StatutDemandeTransport Statut { get; set; } = StatutDemandeTransport.PENDING_QUOTATION;
    public double?       FinalPrice           { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MethodePrix?  PricingMethod        { get; set; }
    public string?       AdminNote            { get; set; }
    public long?         QuotedByUserId       { get; set; }
    public string?       QuotedByName         { get; set; }
    public DateTime?     DateQuotationEnvoyee { get; set; }

    // ── Réponse du client ─────────────────────────────────────────────────────
    public string?   ClientCancelReason    { get; set; }
    public string?   ClientRejectionReason { get; set; }
    public DateTime? DateClientReponse     { get; set; }

    // ── Résultat (accepté → Mission créée) ────────────────────────────────────
    public long?     MissionId  { get; set; }   // pas de FK, même convention que SupportTicket.MissionId

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime DateMaj      { get; set; } = DateTime.UtcNow;
}
