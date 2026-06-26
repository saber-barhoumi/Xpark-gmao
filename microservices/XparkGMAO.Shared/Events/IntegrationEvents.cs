namespace XparkGMAO.Shared.Events;

// ─── IAM Events ───────────────────────────────────────────────────────────────
public record UserRegisteredEvent(long UserId, string Email, string Nom, string Prenom, string Role);
public record UserApprovedEvent(long UserId, string Email);
public record UserStatusChangedEvent(long UserId, string NewStatus);
public record EmployeeCreatedEvent(long EmployeeId, string Name, string Prenom, string Post, string Service);
public record EmployeeStatusChangedEvent(long EmployeeId, string NewStatus);
public record ClientCreatedEvent(long ClientId, string Nom, string Email);

// ─── Fleet Events ─────────────────────────────────────────────────────────────
public record VehiculeStatusChangedEvent(long VehiculeId, string Immatriculation, string NewStatus);
public record VehiculeCreatedEvent(long VehiculeId, string Immatriculation, string Marque, string Modele);
public record AssuranceExpiringEvent(long AssuranceId, long VehiculeId, string Immatriculation, DateTime DateFin);
public record DocumentExpiringEvent(long DocumentId, long VehiculeId, string Immatriculation, string TypeDocument, DateTime DateExpiration);

// ─── Mission Events ───────────────────────────────────────────────────────────
public record MissionCreatedEvent(long MissionId, long VehiculeId, long EmployeeId, DateTime DateDepart);
public record MissionStatusChangedEvent(long MissionId, string NewStatus, long VehiculeId, long EmployeeId);
public record MissionCompletedEvent(long MissionId, long VehiculeId, double KilometrageRetour);

// ─── Maintenance Events ───────────────────────────────────────────────────────
public record InterventionCreatedEvent(long InterventionId, long VehiculeId, string Type, double Cout);
public record InterventionCompletedEvent(long InterventionId, long VehiculeId);
public record StockFaibleEvent(long PieceId, string Reference, string Designation, int StockActuel, int StockMinimum);
public record OTStatusChangedEvent(long OTId, string NewStatus, long VehiculeId);

// ─── Finance Events ───────────────────────────────────────────────────────────
public record FactureCreatedEvent(long FactureId, long? ClientId, double MontantTTC, string NumeroFacture);
public record FacturePayeeEvent(long FactureId, string NumeroFacture, double MontantTTC);
public record FactureRetardEvent(long FactureId, string NumeroFacture, long? ClientId, DateTime DateEcheance);

// ─── Alert Events ─────────────────────────────────────────────────────────────
public record AlerteCreatedEvent(long AlerteId, string TypeAlerte, string Message, string Priorite, long? UtilisateurId);
public record NotificationEmailEvent(string ToEmail, string Subject, string Body);
