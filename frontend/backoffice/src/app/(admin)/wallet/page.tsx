import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import walletService, { WalletData } from '@/services/walletService'
import WalletOverview from './components/WalletOverview'
import WalletCharts from './components/WalletCharts'
import Transactions from './components/Transactions'

const WalletPage = () => {
  const [data,    setData]    = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      setData(await walletService.getWallet())
    } catch {
      setError('Impossible de charger la trésorerie.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => (data ? walletService.computeStats(data) : null), [data])

  return (
    <>
      <PageBreadcrumb title="Trésorerie" subName="Finance" />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2 mb-0">Chargement de la trésorerie…</p>
        </div>
      ) : error || !data || !stats ? (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <span><IconifyIcon icon="ri:error-warning-line" className="me-2" />{error ?? 'Données indisponibles.'}</span>
          <Button size="sm" variant="outline-danger" onClick={load}>Réessayer</Button>
        </Alert>
      ) : (
        <div className="d-flex flex-column gap-3">
          <WalletOverview stats={stats} />
          <WalletCharts data={data} stats={stats} />
          <Transactions transactions={data.transactions} />
        </div>
      )}
    </>
  )
}

export default WalletPage
