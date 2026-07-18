namespace Finance.Application.DTOs;

public class StatistiquesCarburantDto
{
    public double TotalQuantite { get; set; }
    public double TotalCout { get; set; }
    public double CoutMoyen { get; set; }
    public double PrixMoyenLitre { get; set; }
    public int NombreRavitaillements { get; set; }
    public List<CoutParSourceDto> CoutParSource { get; set; } = new();
    public List<EvolutionMensuelleDto> EvolutionMensuelle { get; set; } = new();
    public List<CoutParVehiculeDto> CoutParVehicule { get; set; } = new();
}

public class CoutParSourceDto
{
    public string Source { get; set; } = string.Empty;
    public string TypeSource { get; set; } = string.Empty;
    public double Cout { get; set; }
    public double Quantite { get; set; }
    public int NombreRavitaillements { get; set; }
}

public class EvolutionMensuelleDto
{
    public int Annee { get; set; }
    public int Mois { get; set; }
    public double Cout { get; set; }
    public double Quantite { get; set; }
}

public class CoutParVehiculeDto
{
    public long VehiculeId { get; set; }
    public string Immatriculation { get; set; } = string.Empty;
    public double Cout { get; set; }
    public double Quantite { get; set; }
    public int NombreRavitaillements { get; set; }
}
