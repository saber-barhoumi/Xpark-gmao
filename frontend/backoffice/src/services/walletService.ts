/**
 * ═══════════════════════════════════════════════════════════════════════════
 * walletService — trésorerie / portefeuille XPARK
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La page /wallet était un dashboard générique de template (composants State /
 * Count / Team / Profile… codés en dur, sans rapport avec la finance de
 * l'entreprise). On la recentre sur la trésorerie d'une société de transport :
 * solde, flux entrants (facturation encaissée) et sortants (carburant,
 * maintenance, assurance, salaires), historique et statistiques.
 *
 * Les données sont un mock : il n'existe pas encore d'agrégat « trésorerie »
 * cross-service. Elles pourraient à terme provenir de Finance (factures payées)
 * + Fleet (carburant) + Maintenance (coûts). Point de bascule : `getWallet()`.
 */

export type TxDirection = 'IN' | 'OUT'

export enum TxCategory {
  FACTURE     = 'Facture client',
  CARBURANT   = 'Carburant',
  MAINTENANCE = 'Maintenance',
  ASSURANCE   = 'Assurance',
  SALAIRE     = 'Salaires',
  AUTRE       = 'Autre',
}

export const CATEGORY_META: Record<TxCategory, { icon: string; variant: string }> = {
  [TxCategory.FACTURE]:     { icon: 'ri:bill-line',          variant: 'success'   },
  [TxCategory.CARBURANT]:   { icon: 'ri:gas-station-line',   variant: 'warning'   },
  [TxCategory.MAINTENANCE]: { icon: 'ri:tools-line',         variant: 'info'      },
  [TxCategory.ASSURANCE]:   { icon: 'ri:shield-check-line',  variant: 'primary'   },
  [TxCategory.SALAIRE]:     { icon: 'ri:team-line',          variant: 'secondary' },
  [TxCategory.AUTRE]:       { icon: 'ri:exchange-line',      variant: 'dark'      },
}

export type TxStatus = 'Validé' | 'En attente'

export interface Transaction {
  id:        number
  date:      string          // ISO
  label:     string
  category:  TxCategory
  direction: TxDirection
  amount:    number          // TND, positif
  method:    string          // Virement, Espèces, Carte…
  status:    TxStatus
}

export interface WalletData {
  balance:    number         // solde courant TND
  transactions: Transaction[]
  monthly:    { mois: string; entrees: number; sorties: number }[]
}

export interface WalletStats {
  balance:      number
  totalIn:      number
  totalOut:     number
  net:          number
  pending:      number       // nb transactions en attente
  byCategory:   { category: TxCategory; total: number }[]  // dépenses par catégorie
}

// ── Mock ─────────────────────────────────────────────────────────────────────
const TX: Transaction[] = [
  { id: 1,  date: '2026-07-21', label: 'FAC-202607-0006 — Leila Ben Youssef', category: TxCategory.FACTURE,     direction: 'IN',  amount: 1785,  method: 'Virement', status: 'Validé' },
  { id: 2,  date: '2026-07-20', label: 'Plein gasoil — 123 TUN 2020',         category: TxCategory.CARBURANT,   direction: 'OUT', amount: 240,   method: 'Carte',    status: 'Validé' },
  { id: 3,  date: '2026-07-19', label: 'FAC-202607-0005 — SARL Medina',       category: TxCategory.FACTURE,     direction: 'IN',  amount: 3120,  method: 'Virement', status: 'Validé' },
  { id: 4,  date: '2026-07-18', label: 'Remplacement plaquettes — 321',        category: TxCategory.MAINTENANCE, direction: 'OUT', amount: 480,   method: 'Espèces',  status: 'Validé' },
  { id: 5,  date: '2026-07-16', label: 'Prime assurance flotte T3',            category: TxCategory.ASSURANCE,   direction: 'OUT', amount: 2650,  method: 'Virement', status: 'Validé' },
  { id: 6,  date: '2026-07-15', label: 'FAC-202607-0004 — Transport Sud',      category: TxCategory.FACTURE,     direction: 'IN',  amount: 2240,  method: 'Virement', status: 'En attente' },
  { id: 7,  date: '2026-07-12', label: 'Salaires chauffeurs — juillet',        category: TxCategory.SALAIRE,     direction: 'OUT', amount: 8600,  method: 'Virement', status: 'Validé' },
  { id: 8,  date: '2026-07-10', label: 'Plein gasoil — 456 TUN 2019',          category: TxCategory.CARBURANT,   direction: 'OUT', amount: 275,   method: 'Carte',    status: 'Validé' },
  { id: 9,  date: '2026-07-08', label: 'FAC-202607-0003 — Ben Salem',          category: TxCategory.FACTURE,     direction: 'IN',  amount: 1560,  method: 'Espèces',  status: 'Validé' },
  { id: 10, date: '2026-07-05', label: 'Vidange + filtres — 789',              category: TxCategory.MAINTENANCE, direction: 'OUT', amount: 190,   method: 'Carte',    status: 'Validé' },
  { id: 11, date: '2026-07-03', label: 'FAC-202607-0002 — Logistique Nord',    category: TxCategory.FACTURE,     direction: 'IN',  amount: 4180,  method: 'Virement', status: 'Validé' },
  { id: 12, date: '2026-07-02', label: 'Péage autoroute — divers',             category: TxCategory.AUTRE,       direction: 'OUT', amount: 120,   method: 'Carte',    status: 'Validé' },
  { id: 13, date: '2026-06-28', label: 'FAC-202606-0011 — Medina',             category: TxCategory.FACTURE,     direction: 'IN',  amount: 2890,  method: 'Virement', status: 'Validé' },
  { id: 14, date: '2026-06-25', label: 'Plein gasoil — 123 TUN 2020',          category: TxCategory.CARBURANT,   direction: 'OUT', amount: 255,   method: 'Carte',    status: 'Validé' },
]

const MONTHLY = [
  { mois: 'Fév', entrees: 12400, sorties: 9800 },
  { mois: 'Mar', entrees: 15200, sorties: 11200 },
  { mois: 'Avr', entrees: 13800, sorties: 12600 },
  { mois: 'Mai', entrees: 17600, sorties: 12100 },
  { mois: 'Jun', entrees: 16050, sorties: 13400 },
  { mois: 'Jul', entrees: 14885, sorties: 12555 },
]

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

const walletService = {
  /** Remplacer par une agrégation Finance + Fleet + Maintenance le moment venu. */
  async getWallet(): Promise<WalletData> {
    await wait(500)
    return { balance: 48250, transactions: structuredClone(TX), monthly: MONTHLY }
  },

  computeStats(data: WalletData): WalletStats {
    const totalIn  = data.transactions.filter(t => t.direction === 'IN').reduce((s, t) => s + t.amount, 0)
    const totalOut = data.transactions.filter(t => t.direction === 'OUT').reduce((s, t) => s + t.amount, 0)
    const pending  = data.transactions.filter(t => t.status === 'En attente').length

    const catMap = new Map<TxCategory, number>()
    data.transactions.filter(t => t.direction === 'OUT')
      .forEach(t => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount))

    return {
      balance:    data.balance,
      totalIn, totalOut, net: totalIn - totalOut, pending,
      byCategory: [...catMap.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
    }
  },
}

export default walletService
