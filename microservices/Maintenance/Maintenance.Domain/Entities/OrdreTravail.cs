namespace Maintenance.Domain.Entities;

public class OrdreTravail
{
    public long                  IdOrdreTravail   { get; set; }
    public string                Reference        { get; set; } = string.Empty;
    public DateTime              DateCreation     { get; set; } = DateTime.UtcNow;
    public DateTime?             DateDebut        { get; set; }
    public DateTime?             DateFin          { get; set; }
    public string                Description      { get; set; } = string.Empty;
    public StatutOrdreTravail    Statut           { get; set; } = StatutOrdreTravail.PLANIFIE;
    public PrioriteOrdreTravail  Priorite         { get; set; } = PrioriteOrdreTravail.MOYENNE;
    public double?               CoutReel         { get; set; }
    public string?               Observations     { get; set; }
    public string?               MotifAnnulation  { get; set; }
    public long?                 ValideParId      { get; set; }
    public DateTime?             DateValidation   { get; set; }
    public long                  VehiculeId       { get; set; }
    public long?                 TechnicienId     { get; set; }

    public ICollection<Intervention>       Interventions     { get; set; } = new List<Intervention>();
    public ICollection<Attachment>         Attachments       { get; set; } = new List<Attachment>();
    public ICollection<Commentaire>        Commentaires      { get; set; } = new List<Commentaire>();
    public ICollection<HistoriqueStatutOT> HistoriqueStatuts { get; set; } = new List<HistoriqueStatutOT>();
}
