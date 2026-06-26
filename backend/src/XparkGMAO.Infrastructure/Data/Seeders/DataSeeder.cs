using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.Infrastructure.Data.Seeders;

/// <summary>
/// Classe de seeding des données initiales
/// </summary>
public static class DataSeeder
{
    public static void Seed(XparkDbContext context)
    {
        SeedUtilisateurs(context);
        SeedChauffeurs(context);
        SeedClients(context);
        SeedPiecesRechange(context);
        SeedVehicules(context);
        SeedSources(context);
        SeedCarburants(context);
    }

    private static void SeedUtilisateurs(XparkDbContext context)
    {
        // Force update existing seeded accounts to have required fields
        var existingUsers = context.Utilisateurs.Where(u => u.Email == "admin@xpark.tn" || u.Email == "gestionnaire@xpark.tn" || u.Email == "technicien@xpark.tn").ToList();
        foreach(var user in existingUsers)
        {
            user.EmailConfirmed = true;
            user.Statut = StatutUtilisateur.ACTIF;
        }
        if (existingUsers.Any())
        {
            context.SaveChanges();
        }

        if (context.Utilisateurs.Any()) return;

        var admin = new Utilisateur
        {
            Nom = "Admin",
            Prenom = "System",
            Email = "admin@xpark.tn",
            MotDePasse = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Telephone = "+216 12 345 678",
            Actif = true,
            DateCreation = DateTime.UtcNow,
            Role = Role.ADMIN,
            EmailConfirmed = true,
            Statut = StatutUtilisateur.ACTIF
        };

        var gestionnaire = new Utilisateur
        {
            Nom = "Ben Ali",
            Prenom = "Karim",
            Email = "gestionnaire@xpark.tn",
            MotDePasse = BCrypt.Net.BCrypt.HashPassword("Gestionnaire@123"),
            Telephone = "+216 12 345 679",
            Actif = true,
            DateCreation = DateTime.UtcNow,
            Role = Role.GESTIONNAIRE,
            EmailConfirmed = true,
            Statut = StatutUtilisateur.ACTIF
        };

        var technicien = new Utilisateur
        {
            Nom = "Trabelsi",
            Prenom = "Mohamed",
            Email = "technicien@xpark.tn",
            MotDePasse = BCrypt.Net.BCrypt.HashPassword("Technicien@123"),
            Telephone = "+216 12 345 680",
            Actif = true,
            DateCreation = DateTime.UtcNow,
            Role = Role.TECHNICIEN,
            EmailConfirmed = true,
            Statut = StatutUtilisateur.ACTIF
        };

        context.Utilisateurs.AddRange(admin, gestionnaire, technicien);
        context.SaveChanges();
    }

    private static void SeedChauffeurs(XparkDbContext context)
    {
        if (context.Chauffeurs.Any()) return;

        var chauffeurs = new List<Chauffeur>
        {
            new Chauffeur
            {
                Nom = "Hamdi",
                Prenom = "Sami",
                Email = "sami.hamdi@xpark.tn",
                MotDePasse = BCrypt.Net.BCrypt.HashPassword("Chauffeur@123"),
                Telephone = "+216 22 111 001",
                Actif = true,
                DateCreation = DateTime.UtcNow,
                Role = Role.CHAUFFEUR,
                NumeroPermis = "TN-B-2015-001",
                CategoriePermis = CategoriePermis.B,
                DateExpirationPermis = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                Disponibilite = StatutChauffeur.DISPONIBLE,
                Evaluation = 4.8,
                NombreMissionsEffectuees = 145,
                KilometrageTotal = 52000
            },
            new Chauffeur
            {
                Nom = "Maaloul",
                Prenom = "Riadh",
                Email = "riadh.maaloul@xpark.tn",
                MotDePasse = BCrypt.Net.BCrypt.HashPassword("Chauffeur@123"),
                Telephone = "+216 22 111 002",
                Actif = true,
                DateCreation = DateTime.UtcNow,
                Role = Role.CHAUFFEUR,
                NumeroPermis = "TN-C-2012-002",
                CategoriePermis = CategoriePermis.C,
                DateExpirationPermis = new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                Disponibilite = StatutChauffeur.DISPONIBLE,
                Evaluation = 4.5,
                NombreMissionsEffectuees = 230,
                KilometrageTotal = 98000
            },
            new Chauffeur
            {
                Nom = "Gharbi",
                Prenom = "Nizar",
                Email = "nizar.gharbi@xpark.tn",
                MotDePasse = BCrypt.Net.BCrypt.HashPassword("Chauffeur@123"),
                Telephone = "+216 22 111 003",
                Actif = true,
                DateCreation = DateTime.UtcNow,
                Role = Role.CHAUFFEUR,
                NumeroPermis = "TN-D-2018-003",
                CategoriePermis = CategoriePermis.D,
                DateExpirationPermis = new DateTime(2028, 11, 20, 0, 0, 0, DateTimeKind.Utc),
                Disponibilite = StatutChauffeur.EN_CONGE,
                Evaluation = 4.9,
                NombreMissionsEffectuees = 87,
                KilometrageTotal = 35000
            }
        };

        context.Chauffeurs.AddRange(chauffeurs);
        context.SaveChanges();
    }

