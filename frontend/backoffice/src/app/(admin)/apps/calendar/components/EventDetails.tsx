import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import type { EventInput } from '@fullcalendar/core'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { TYPE_COLORS, TYPE_LABELS, type XparkEventProps } from '@/services/calendarService'

/**
 * Détail d'un événement du calendrier.
 * Le calendrier étant une PROJECTION en lecture seule, ce panneau n'édite rien :
 * il renseigne, puis renvoie vers le module propriétaire de la donnée — c'est
 * là que vivent les règles métier et le RBAC d'écriture.
 */
const EventDetails = ({
  event, open, toggle,
}: { event: EventInput | null; open: boolean; toggle: () => void }) => {
  const navigate = useNavigate()
  if (!event) return null

  const p = event.extendedProps as XparkEventProps

  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      ...(event.allDay ? {} : { hour: '2-digit', minute: '2-digit' }),
    })
  }

  const ligne = (label: string, valeur?: string | number | null) =>
    valeur === undefined || valeur === null || valeur === '' ? null : (
      <div className="d-flex justify-content-between border-bottom py-2">
        <span className="text-muted">{label}</span>
        <span className="fw-semibold text-end">{valeur}</span>
      </div>
    )

  const ouvrirModule = () => {
    toggle()
    navigate(p.module)
  }

  return (
    <Modal show={open} onHide={toggle} centered>
      <ModalHeader closeButton>
        <ModalTitle as="h5" className="d-flex align-items-center gap-2">
          <span
            className={`${TYPE_COLORS[p.type]} rounded-circle d-inline-block`}
            style={{ width: 12, height: 12 }}
          />
          {TYPE_LABELS[p.type]}
        </ModalTitle>
      </ModalHeader>

      <ModalBody>
        <h5 className="mb-3">{event.title}</h5>

        {p.statut && (
          <Badge bg={p.statut === 'EXPIREE' ? 'danger' : 'light'}
                 text={p.statut === 'EXPIREE' ? undefined : 'dark'}
                 className="mb-3">
            {p.statut}
          </Badge>
        )}

        <div className="mt-2">
          {ligne('Début',      formatDate(event.start as string))}
          {event.end ? ligne('Fin', formatDate(event.end as string)) : null}
          {ligne('Véhicule',   p.immatriculation)}
          {ligne('Intervenant', p.chauffeurNom)}
          {ligne('Client',     p.clientNom)}
          {ligne('Référence',  `#${p.refId}`)}
        </div>

        {p.description && (
          <p className="text-muted mt-3 mb-0">{p.description}</p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="light" onClick={toggle}>Fermer</Button>
        <Button variant="primary" onClick={ouvrirModule}>
          <IconifyIcon icon="tabler:external-link" className="me-1" />
          Ouvrir dans le module
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default EventDetails
