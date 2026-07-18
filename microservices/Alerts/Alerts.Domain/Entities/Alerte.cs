using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Alerts.Domain.Entities;

[Table("Alertes")]
public class Alerte
{
    [Key] public long IdAlerte { get; set; }
    public TypeAlerte   TypeAlerte  { get; set; }
    public Priorite     Priorite    { get; set; } = Priorite.MOYENNE;
    public StatutAlerte Statut      { get; set; } = StatutAlerte.ACTIVE;
    public string       Message     { get; set; } = string.Empty;
    [Column("DateAlerte")]   public DateTime  DateCreation  { get; set; } = DateTime.UtcNow;
    [Column("DateEcheance")] public DateTime? DateExpiration { get; set; }
    public long?   UtilisateurId    { get; set; }
    public long?   VehiculeId       { get; set; }
    public long?   ChauffeurId      { get; set; }
    public string? EntiteReference  { get; set; }
    public long?   EntiteReferenceId { get; set; }
    public long?   EquipementId     { get; set; }
    public long?   MissionId        { get; set; }

    [NotMapped] public string    Titre          { get; set; } = string.Empty;
    [NotMapped] public DateTime? DateLecture    { get; set; }
    [NotMapped] public DateTime? DateTraitement { get; set; }
    [NotMapped] public string?   Donnees        { get; set; }
}
