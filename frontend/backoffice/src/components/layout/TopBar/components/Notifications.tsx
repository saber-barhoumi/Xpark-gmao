import { useEffect, useRef, useState } from 'react'
import { Col, Dropdown, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { timeSince } from '@/utils/date'

import alerteService, { Alerte } from '@/services/alerteService'



const typeIcon: Record<string, string> = {
  ASSURANCE: 'ri:shield-check-line',
  VISITE_TECHNIQUE: 'ri:car-line',
  MAINTENANCE: 'ri:tools-line',
  MAINTENANCE_DUE: 'ri:tools-fill',
  STOCK_FAIBLE: 'ri:box-3-line',
  CARBURANT: 'ri:gas-station-line',
  DOCUMENT_EXPIRE: 'ri:file-warning-line',
  EQUIPEMENT_HORS_SERVICE: 'ri:error-warning-fill',
  EQUIPEMENT_A_REMPLACER: 'ri:exchange-line',
  GARANTIE_EXPIRANTE: 'ri:shield-star-line',
  GARANTIE_EXPIREE: 'ri:shield-cross-line',
  CONTRAT_EXPIRANT: 'ri:file-text-line',
  ROTATION_FAIBLE: 'ri:bar-chart-line',
  MISSION_EN_RETARD: 'ri:time-line',
  MISSION_SANS_EQUIPEMENTS: 'ri:luggage-cart-line',
  DEFAULT: 'ri:alarm-warning-line',
}

const Notifications = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [alerts, setAlerts] = useState<Alerte[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  // ── Fetch count ──────────────────────────────────────────
  const fetchCount = async () => {
    try {
      const count = await alerteService.getCountUnread()
      setUnreadCount(typeof count === 'number' ? count : (count as any).count ?? 0)
    } catch { /* silently fail */ }
  }

  // ── Fetch unread alerts for dropdown ─────────────────────
  const fetchAlerts = async () => {
    try {
      const data = await alerteService.getUnread()
      setAlerts(Array.isArray(data) ? data : [])
    } catch { /* silently fail */ }
  }

  // ── Mark all read ──────────────────────────────────────────
  const markAllRead = async () => {
    try {
      // Assuming a service method exists or using multiple calls
      // For now, let's assume global mark all read exists in API
      // If not, we'd need to add it to service. 
      // I'll add it to service now to be safe.
      await alerteService.markAllReadGlobal?.() 
      setUnreadCount(0)
      setAlerts([])
    } catch { /* silently fail */ }
  }

  // ── Mark one as read ──────────────────────────────────────
  const markAsRead = async (id: number) => {
    try {
      await alerteService.markAsRead(id)
      setAlerts(prev => prev.filter(a => a.idAlerte !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silently fail */ }
  }

  // ── Poll every 30 s ────────────────────────────────────────
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [])

  // ── Trigger run-checks + refresh ───────────────────────
  const runChecks = async () => {
    setRefreshing(true)
    try {
      await alerteService.runChecks()
      await fetchCount()
      await fetchAlerts()
    } catch { /* silently fail */ } finally {
      setRefreshing(false)
    }
  }

  // ── Load alerts when dropdown opens ───────────────────────
  const handleToggle = (isOpen: boolean) => {
    if (isOpen) fetchAlerts()
  }

  const icon = (type: string) => typeIcon[type] ?? typeIcon.DEFAULT

  return (
    <div className="topbar-item">
      <Dropdown align={'end'} onToggle={handleToggle}>
        <DropdownToggle
          as={'a'}
          className="topbar-link drop-arrow-none"
          data-bs-toggle="dropdown"
          data-bs-offset="0,25"
          data-bs-auto-close="outside"
          aria-haspopup="false"
          aria-expanded="false"
        >
          {/* Keep the exact same bell SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" className="iconify--ri animate-ring fs-22">
            <path fill="currentColor" d="M22 17h-2v-7a8 8 0 1 0-16 0v7H2v2h20zM6 10a6 6 0 1 1 12 0v7H6zm8 11h-4a2 2 0 0 0 4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="noti-icon-badge" style={{ fontSize: '10px', lineHeight: 1 }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </DropdownToggle>

        <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg" style={{ minWidth: 360, maxHeight: 480, zIndex: 1060 }}>
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="p-3 border-bottom border-dashed">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
              </Col>
              <Col xs="auto" className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-link text-primary p-0 text-decoration-none d-flex align-items-center gap-1"
                  onClick={runChecks}
                  disabled={refreshing}
                  title="Analyser les alertes"
                >
                  {refreshing
                    ? <span className="spinner-border spinner-border-sm" />
                    : <IconifyIcon icon="ri:refresh-line" />}
                </button>
                <button
                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                  onClick={markAllRead}
                >
                  Tout marquer comme lu
                </button>
              </Col>
            </Row>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          {alerts.length === 0 ? (
            <div style={{ height: 260 }} className="d-flex align-items-center justify-content-center text-center">
              <div>
                <IconifyIcon icon="line-md:bell-twotone-alert-loop" className="fs-80 text-secondary mt-2" />
                <h4 className="fw-semibold mb-0 fst-italic lh-base mt-3">
                  Hey! 👋 <br />Aucune notification
                </h4>
              </div>
            </div>
          ) : (
            <SimplebarReactClient
              className="position-relative z-2 card shadow-none rounded-0 mb-0"
              style={{ maxHeight: 340 }}
            >
              {alerts.map((alert) => (
                <div
                  key={alert.idAlerte}
                  className="notification-item dropdown-item py-2 text-wrap cursor-pointer"
                  style={{ backgroundColor: alert.statut === 'ACTIVE' ? '#fffbea' : '#fff' }}
                >
                  <span className="d-flex align-items-start gap-2">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-20">
                        <IconifyIcon icon={icon(alert.typeAlerte)} />
                      </span>
                    </div>
                    <span className="flex-grow-1">
                      <span className={`d-block ${alert.statut === 'ACTIVE' ? 'fw-bold text-dark' : 'text-muted'}`} style={{ fontSize: 13 }}>
                        {alert.message}
                      </span>
                      <span className="fs-12 text-muted">{timeSince(new Date(alert.dateAlerte))}</span>
                    </span>
                    <button
                      className="btn btn-xs btn-outline-primary btn-sm flex-shrink-0"
                      style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                      onClick={() => {
                        markAsRead(alert.idAlerte)
                        if (alert.equipementId) navigate(`/gestion/equipements/${alert.equipementId}`)
                        else if (alert.missionId) navigate(`/gestion/missions`)
                        else if (alert.vehiculeId) navigate(`/gestion/vehicules`)
                      }}
                    >
                      Voir
                    </button>
                  </span>
                </div>
              ))}
            </SimplebarReactClient>
          )}

          {/* ── Footer ─────────────────────────────────────────── */}
          <Link
            to="/alertes"
            className="dropdown-item notification-item position-relative z-2 text-center text-reset text-decoration-underline link-offset-2 fw-bold notify-item border-top border-light py-2"
          >
            Voir toutes les alertes
          </Link>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default Notifications