    private static void SeedClients(XparkDbContext context)
    {
        if (context.Clients.Any()) return;

        var clients = new List<Client>
        {
            new Client
            {
                Nom = "Sfax",
                Prenom = "Industries",
                Email = "contact@sfax-industries.tn",
                MotDePasse = BCrypt.Net.BCrypt.HashPassword("Client@123"),
                Telephone = "+216 74 000 001",
                Actif = true,
                DateCreation = DateTime.UtcNow,
                Role = Role.CLIENT,
                NomSociete = "Sfax Industries SARL",
                SecteurActivite = "Industrie",
                Adresse = "Zone Industrielle Sfax",
                Ville = "Sfax",
                CodePostal = "3000",
                Pays = "Tunisie",
                NumeroFiscal = "1234567A",
                EstEntreprise = true
            },
            new Client
            {
                Nom = "Ben Youssef",
                Prenom = "Leila",
                Email = "leila.benyoussef@gmail.com",
                MotDePasse = BCrypt.Net.BCrypt.HashPassword("Client@123"),
                Telephone = "+216 55 000 002",
                Actif = true,
                DateCreation = DateTime.UtcNow,
                Role = Role.CLIENT,
                Adresse = "Rue de la Liberté, Tunis",
                Ville = "Tunis",
                CodePostal = "1000",
                Pays = "Tunisie",
                EstEntreprise = false
            }
        };

        context.Clients.AddRange(clients);
        context.SaveChanges();
    }

