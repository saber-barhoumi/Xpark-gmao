import { useMemo, useState, type ReactNode } from 'react'
import { Button, Card, Form, InputGroup, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

/**
 * Tableau analytique réutilisable : recherche, tri par colonne, filtre et
 * pagination. Utilisé sous les graphiques des Analyses pour donner accès aux
 * chiffres détaillés, un graphique ne permettant pas de lire une valeur
 * précise ni de retrouver une ligne.
 */

export interface Colonne<T> {
  cle:     string
  titre:   string
  /** Valeur affichée (JSX autorisé). */
  rendu:   (ligne: T) => ReactNode
  /** Valeur utilisée pour le tri ; absente = colonne non triable. */
  valeur?: (ligne: T) => number | string
  align?:  'start' | 'end' | 'center'
}

interface DataTableProps<T> {
  titre:       string
  icone?:      string
  colonnes:    Colonne<T>[]
  lignes:      T[]
  /** Champs concaténés pour la recherche libre. */
  recherchable?: (ligne: T) => string
  /** Filtre optionnel : libellé + options + accesseur. */
  filtre?: {
    label:   string
    options: string[]
    valeur:  (ligne: T) => string
  }
  pageSize?:   number
  videTexte?:  string
}

export default function DataTable<T>({
  titre, icone, colonnes, lignes, recherchable, filtre,
  pageSize = 8, videTexte = 'Aucune donnée sur ce périmètre.',
}: DataTableProps<T>) {
  const [recherche, setRecherche] = useState('')
  const [filtreVal, setFiltreVal] = useState('')
  const [triCle, setTriCle]       = useState<string | null>(null)
  const [triSens, setTriSens]     = useState<'asc' | 'desc'>('desc')
  const [page, setPage]           = useState(1)

  const filtrees = useMemo(() => {
    let list = [...lignes]
    if (filtre && filtreVal) list = list.filter(l => filtre.valeur(l) === filtreVal)
    const q = recherche.trim().toLowerCase()
    if (q && recherchable) list = list.filter(l => recherchable(l).toLowerCase().includes(q))

    if (triCle) {
      const col = colonnes.find(c => c.cle === triCle)
      if (col?.valeur) {
        list.sort((a, b) => {
          const va = col.valeur!(a), vb = col.valeur!(b)
          const cmp = typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb))
          return triSens === 'asc' ? cmp : -cmp
        })
      }
    }
    return list
  }, [lignes, recherche, filtreVal, triCle, triSens, colonnes, filtre, recherchable])

  const totalPages   = Math.max(1, Math.ceil(filtrees.length / pageSize))
  const pageCourante = Math.min(page, totalPages)
  const visibles     = filtrees.slice((pageCourante - 1) * pageSize, pageCourante * pageSize)

  const trier = (cle: string) => {
    setPage(1)
    if (triCle === cle) setTriSens(s => (s === 'asc' ? 'desc' : 'asc'))
    else { setTriCle(cle); setTriSens('desc') }
  }

  return (
    <Card className="border-0 shadow-sm h-100 chart-card">
      <Card.Header className="bg-transparent border-0 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2">
          {icone && <IconifyIcon icon={icone} className="text-primary" />}
          {titre}
          <span className="text-muted fw-normal fs-13">({filtrees.length})</span>
        </h5>
        <div className="d-flex gap-2 flex-wrap no-print">
          {filtre && (
            <Form.Select size="sm" style={{ width: 150 }} value={filtreVal}
              onChange={e => { setFiltreVal(e.target.value); setPage(1) }}>
              <option value="">{filtre.label}</option>
              {filtre.options.map(o => <option key={o} value={o}>{o}</option>)}
            </Form.Select>
          )}
          {recherchable && (
            <InputGroup size="sm" style={{ width: 190 }}>
              <InputGroup.Text className="bg-light"><IconifyIcon icon="ri:search-line" /></InputGroup.Text>
              <Form.Control placeholder="Rechercher…" value={recherche}
                onChange={e => { setRecherche(e.target.value); setPage(1) }} />
            </InputGroup>
          )}
        </div>
      </Card.Header>
      <Card.Body className="pt-0">
        {filtrees.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">{videTexte}</p>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover size="sm" className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {colonnes.map(c => (
                      <th key={c.cle}
                        className={`text-${c.align ?? 'start'} ${c.valeur ? 'user-select-none' : ''}`}
                        role={c.valeur ? 'button' : undefined}
                        onClick={c.valeur ? () => trier(c.cle) : undefined}>
                        <span className="d-inline-flex align-items-center gap-1">
                          {c.titre}
                          {c.valeur && (
                            <IconifyIcon
                              icon={triCle === c.cle
                                ? (triSens === 'asc' ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line')
                                : 'ri:arrow-up-down-line'}
                              className={triCle === c.cle ? 'text-primary' : 'opacity-50'} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((l, i) => (
                    <tr key={i}>
                      {colonnes.map(c => (
                        <td key={c.cle} className={`text-${c.align ?? 'start'}`}>{c.rendu(l)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top no-print">
                <span className="text-muted fs-13">Page {pageCourante} / {totalPages}</span>
                <div className="btn-group btn-group-sm">
                  <Button variant="outline-secondary" disabled={pageCourante === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <IconifyIcon icon="ri:arrow-left-s-line" />
                  </Button>
                  <Button variant="outline-secondary" disabled={pageCourante === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    <IconifyIcon icon="ri:arrow-right-s-line" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  )
}
