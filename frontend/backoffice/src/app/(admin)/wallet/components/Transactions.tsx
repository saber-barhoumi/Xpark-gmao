import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, Form, InputGroup, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { CATEGORY_META, TxCategory, type Transaction, type TxDirection } from '@/services/walletService'

const tnd = (n: number) => n.toLocaleString('fr-FR') + ' TND'
const PAGE_SIZE = 8

/** Historique des transactions : recherche, filtre direction/catégorie, pagination. */
const Transactions = ({ transactions }: { transactions: Transaction[] }) => {
  const [search, setSearch] = useState('')
  const [dir,    setDir]    = useState<TxDirection | 'ALL'>('ALL')
  const [cat,    setCat]    = useState<TxCategory | 'ALL'>('ALL')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (dir !== 'ALL') list = list.filter(t => t.direction === dir)
    if (cat !== 'ALL') list = list.filter(t => t.category === cat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(t => t.label.toLowerCase().includes(q) || t.method.toLowerCase().includes(q))
    }
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, dir, cat, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current    = Math.min(page, totalPages)
  const pageItems  = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom-0">
        <div>
          <h5 className="mb-0 fw-bold text-dark">Historique des transactions</h5>
          <p className="text-muted fs-12 mb-0">{filtered.length} opération(s)</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Select size="sm" style={{ width: 120 }} value={dir} onChange={e => { setDir(e.target.value as TxDirection | 'ALL'); setPage(1) }}>
            <option value="ALL">Tous flux</option>
            <option value="IN">Entrées</option>
            <option value="OUT">Sorties</option>
          </Form.Select>
          <Form.Select size="sm" style={{ width: 150 }} value={cat} onChange={e => { setCat(e.target.value as TxCategory | 'ALL'); setPage(1) }}>
            <option value="ALL">Toutes catégories</option>
            {Object.values(TxCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </Form.Select>
          <InputGroup size="sm" style={{ width: 200 }}>
            <InputGroup.Text className="bg-light"><IconifyIcon icon="ri:search-line" /></InputGroup.Text>
            <Form.Control placeholder="Rechercher…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </InputGroup>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {filtered.length === 0 ? (
          <div className="text-center text-muted py-5">
            <IconifyIcon icon="ri:exchange-funds-line" className="fs-48 mb-2 opacity-25" />
            <p className="mb-0">Aucune transaction ne correspond aux filtres.</p>
          </div>
        ) : (
          <>
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-3">Opération</th>
                  <th>Catégorie</th>
                  <th>Date</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                  <th className="text-end pe-3">Montant</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(t => {
                  const meta = CATEGORY_META[t.category]
                  const isIn = t.direction === 'IN'
                  return (
                    <tr key={t.id}>
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className={`avatar-sm bg-soft-${meta.variant} rounded-circle d-flex align-items-center justify-content-center`}>
                            <IconifyIcon icon={meta.icon} className={`fs-18 text-${meta.variant}`} />
                          </div>
                          <span className="fw-medium">{t.label}</span>
                        </div>
                      </td>
                      <td><Badge bg={`soft-${meta.variant}`} text={meta.variant as any} className="fw-normal">{t.category}</Badge></td>
                      <td>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                      <td className="text-muted">{t.method}</td>
                      <td>
                        <Badge bg={t.status === 'Validé' ? 'soft-success' : 'soft-warning'} text={t.status === 'Validé' ? 'success' : 'warning'} className="fw-normal">
                          {t.status}
                        </Badge>
                      </td>
                      <td className={`text-end pe-3 fw-bold text-${isIn ? 'success' : 'danger'}`}>
                        {isIn ? '+' : '−'} {tnd(t.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                <span className="text-muted fs-13">Page {current} / {totalPages}</span>
                <div className="btn-group btn-group-sm">
                  <Button variant="outline-secondary" disabled={current === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <IconifyIcon icon="ri:arrow-left-s-line" />
                  </Button>
                  <Button variant="outline-secondary" disabled={current === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    <IconifyIcon icon="ri:arrow-right-s-line" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default Transactions