    private static void SeedPiecesRechange(XparkDbContext context)
    {
        if (context.PiecesRechange.Any()) return;

        var pieces = new List<PieceRechange>
        {
            new PieceRechange
            {
                Reference = "FLT-HUI-001",
                Designation = "Filtre à huile",
                Categorie = CategoriePiece.FILTRATION,
                StockActuel = 25,
                StockMinimum = 10,
                StockMaximum = 50,
                PrixUnitaire = 12.5,
                Fournisseur = "AutoParts TN",
                Emplacement = "Rayon A-1",
                Actif = true,
                DateCreation = DateTime.UtcNow
            },
            new PieceRechange
            {
                Reference = "FLT-AIR-002",
                Designation = "Filtre à air",
                Categorie = CategoriePiece.FILTRATION,
                StockActuel = 18,
                StockMinimum = 8,
                StockMaximum = 40,
                PrixUnitaire = 18.0,
                Fournisseur = "AutoParts TN",
                Emplacement = "Rayon A-2",
                Actif = true,
                DateCreation = DateTime.UtcNow
            },
            new PieceRechange
            {
                Reference = "PLQ-FRN-003",
                Designation = "Plaquettes de frein avant",
                Categorie = CategoriePiece.FREINAGE,
                StockActuel = 4,
                StockMinimum = 6,
                StockMaximum = 20,
                PrixUnitaire = 45.0,
                Fournisseur = "Brembo Distribution",
                Emplacement = "Rayon B-3",
                Actif = true,
                DateCreation = DateTime.UtcNow
            },
            new PieceRechange
            {
                Reference = "HUI-MOT-004",
                Designation = "Huile moteur 5W40 (5L)",
                Categorie = CategoriePiece.MOTEUR,
                StockActuel = 30,
                StockMinimum = 15,
                StockMaximum = 60,
                PrixUnitaire = 35.0,
                Fournisseur = "Total Tunisie",
                Emplacement = "Rayon C-1",
                Actif = true,
                DateCreation = DateTime.UtcNow
            },
            new PieceRechange
            {
                Reference = "PNE-195-005",
                Designation = "Pneu 195/65 R15",
                Categorie = CategoriePiece.PNEUMATIQUE,
                StockActuel = 8,
                StockMinimum = 4,
                StockMaximum = 16,
                PrixUnitaire = 120.0,
                Fournisseur = "Michelin TN",
                Emplacement = "Rayon D-1",
                Actif = true,
                DateCreation = DateTime.UtcNow
            }
        };

        context.PiecesRechange.AddRange(pieces);
        context.SaveChanges();
    }

