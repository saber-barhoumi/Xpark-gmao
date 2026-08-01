import { Badge, Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { ContactClient } from '../useContacts'

/** Couleur du statut de compte (mêmes conventions que la page Utilisateurs). */
const STATUT_VARIANT: Record<string, string> = {
  ACTIF: 'success', EN_ATTENTE: 'warning', SUSPENDU: 'danger', DESACTIVE: 'secondary',
}

/** Initiales pour l'avatar (les comptes clients n'ont pas de photo par défaut). */
const initiales = (c: ContactClient) =>
  `${(c.prenom || '?')[0] ?? ''}${(c.nom || '')[0] ?? ''}`.toUpperCase() || '?'

const dateFr = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

interface ContactsProps {
  contacts: ContactClient[]
  onCreerMission?: (c: ContactClient) => void
}

/** Grille des fiches clients — présentation pure, pilotée par les props. */
const Contacts = ({ contacts, onCreerMission }: ContactsProps) => {
  return (
    <Row>
      {contacts.map(c => (
        <Col xl={3} sm={6} key={c.idUtilisateur}>
          <Card className="text-center h-100">
            <CardBody>
              <Dropdown align="end" className="float-end">
                <DropdownToggle as="a" role="button" className="text-body content-none pb-1">
                  <IconifyIcon icon="tabler:dots-vertical" className="fs-22" />
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                  <DropdownItem href={`mailto:${c.email}`}>
                    <IconifyIcon icon="tabler:mail" className="me-1" /> Envoyer un e-mail
                  </DropdownItem>
                  {c.telephone && (
                    <DropdownItem href={`tel:${c.telephone}`}>
                      <IconifyIcon icon="tabler:phone" className="me-1" /> Appeler
                    </DropdownItem>
                  )}
                  {onCreerMission && (
                    <DropdownItem onClick={() => onCreerMission(c)}>
                      <IconifyIcon icon="tabler:truck-delivery" className="me-1" /> Créer une mission
                    </DropdownItem>
                  )}
                  <div className="dropdown-divider" />
                  <DropdownItem as={Link} to="/gestion/missions">
                    <IconifyIcon icon="tabler:list-check" className="me-1" /> Voir les missions
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <div className="d-flex justify-content-center mt-1">
                <span className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-bold fs-24"
                  style={{ width: 72, height: 72 }}>
                  {initiales(c)}
                </span>
              </div>

              <h4 className="mt-3 mb-1">
                <span className="text-dark">{c.prenom} {c.nom}</span>
              </h4>

              <p className="text-muted mb-2">
                {c.nomSociete
                  ? <><IconifyIcon icon="tabler:building" className="me-1" />{c.nomSociete}</>
                  : <span className="fst-italic">Client particulier</span>}
                {c.ville && <> · {c.ville}</>}
              </p>

              <Badge bg={`soft-${STATUT_VARIANT[c.statut] ?? 'secondary'}`}
                text={STATUT_VARIANT[c.statut] ?? 'secondary'} className="mb-3 fw-normal">
                {c.statut}
              </Badge>

              {/* Coordonnées et activité réelles */}
              <div className="text-start small border-top pt-2">
                <div className="d-flex align-items-center gap-2 text-truncate mb-1">
                  <IconifyIcon icon="tabler:mail" className="text-muted flex-shrink-0" />
                  <a href={`mailto:${c.email}`} className="text-reset text-truncate">{c.email}</a>
                </div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <IconifyIcon icon="tabler:phone" className="text-muted flex-shrink-0" />
                  {c.telephone
                    ? <a href={`tel:${c.telephone}`} className="text-reset">{c.telephone}</a>
                    : <span className="text-muted">Non renseigné</span>}
                </div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <IconifyIcon icon="tabler:package" className="text-muted flex-shrink-0" />
                  <span>{c.nbMissions} mission{c.nbMissions > 1 ? 's' : ''}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <IconifyIcon icon="tabler:clock" className="text-muted flex-shrink-0" />
                  <span className="text-muted">
                    {c.derniereActivite ? `Dernière activité : ${dateFr(c.derniereActivite)}` : 'Aucune activité'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default Contacts
