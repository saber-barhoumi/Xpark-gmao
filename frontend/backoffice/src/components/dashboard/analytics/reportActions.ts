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

/** CSS d'impression : n'imprime que le rapport, en pleine page */
export const PRINT_CSS = `
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