    private static void SeedVehicules(XparkDbContext context)
    {
        // Fix existing "ACTIF" status that caused crashes after renaming to "DISPONIBLE"
        // Since we can't query with the enum because ACTIF is gone, we'll use a raw SQL command or just update what we can.
        // Actually, if we use EF to query, it will try to map it and fail. 
        // We must use ExecuteSqlRaw to fix the data before EF tries to read it.
        context.Database.ExecuteSqlRaw("UPDATE \"Vehicules\" SET \"Statut\" = 'DISPONIBLE' WHERE \"Statut\" = 'ACTIF'");

        if (context.Vehicules.Any()) return;

        var vehicules = new List<Vehicule>
        {
            new Vehicule
            {
                Marque = "Renault",
                Modele = "Clio 5",
                Immatriculation = "250 TN 1234",
                NumeroChassis = "VF1RJA000123456",
                Couleur = "Gris",
                TypeCarburant = TypeCarburant.ESSENCE,
                TypeVehicule = TypeVehicule.BERLINE,
                Statut = StatutVehicule.DISPONIBLE,
                Kilometrage = 12500,
                KilometrageProchainRevision = 20000,
                DateAcquisition = new DateTime(2023, 5, 10, 0, 0, 0, DateTimeKind.Utc),
                Actif = true,
                DateCreation = DateTime.UtcNow
            },
            new Vehicule
            {
                Marque = "Dacia",
                Modele = "Duster",
                Immatriculation = "240 TN 5678",
                NumeroChassis = "UU1HSD000789012",
                Couleur = "Noir",
                TypeCarburant = TypeCarburant.DIESEL,
                TypeVehicule = TypeVehicule.SUV,
                Statut = StatutVehicule.DISPONIBLE,
                Kilometrage = 45000,
                KilometrageProchainRevision = 50000,
                DateAcquisition = new DateTime(2022, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                Actif = true,
                DateCreation = DateTime.UtcNow
            },
            new Vehicule
            {
                Marque = "Volkswagen",
                Modele = "Caddy",
                Immatriculation = "230 TN 9012",
                NumeroChassis = "WV1ZZZ000345678",
                Couleur = "Blanc",
                TypeCarburant = TypeCarburant.DIESEL,
                TypeVehicule = TypeVehicule.UTILITAIRE,
                Statut = StatutVehicule.EN_MAINTENANCE,
                Kilometrage = 85000,
                KilometrageProchainRevision = 90000,
                DateAcquisition = new DateTime(2021, 11, 20, 0, 0, 0, DateTimeKind.Utc),
                Actif = true,
                DateCreation = DateTime.UtcNow
            }
        };

        context.Vehicules.AddRange(vehicules);
        context.SaveChanges();
    }

    private static void SeedSources(XparkDbContext context)
    {
        // Force refresh for chart testing
        if (context.Sources.Any()) 
        {
            context.Sources.RemoveRange(context.Sources);
            context.SaveChanges();
        }

        var sources = new List<Source>
        {
            new Source { NomSource = "Agile Tunis", TypeSource = TypeSource.DAC_INTERNE, Ville = "Tunis", Actif = true, DateCreation = DateTime.UtcNow },
            new Source { NomSource = "Shell Ariana", TypeSource = TypeSource.STATION_EXTERNE, Ville = "Ariana", Actif = true, DateCreation = DateTime.UtcNow },
            new Source { NomSource = "Total Sfax", TypeSource = TypeSource.STATION_EXTERNE, Ville = "Sfax", Actif = true, DateCreation = DateTime.UtcNow }
        };

        context.Sources.AddRange(sources);
        context.SaveChanges();
    }

    private static void SeedCarburants(XparkDbContext context)
    {
        // Only run if we don't have record or need to refresh for charts
        if (context.Carburants.Any()) return;

        var vehicules = context.Vehicules.ToList();
        if (!vehicules.Any()) return;

        var v1 = vehicules.FirstOrDefault(v => v.Immatriculation == "250 TN 1234") ?? vehicules[0];
        var v2 = vehicules.Count > 1 ? (vehicules.FirstOrDefault(v => v.Immatriculation == "240 TN 5678") ?? vehicules[1]) : v1;
        
        var s1 = context.Sources.FirstOrDefault(s => s.NomSource == "Agile Tunis") ?? context.Sources.FirstOrDefault();
        if (s1 == null) return;

        var carburants = new List<Carburant>
        {
            // Février 2026
            new Carburant {
                DateRemplissage = new DateTime(2026, 2, 10, 10, 0, 0, DateTimeKind.Utc),
                Quantite = 45.5, PrixUnitaire = 2.450, MontantTotal = 111.475,
                Kilometrage = (v1.Kilometrage > 500 ? v1.Kilometrage - 500 : 1000), 
                VehiculeId = v1.IdVehicule, SourceId = s1.IdSource,
                TypeCarburant = v1.TypeCarburant.ToString(), DateCreation = DateTime.UtcNow
            },
            new Carburant {
                DateRemplissage = new DateTime(2026, 2, 25, 14, 0, 0, DateTimeKind.Utc),
                Quantite = 55.0, PrixUnitaire = 2.220, MontantTotal = 122.1,
                Kilometrage = (v2.Kilometrage > 200 ? v2.Kilometrage - 200 : 2000), 
                VehiculeId = v2.IdVehicule, SourceId = s1.IdSource,
                TypeCarburant = v2.TypeCarburant.ToString(), DateCreation = DateTime.UtcNow
            },
            // Mars 2026
            new Carburant {
                DateRemplissage = new DateTime(2026, 3, 05, 08, 30, 0, DateTimeKind.Utc),
                Quantite = 40.0, PrixUnitaire = 2.450, MontantTotal = 98.0,
                Kilometrage = v1.Kilometrage, 
                VehiculeId = v1.IdVehicule, SourceId = s1.IdSource,
                TypeCarburant = v1.TypeCarburant.ToString(), DateCreation = DateTime.UtcNow
            },
            new Carburant {
                DateRemplissage = new DateTime(2026, 3, 11, 17, 45, 0, DateTimeKind.Utc),
                Quantite = 60.0, PrixUnitaire = 2.220, MontantTotal = 133.2,
                Kilometrage = v2.Kilometrage, 
                VehiculeId = v2.IdVehicule, SourceId = s1.IdSource,
                TypeCarburant = v2.TypeCarburant.ToString(), DateCreation = DateTime.UtcNow
            }
        };

        context.Carburants.AddRange(carburants);
        context.SaveChanges();
    }
}
