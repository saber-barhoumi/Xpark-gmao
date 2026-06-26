namespace XparkGMAO.Core.Entities.GestionEquipements
{
    public enum TypeEquipement
    {
        Fixe,          // Attaché à un véhicule spécifique (GPS, radio)
        Mobile,        // Pool partagé entre véhicules (crics, outils)
        Obligatoire    // Sécurité réglementaire (extincteur, trousse secours)
    }

    public enum EtatEquipement
    {
        Neuf,
        Bon,
        Use,
        ARemplacer,
        HorsService
    }

    public enum CategorieEquipement
    {
        Securite,       // Extincteur, trousse secours
        Mecanique,      // Pièces moteur, transmission
        Electronique,   // Capteurs, GPS, radio
        Outillage,      // Crics, clés
        Informatique,   // Tablettes, scanners
        Autre
    }

    public enum TypeMouvement
    {
        CheckOut,           // Départ mission
        CheckIn,            // Retour mission
        Transfert,          // Changement de véhicule
        EnvoyeMaintenace,
        RetourMaintenance
    }

    public enum EtatApresRetour
    {
        Bon,
        Use,
        Endommage,
        Perdu
    }

    public enum TypeContrat
    {
        Garantie,              // Garantie constructeur
        MaintenancePreventive, // Contrat entretien périodique
        MaintenanceCorrective, // Contrat réparation à la demande
        AssurancePerte,        // Assurance vol/perte
        LocationLongDuree,     // LOA / leasing
        Autre
    }
}
