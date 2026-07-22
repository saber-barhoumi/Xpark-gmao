using System.Globalization;
using System.Text;
using PredictionPanne.Domain.Entities;

namespace PredictionPanne.Infrastructure.Engine;

/// <summary>
/// Rattache une description libre d'intervention à un organe (TypePanne).
///
/// La GMAO ne stocke pas d'organe structuré : les techniciens saisissent du
/// texte. Ce classifieur par mots-clés est donc l'étape qui transforme cet
/// historique en signal exploitable. Il est volontairement isolé ici pour
/// pouvoir être remplacé plus tard par un classifieur entraîné sans toucher au
/// moteur de prédiction.
/// </summary>
public static class OrganeClassifier
{
    private static readonly (TypePanne Organe, string[] MotsCles)[] Regles =
    [
        (TypePanne.MOTEUR,          ["moteur", "culasse", "piston", "injecteur", "distribution",
                                     "courroie", "huile", "vidange", "turbo", "joint"]),
        (TypePanne.FREINS,          ["frein", "plaquette", "disque", "etrier", "étrier", "abs", "machoire", "mâchoire"]),
        (TypePanne.PNEUMATIQUES,    ["pneu", "pneumatique", "roue", "jante", "crevaison", "geometrie", "géométrie", "parallelisme"]),
        (TypePanne.TRANSMISSION,    ["transmission", "embrayage", "boite", "boîte", "vitesse",
                                     "cardan", "differentiel", "différentiel"]),
        (TypePanne.SUSPENSION,      ["suspension", "amortisseur", "ressort", "silentbloc", "rotule", "triangle"]),
        (TypePanne.ELECTRIQUE,      ["electrique", "électrique", "batterie", "alternateur", "demarreur",
                                     "démarreur", "faisceau", "fusible", "phare", "capteur"]),
        (TypePanne.REFROIDISSEMENT, ["refroidissement", "radiateur", "durite", "thermostat",
                                     "liquide de refroidissement", "surchauffe", "ventilateur"]),
        (TypePanne.CLIMATISATION,   ["clim", "climatisation", "compresseur", "condenseur"]),
    ];

    /// <summary>Retourne l'organe détecté, ou AUTRE si aucun mot-clé ne ressort.</summary>
    public static TypePanne Classer(string? description)
    {
        if (string.IsNullOrWhiteSpace(description)) return TypePanne.AUTRE;

        var texte = Normaliser(description);
        foreach (var (organe, motsCles) in Regles)
            if (motsCles.Any(m => texte.Contains(Normaliser(m), StringComparison.Ordinal)))
                return organe;

        return TypePanne.AUTRE;
    }

    /// <summary>Minuscules sans accents : « Étrier » et « etrier » doivent matcher.</summary>
    private static string Normaliser(string s)
    {
        var d = s.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(d.Length);
        foreach (var c in d)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return sb.ToString();
    }
}
