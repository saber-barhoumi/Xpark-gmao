import Swal from 'sweetalert2'
import { KPI } from '@/services/kpiService'

/**
 * Export & partage du rapport d'analyses (direction uniquement — RBAC).
 * PDF : impression navigateur ciblée sur #analytics-report (zéro dépendance,
 * les graphiques ApexCharts sont en SVG et s'impriment parfaitement).
 */

/** Ouvre la boîte d'impression → « Enregistrer au format PDF » */
export function exportPdf() {
  window.print()
}

// ── Rapport dédié (document distinct, pas la page) ───────────────────────────
export interface ReportPayload {
  user?: { prenom?: string; nom?: string; role?: string }
  perms: { finance?: boolean; fleet?: boolean; maintenance?: boolean }
  stats: any
  vehiculesCount: number
  interventionsCount: number
}

const tnd = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} TND`
const esc = (s: any) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))

/**
 * Génère un VRAI rapport : ouvre un nouvel onglet avec un document mis en page
 * (couverture XPARK, synthèse, tableaux) — volontairement différent du tableau
 * de bord interactif — et lance l'impression / « Enregistrer en PDF ».
 */
export function generateReport(p: ReportPayload) {
  const { stats: s, perms, user } = p
  const w = window.open('', '_blank')
  if (!w) {
    Swal.fire('Bloqué', 'Autorisez les fenêtres pop-up pour générer le rapport.', 'warning')
    return
  }

  const kpi = (label: string, value: string, accent: string) => `
    <div class="kpi" style="border-top:3px solid ${accent}">
      <div class="kpi-label">${esc(label)}</div>
      <div class="kpi-value">${esc(value)}</div>
    </div>`

  const kpis = [
    kpi('Missions (6 mois)', String(s.missionsParMois.reduce((a: number, m: any) => a + m.value, 0)), '#405189'),
    kpi('Taux de réalisation', `${s.tauxRealisation}%`, '#0ab39c'),
    kpi('Distance totale', `${Math.round(s.distanceTotale).toLocaleString('fr-FR')} km`, '#f7b84b'),
    kpi('Disponibilité flotte', `${s.tauxDisponibilite}%`, '#299cdb'),
    ...(perms.finance ? [
      kpi('Revenus (6 mois)', tnd(s.revenusTotal), '#0ab39c'),
      kpi('Coûts (6 mois)', tnd(s.coutsTotal), '#f06548'),
      kpi('Marge nette', tnd(s.revenusTotal - s.coutsTotal), '#6f42c1'),
      kpi('Panier moyen', tnd(s.panierMoyen), '#f7b84b'),
    ] : []),
  ].join('')

  const rows = (items: [string, string][]) =>
    items.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="num">${esc(b)}</td></tr>`).join('')

  const missionsTable = rows([
    ['En attente', String(s.missionsParStatut.enAttente)],
    ['En cours', String(s.missionsParStatut.enCours)],
    ['Terminées', String(s.missionsParStatut.terminees)],
    ['Annulées', String(s.missionsParStatut.annulees)],
  ])

  const topDestTable = (s.topDestinations ?? []).slice(0, 6)
    .map((d: any) => `<tr><td>${esc(d.x)}</td><td class="num">${d.y}</td></tr>`).join('')

  const topClientsTable = perms.finance
    ? (s.topClients ?? []).map((c: any) => `<tr><td>${esc(c.label)}</td><td class="num">${tnd(c.value)}</td></tr>`).join('')
    : ''

  const financeBlock = perms.finance ? `
    <div class="section">
      <h3>Top clients par revenus</h3>
      <table><thead><tr><th>Client</th><th class="num">Revenus</th></tr></thead>
      <tbody>${topClientsTable || '<tr><td colspan="2" class="muted">Aucun</td></tr>'}</tbody></table>
    </div>` : ''

  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
  <title>XPARK — Rapport de performance</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #212529; margin: 0; padding: 32px 40px; }
    .cover { background: linear-gradient(135deg,#405189 0%,#2a3a6b 100%); color:#fff; border-radius:14px; padding:28px 32px; margin-bottom:28px; }
    .cover h1 { margin:0 0 6px; font-size:26px; letter-spacing:.5px; }
    .cover p { margin:0; opacity:.85; font-size:13px; }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
    .kpi { border:1px solid #e9ecef; border-radius:10px; padding:14px 16px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    .kpi-label { text-transform:uppercase; font-size:10.5px; font-weight:700; color:#6c757d; letter-spacing:.4px; }
    .kpi-value { font-size:22px; font-weight:800; margin-top:4px; }
    .section { margin-bottom:24px; break-inside:avoid; }
    .section h3 { font-size:14px; text-transform:uppercase; letter-spacing:.4px; color:#405189; border-bottom:2px solid #eef0f4; padding-bottom:6px; margin:0 0 10px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    table { width:100%; border-collapse:collapse; }
    th,td { text-align:left; padding:7px 10px; font-size:12.5px; border-bottom:1px solid #f0f1f4; }
    th { color:#6c757d; text-transform:uppercase; font-size:10.5px; letter-spacing:.3px; }
    td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; }
    .muted { color:#adb5bd; }
    footer { margin-top:28px; padding-top:12px; border-top:1px solid #eef0f4; font-size:11px; color:#adb5bd; text-align:center; }
    @media print { body { padding:0; } .cover { border-radius:0; } }
  </style></head><body>
    <div class="cover">
      <h1>XPARK — Rapport de performance</h1>
      <p>Généré le ${new Date().toLocaleString('fr-FR')}${user ? ` · par ${esc(user.prenom)} ${esc(user.nom)} (${esc(user.role)})` : ''}</p>
    </div>

    <div class="section"><h3>Synthèse</h3><div class="kpis">${kpis}</div></div>

    <div class="grid2">
      <div class="section">
        <h3>Missions par statut</h3>
        <table><thead><tr><th>Statut</th><th class="num">Nombre</th></tr></thead><tbody>${missionsTable}</tbody></table>
      </div>
      <div class="section">
        <h3>Top destinations</h3>
        <table><thead><tr><th>Destination</th><th class="num">Missions</th></tr></thead>
        <tbody>${topDestTable || '<tr><td colspan="2" class="muted">Aucune</td></tr>'}</tbody></table>
      </div>
    </div>

    ${financeBlock}

    <div class="section">
      <h3>Flotte & maintenance</h3>
      <table><tbody>
        <tr><td>Véhicules au parc</td><td class="num">${p.vehiculesCount}</td></tr>
        <tr><td>Disponibilité</td><td class="num">${s.tauxDisponibilite}%</td></tr>
        <tr><td>Interventions enregistrées</td><td class="num">${p.interventionsCount}</td></tr>
        ${perms.finance ? `<tr><td>Coût total maintenance</td><td class="num">${tnd(s.coutMaintenance)}</td></tr>` : ''}
      </tbody></table>
    </div>

    <footer>XPARK GMAO — Rapport confidentiel — © ${new Date().getFullYear()}</footer>
  </body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}

/** Synthèse texte du rapport (pour partage / presse-papiers) */
export function buildSummary(kpis: KPI[], extra: string[] = []): string {
  const lignes = [
    `📊 XPARK — Rapport de performance (${new Date().toLocaleDateString('fr-FR')})`,
    '',
    ...kpis.slice(0, 8).map(k => `• ${k.nom} : ${k.valeur} ${k.unite || ''}`.trim()),
    ...extra,
    '',
    `Rapport complet : ${window.location.href}`,
  ]
  return lignes.join('\n')
}

/** Partage natif (navigator.share) avec repli presse-papiers */
export async function shareReport(summary: string) {
  const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> }
  if (nav.share) {
    try {
      await nav.share({
        title: 'XPARK — Rapport de performance',
        text: summary,
        url: window.location.href,
      })
      return
    } catch {
      /* partage annulé par l'utilisateur → rien à faire */
      return
    }
  }
  try {
    await navigator.clipboard.writeText(summary)
    Swal.fire({
      title: 'Copié !',
      text: 'La synthèse du rapport est dans le presse-papiers — collez-la dans un email ou un message.',
      icon: 'success',
      timer: 2200,
      showConfirmButton: false,
    })
  } catch {
    Swal.fire('Erreur', 'Impossible de copier la synthèse.', 'error')
  }
}

/** CSS d'impression + quelques styles écran du nouveau design Analyses */
export const PRINT_CSS = `
.analytics-hero { border-radius: 14px; }
.live-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#0ab39c;
  box-shadow:0 0 0 0 rgba(255,255,255,.7); animation: livepulse 1.8s infinite; vertical-align:middle; }
@keyframes livepulse {
  0% { box-shadow:0 0 0 0 rgba(255,255,255,.6); }
  70% { box-shadow:0 0 0 7px rgba(255,255,255,0); }
  100% { box-shadow:0 0 0 0 rgba(255,255,255,0); }
}
.kpi-tile { transition: transform .15s ease, box-shadow .15s ease; }
.kpi-tile:hover { transform: translateY(-3px); box-shadow: 0 .5rem 1.25rem rgba(0,0,0,.08) !important; }
.chart-card { transition: box-shadow .15s ease; border-radius: 12px; }
.chart-card:hover { box-shadow: 0 .5rem 1.25rem rgba(0,0,0,.07) !important; }
@media print {
  body * { visibility: hidden !important; }
  #analytics-report, #analytics-report * { visibility: visible !important; }
  #analytics-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0 12px; }
  #analytics-report .no-print { display: none !important; }
  #analytics-report .print-only { display: block !important; }
  .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; break-inside: avoid; }
}
#analytics-report .print-only { display: none; }
`
