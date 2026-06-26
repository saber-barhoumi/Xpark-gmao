namespace XparkGMAO.Core.Entities.GestionEquipements
{
    /// <summary>
    /// Contrat fournisseur lié à un équipement.
    /// Source : saisi par le gestionnaire ou importé.
    /// </summary>
    public class ContratFournisseur
    {
        public long IdContrat { get; set; }

        public long EquipementId { get; set; }
        public Equipement Equipement { get; set; } = null!;

        public TypeContrat Type { get; set; }

        public string NomFournisseur { get; set; } = string.Empty;

        public string? NumeroContrat { get; set; }

        public string? ContactFournisseur { get; set; }   // Email ou tél

        public string? TelephoneSAV { get; set; }

        public DateTime DateDebutUtc { get; set; }         // UTC

        public DateTime DateFinUtc { get; set; }           // UTC

        public decimal? MontantAnnuel { get; set; }        // numeric(10,2)

        public string? ConditionsJson { get; set; }        // Clauses importantes en JSON

        /// <summary>URL PDF du contrat scanné</summary>
        public string? DocumentUrl { get; set; }

        public bool IsActif { get; set; } = true;

        public string? Notes { get; set; }

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
        public DateTime DateModification { get; set; } = DateTime.UtcNow;
    }
}
