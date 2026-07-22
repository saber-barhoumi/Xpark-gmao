import { Alert, Card, CardBody, Col, Spinner } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import useCalendar from '../useCalendar'
import Calendar from './Calendar'
import EventDetails from './EventDetails'
import SidePanel from './SidePanel'

const CalendarPage = () => {
  const {
    events, allEvents, isLoading, error, failedSources,
    filters, setFilter, toggleType, resetFilters, isFiltered,
    typeOptions, vehiculeOptions, employeeOptions, clientOptions,
    selected, onEventClick, closeDetails, reload,
  } = useCalendar()

  return (
    <>
      <Col xl={3}>
        <Card>
          <CardBody>
            <SidePanel
              filters={filters}
              typeOptions={typeOptions}
              vehiculeOptions={vehiculeOptions}
              employeeOptions={employeeOptions}
              clientOptions={clientOptions}
              isFiltered={isFiltered}
              total={allEvents.length}
              affiches={events.length}
              onToggleType={toggleType}
              onSetFilter={setFilter}
              onReset={resetFilters}
              onReload={reload}
            />
          </CardBody>
        </Card>
      </Col>

      <Col xl={9}>
        <Card>
          <CardBody>
            {error && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <IconifyIcon icon="tabler:alert-circle" /> {error}
              </Alert>
            )}

            {/* Dégradation partielle : on nomme les sources indisponibles au
                lieu d'afficher un calendrier vide sans explication. */}
            {!error && failedSources.length > 0 && (
              <Alert variant="warning" className="d-flex align-items-center gap-2">
                <IconifyIcon icon="tabler:plug-connected-x" />
                Source(s) indisponible(s) : {failedSources.join(', ')}. Les autres
                événements restent affichés.
              </Alert>
            )}

            {isLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2 mb-0">Chargement des événements…</p>
              </div>
            ) : (
              <Calendar events={events} onEventClick={onEventClick} />
            )}
          </CardBody>
        </Card>
      </Col>

      <EventDetails event={selected} open={!!selected} toggle={closeDetails} />
    </>
  )
}

export default CalendarPage
