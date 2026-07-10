"use client"

/**
 * documentTemplates — génération des documents PDF du portail client.
 * Chaque template retourne du HTML autonome (CSS inline, charte XPARK :
 * bandeau sombre #0F1B24, liseré rouge #C11425) ouvert dans une fenêtre
 * d'impression : le client imprime ou enregistre en PDF.
 */

const tnd = (v) => `${(v ?? 0).toFixed(2)} TND`
const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—")
const dateTimeFr = (d) => (d ? new Date(d).toLocaleString("fr-FR") : "—")

/** Squelette commun : en-tête XPARK (logo officiel) + pied de page + zone contenu */
function shell(titre, sousTitre, corps, reference) {
    // URL absolue : la fenêtre d'impression (about:blank) ne résout pas les chemins relatifs
    const logoUrl = `${window.location.origin}/assets/images/logo-dark.png`
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre} — XPARK</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2b38; background: #fff; }
    .page { max-width: 780px; margin: 0 auto; padding: 0 36px 40px; }
    .head { background: #fff; padding: 24px 36px 18px; display: flex;
            justify-content: space-between; align-items: center; border-bottom: 3px solid #0F1B24; }
    .head .brand img { height: 46px; display: block; }
    .head .brand small { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: 1.6px;
            color: #6b7280; margin-top: 6px; text-transform: uppercase; }
    .head .ref { text-align: right; font-size: 12px; color: #6b7280; }
    .head .ref strong { color: #0F1B24; }
    .accent { height: 4px; background: #C11425; }
    h1 { font-size: 21px; margin: 30px 0 4px; }
    .sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table.info { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
    table.info th { text-align: left; background: #f4f6f9; padding: 9px 12px; font-size: 12px;
            color: #6b7280; text-transform: uppercase; letter-spacing: .4px; border: 1px solid #e6e9ee; width: 38%; }
    table.info td { padding: 9px 12px; font-size: 14px; border: 1px solid #e6e9ee; font-weight: 600; }
    .total { background: #0F1B24; color: #fff; border-radius: 10px; padding: 16px 22px;
            display: flex; justify-content: space-between; align-items: center; margin: 24px 0; }
    .total .lbl { font-size: 13px; color: rgba(255,255,255,.7); }
    .total .val { font-size: 22px; font-weight: 800; color: #ffc4ca; }
    .note { font-size: 12px; color: #6b7280; line-height: 1.6; border-top: 1px solid #e6e9ee;
            padding-top: 14px; margin-top: 26px; }
    .sign { display: flex; justify-content: space-between; margin-top: 40px; }
    .sign div { width: 42%; border-top: 1px solid #9aa3ad; padding-top: 8px; font-size: 12px; color: #6b7280; }
    @media print { .no-print { display: none; } }
    .no-print { text-align: center; padding: 18px; }
    .no-print button { background: #C11425; color: #fff; border: none; border-radius: 8px;
            padding: 12px 28px; font-size: 15px; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
    <div class="head">
        <div class="brand">
            <img src="${logoUrl}" alt="XPARK">
            <small>Transport de marchandises</small>
        </div>
        <div class="ref"><strong>${reference}</strong><br>Émis le ${new Date().toLocaleDateString("fr-FR")}</div>
    </div>
    <div class="accent"></div>
    <div class="page">
        <h1>${titre}</h1>
        <div class="sub">${sousTitre}</div>
        ${corps}
        <div class="note">
            XPARK — Transport de marchandises · Zone industrielle, Tunis, Tunisie · +216 70 000 000 · contact@xpark.tn<br>
            Document généré automatiquement depuis l'espace client XPARK.
        </div>
    </div>
    <div class="no-print">
        <button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    </div>
</body>
</html>`
}

/** 📋 Ordre de mission — toute mission non annulée */
export function ordreMissionHtml(m, user) {
    const corps = `
        <table class="info">
            <tr><th>Client</th><td>${user?.prenom || ""} ${user?.nom || ""} (${user?.email || "—"})</td></tr>
            <tr><th>Trajet</th><td>${m.villeDepart || "—"} → ${m.villeArrivee || m.destination || "—"}</td></tr>
            <tr><th>Date de départ</th><td>${dateTimeFr(m.dateDepart)}</td></tr>
            <tr><th>Objet</th><td>${m.objetMission || "Transport de marchandises"}</td></tr>
            <tr><th>Distance estimée</th><td>${m.distanceKm ? `${m.distanceKm.toFixed(0)} km` : "—"}</td></tr>
            <tr><th>Chauffeur</th><td>${m.chauffeurNom || "En cours d'affectation"}</td></tr>
            <tr><th>Véhicule</th><td>${m.vehiculeImmatriculation || "En cours d'affectation"}</td></tr>
            <tr><th>Statut</th><td>${(m.statut || "").replace("_", " ")}</td></tr>
        </table>
        <div class="total"><span class="lbl">Coût ${m.statut === "TERMINEE" && m.coutTotal > 0 ? "final" : "estimé"}</span>
            <span class="val">${tnd(m.statut === "TERMINEE" && m.coutTotal > 0 ? m.coutTotal : m.coutEstimeAI)}</span></div>
        <div class="sign"><div>Signature XPARK</div><div>Signature client</div></div>`
    return shell("Ordre de mission", `Mission n°${m.idMission} — document de prise en charge du transport`,
        corps, `OM-${String(m.idMission).padStart(5, "0")}`)
}

/** ✅ Attestation de transport — missions terminées */
export function attestationHtml(m, user) {
    const corps = `
        <p style="font-size:14px; line-height:1.8; margin-bottom:22px;">
            La société <strong>XPARK</strong>, spécialisée dans le transport de marchandises,
            atteste avoir réalisé pour le compte de
            <strong>${user?.prenom || ""} ${user?.nom || ""}</strong> la prestation de transport
            décrite ci-dessous, menée à terme dans le respect des conditions convenues.
        </p>
        <table class="info">
            <tr><th>Mission</th><td>N°${m.idMission}</td></tr>
            <tr><th>Trajet effectué</th><td>${m.villeDepart || "—"} → ${m.villeArrivee || m.destination || "—"}</td></tr>
            <tr><th>Date de départ</th><td>${dateTimeFr(m.dateDepart)}</td></tr>
            <tr><th>Date de retour</th><td>${m.dateRetour ? dateTimeFr(m.dateRetour) : "—"}</td></tr>
            <tr><th>Distance parcourue</th><td>${m.distanceKm ? `${m.distanceKm.toFixed(0)} km` : "—"}</td></tr>
            <tr><th>Chauffeur</th><td>${m.chauffeurNom || "—"}</td></tr>
            <tr><th>Véhicule</th><td>${m.vehiculeImmatriculation || "—"}</td></tr>
        </table>
        <div class="sign"><div>Fait à Tunis, le ${new Date().toLocaleDateString("fr-FR")}</div><div>Direction XPARK</div></div>`
    return shell("Attestation de transport", `Mission n°${m.idMission} — prestation réalisée et clôturée`,
        corps, `AT-${String(m.idMission).padStart(5, "0")}`)
}

/** 🧾 Facture — depuis Finance.API */
export function factureHtml(f, user) {
    const ht = f.montant ?? (f.montantTTC ? f.montantTTC / (1 + (f.tauxTVA ?? 19) / 100) : 0)
    const corps = `
        <table class="info">
            <tr><th>Client</th><td>${user?.prenom || ""} ${user?.nom || ""} (${user?.email || "—"})</td></tr>
            <tr><th>Date d'émission</th><td>${dateFr(f.dateFacture || f.dateEmission)}</td></tr>
            <tr><th>Échéance</th><td>${dateFr(f.dateEcheance)}</td></tr>
            ${f.missionId ? `<tr><th>Mission liée</th><td>N°${f.missionId}</td></tr>` : ""}
            <tr><th>Description</th><td>${f.description || "Prestation de transport de marchandises"}</td></tr>
            <tr><th>Montant HT</th><td>${tnd(ht)}</td></tr>
            <tr><th>TVA (${f.tauxTVA ?? 19}%)</th><td>${tnd((f.montantTTC || 0) - ht)}</td></tr>
            <tr><th>Statut</th><td>${f.statut === "PAYEE" ? `Payée le ${dateFr(f.datePaiement)}` : (f.statut || "").replace("_", " ")}</td></tr>
        </table>
        <div class="total"><span class="lbl">Total TTC</span><span class="val">${tnd(f.montantTTC || f.montant)}</span></div>`
    return shell("Facture", `${f.numeroFacture || `Facture n°${f.idFacture}`} — transport de marchandises`,
        corps, f.numeroFacture || `FA-${String(f.idFacture).padStart(5, "0")}`)
}

/** Ouvre le document dans une fenêtre prête à imprimer / enregistrer en PDF.
 *  Retourne false si le navigateur bloque la pop-up (la page affiche alors un toast). */
export function openDocument(html) {
    const win = window.open("", "_blank", "width=860,height=900")
    if (!win) return false
    win.document.write(html)
    win.document.close()
    win.focus()
    return true
}
