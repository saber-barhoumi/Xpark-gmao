import { Badge, Button, Form } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { TYPE_COLORS, type CalendarEventType } from '@/services/calendarService'
import type { CalendarFilters, FilterOption } from '../useCalendar'

interface TypeOption { type: CalendarEventType; label: string; count: number }

interface SidePanelProps {
  filters:         CalendarFilters
  typeOptions:     TypeOption[]
  vehiculeOptions: FilterOption[]
  employeeOptions: FilterOption[]
  clientOptions:   FilterOption[]
  isFiltered:      boolean
  total:           number
  affiches:        number
  onToggleType:    (t: CalendarEventType) => void
  onSetFilter:     <K extends keyof CalendarFilters>(k: K, v: CalendarFilters[K]) => void
  onReset:         () => void
  onReload:        () => void
}

/** Panneau de filtres du calendrier métier (type, véhicule, chauffeur, client, dates). */
const SidePanel = ({
  filters, typeOptions, vehiculeOptions, employeeOptions, clientOptions,
  isFiltered, total, affiches, onToggleType, onSetFilter, onReset, onReload,
}: SidePanelProps) => {
  /** Liste déroulante générique — évite de répéter 3 fois le même bloc. */
  const renderSelect = (
    label: string, icon: string, options: FilterOption[],
    value: number | null, cle: 'vehiculeId' | 'employeeId' | 'clientId',
  ) => (
    <div className="mb-3">
      <Form.Label className="fw-semibold d-flex align-items-center gap-1">
        <IconifyIcon icon={icon} className="fs-16" /> {label}
      </Form.Label>
      <Form.Select
        size="sm"
        value={value ?? ''}
        disabled={options.length === 0}
        onChange={e => onSetFilter(cle, e.target.value ? Number(e.target.value) : null)}>
        <option value="">
          {options.length ? `Tous (${options.length})` : 'Aucun'}
        </option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </Form.Select>
    </div>
  )

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 d-flex align-items-center gap-1">
          <IconifyIcon icon="tabler:filter" className="fs-18" /> Filtres
        </h5>
        <Button variant="light" size="sm" onClick={onReload} title="Rafraîchir">
          <IconifyIcon icon="tabler:refresh" />
        </Button>
      </div>

      <p className="text-muted small mb-3">
        <strong>{affiches}</strong> événement{affiches > 1 ? 's' : ''} affiché
        {affiches > 1 ? 's' : ''} sur {total}
      </p>

      {/* ── Type d'événement ── */}
      <div className="mb-3">
        <Form.Label className="fw-semibold d-flex align-items-center gap-1">
          <IconifyIcon icon="tabler:category" className="fs-16" /> Type d’événement
        </Form.Label>
        {typeOptions.length === 0 && (
          <p className="text-muted small mb-0">Aucun événement chargé.</p>
        )}
        <div className="d-flex flex-column gap-1">
          {typeOptions.map(({ type, label, count }) => {
            const actif = filters.types.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => onToggleType(type)}
                className={`external-event d-flex align-items-center justify-content-between border-0 rounded px-2 py-1 text-start ${
                  actif ? 'bg-light fw-semibold' : 'bg-transparent'
                }`}>
                <span className="d-flex align-items-center gap-2">
                  <span
                    className={`${TYPE_COLORS[type]} rounded-circle d-inline-block`}
                    style={{ width: 10, height: 10 }}
                  />
                  {label}
                </span>
                <Badge bg="light" text="dark">{count}</Badge>
              </button>
            )
          })}
        </div>
        {filters.types.length > 0 && (
          <p className="text-muted small mt-1 mb-0">
            {filters.types.length} type(s) sélectionné(s)
          </p>
        )}
      </div>

      <hr />

      {renderSelect('Véhicule', 'tabler:car',    vehiculeOptions, filters.vehiculeId, 'vehiculeId')}
      {renderSelect('Chauffeur / technicien', 'tabler:user', employeeOptions, filters.employeeId, 'employeeId')}
      {renderSelect('Client',   'tabler:building-store', clientOptions, filters.clientId, 'clientId')}

      {/* ── Plage de dates ── */}
      <div className="mb-3">
        <Form.Label className="fw-semibold d-flex align-items-center gap-1">
          <IconifyIcon icon="tabler:calendar" className="fs-16" /> Période
        </Form.Label>
        <Form.Control
          type="date" size="sm" className="mb-1"
          value={filters.dateFrom}
          onChange={e => onSetFilter('dateFrom', e.target.value)}
        />
        <Form.Control
          type="date" size="sm"
          value={filters.dateTo}
          onChange={e => onSetFilter('dateTo', e.target.value)}
        />
      </div>

      {isFiltered && (
        <div className="d-grid">
          <Button variant="outline-secondary" size="sm" onClick={onReset}>
            <IconifyIcon icon="tabler:x" className="me-1" />
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </>
  )
}

export default SidePanel
