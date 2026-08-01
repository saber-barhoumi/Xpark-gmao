import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatutMission } from '@/types/mission'
import type { AnalyticsFilters as Filtres } from './useAnalyticsData'

interface Option { id: number; label: string }

interface Props {
  filters: Filtres
  options: {
    clients: Option[]
    chauffeurs: Option[]
    vehicules: Option[]
    typesVehicule: string[]
    villes: string[]
  }
  isFiltered: boolean
  nbMissions: number
  onSet: <K extends keyof Filtres>(cle: K, valeur: Filtres[K]) => void
  onReset: () => void
}

/**
 * Barre de filtres des Analyses. Les valeurs proposées sont déduites des
 * données réellement chargées : on ne propose jamais un chauffeur ou une
 * destination qui n'existe dans aucune mission.
 */
const AnalyticsFilters = ({ filters, options, isFiltered, nbMissions, onSet, onReset }: Props) => {
  const selectNum = (
    label: string, icon: string, cle: 'clientId' | 'employeeId' | 'vehiculeId', opts: Option[],
  ) => (
    <Col xl={2} md={4} sm={6}>
      <Form.Label className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
        <IconifyIcon icon={icon} /> {label}
      </Form.Label>
      <Form.Select size="sm" value={filters[cle] ?? ''} disabled={opts.length === 0}
        onChange={e => onSet(cle, e.target.value ? Number(e.target.value) : null)}>
        <option value="">{opts.length ? `Tous (${opts.length})` : 'Aucun'}</option>
        {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </Form.Select>
    </Col>
  )

  return (
    <Card className="border-0 shadow-sm mb-4 no-print">
      <Card.Body className="py-3">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <IconifyIcon icon="tabler:filter" className="text-primary" /> Filtres d’analyse
            {isFiltered && (
              <Badge bg="soft-primary" text="primary" className="fw-normal">
                {nbMissions} mission{nbMissions > 1 ? 's' : ''} dans le périmètre
              </Badge>
            )}
          </h5>
          {isFiltered && (
            <Button variant="outline-secondary" size="sm" onClick={onReset}>
              <IconifyIcon icon="tabler:x" className="me-1" /> Réinitialiser
            </Button>
          )}
        </div>

        <Row className="g-2 align-items-end">
          {selectNum('Client', 'tabler:building-store', 'clientId', options.clients)}
          {selectNum('Chauffeur', 'tabler:user', 'employeeId', options.chauffeurs)}
          {selectNum('Véhicule', 'tabler:truck', 'vehiculeId', options.vehicules)}

          <Col xl={2} md={4} sm={6}>
            <Form.Label className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
              <IconifyIcon icon="tabler:flag" /> Statut
            </Form.Label>
            <Form.Select size="sm" value={filters.statut} onChange={e => onSet('statut', e.target.value)}>
              <option value="">Tous</option>
              {Object.values(StatutMission).map(s => (
                <option key={s} value={s}>{String(s).replace('_', ' ')}</option>
              ))}
            </Form.Select>
          </Col>

          <Col xl={2} md={4} sm={6}>
            <Form.Label className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
              <IconifyIcon icon="tabler:car" /> Type de véhicule
            </Form.Label>
            <Form.Select size="sm" value={filters.typeVehicule} disabled={options.typesVehicule.length === 0}
              onChange={e => onSet('typeVehicule', e.target.value)}>
              <option value="">Tous</option>
              {options.typesVehicule.map(t => <option key={t} value={t}>{t}</option>)}
            </Form.Select>
          </Col>

          <Col xl={2} md={4} sm={6}>
            <Form.Label className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
              <IconifyIcon icon="tabler:map-pin" /> Destination
            </Form.Label>
            <Form.Select size="sm" value={filters.ville} disabled={options.villes.length === 0}
              onChange={e => onSet('ville', e.target.value)}>
              <option value="">Toutes</option>
              {options.villes.map(v => <option key={v} value={v}>{v}</option>)}
            </Form.Select>
          </Col>

          <Col xl={3} md={6} sm={6}>
            <Form.Label className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
              <IconifyIcon icon="tabler:calendar" /> Du
            </Form.Label>
            <Form.Control size="sm" type="date" value={filters.dateFrom}
              onChange={e => onSet('dateFrom', e.target.value)} />
          </Col>
          <Col xl={3} md={6} sm={6}>
            <Form.Label className="fs-12 text-muted mb-1">Au</Form.Label>
            <Form.Control size="sm" type="date" value={filters.dateTo}
              onChange={e => onSet('dateTo', e.target.value)} />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default AnalyticsFilters
