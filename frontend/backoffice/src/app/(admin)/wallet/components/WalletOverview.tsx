import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import type { WalletStats } from '@/services/walletService'

const tnd = (n: number) => n.toLocaleString('fr-FR') + ' TND'

/** Solde principal + indicateurs entrées / sorties / net / en attente. */
const WalletOverview = ({ stats }: { stats: WalletStats }) => {
  const kpis = [
    { label: 'Entrées',    value: tnd(stats.totalIn),  icon: 'ri:arrow-down-circle-line', color: 'success' },
    { label: 'Sorties',    value: tnd(stats.totalOut), icon: 'ri:arrow-up-circle-line',   color: 'danger'  },
    { label: 'Flux net',   value: tnd(stats.net),      icon: 'ri:swap-line',              color: stats.net >= 0 ? 'success' : 'danger' },
    { label: 'En attente', value: String(stats.pending), icon: 'ri:time-line',            color: 'warning' },
  ]
  return (
    <Row className="g-3">
      <Col xl={4}>
        <Card className="border-0 shadow-sm h-100 text-white" style={{ background: 'linear-gradient(135deg,#727cf5 0%,#5561d0 100%)' }}>
          <CardBody>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="mb-1 opacity-75">Solde de trésorerie</p>
                <h2 className="mb-0 fw-bold text-white">{tnd(stats.balance)}</h2>
              </div>
              <IconifyIcon icon="ri:wallet-3-line" className="fs-36 opacity-50" />
            </div>
            <div className="d-flex gap-3 mt-4">
              <div>
                <p className="mb-0 fs-12 opacity-75">Entrées (période)</p>
                <h5 className="text-white mb-0">{tnd(stats.totalIn)}</h5>
              </div>
              <div>
                <p className="mb-0 fs-12 opacity-75">Sorties (période)</p>
                <h5 className="text-white mb-0">{tnd(stats.totalOut)}</h5>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col xl={8}>
        <Row className="g-3 h-100">
          {kpis.map((k, i) => (
            <Col md={3} sm={6} key={i}>
              <Card className="border-0 shadow-sm h-100">
                <CardBody>
                  <div className={`avatar-sm bg-soft-${k.color} rounded-circle d-flex align-items-center justify-content-center mb-2`}>
                    <IconifyIcon icon={k.icon} className={`fs-22 text-${k.color}`} />
                  </div>
                  <p className="text-muted mb-1 fs-13">{k.label}</p>
                  <h5 className={`mb-0 fw-bold text-${k.color}`}>{k.value}</h5>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  )
}

export default WalletOverview
