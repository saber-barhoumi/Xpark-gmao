import { Alert, Button, Card, CardBody, Col, Form, InputGroup, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Contacts from './components/Contacts'
import useContacts from './useContacts'

/**
 * Annuaire des clients XPARK — 100 % dynamique (voir useContacts).
 * Remplace les contacts factices du template par les vrais comptes clients,
 * enrichis de leur activité (nombre de missions, dernière mission).
 */
const ContactPage = () => {
  const navigate = useNavigate()
  const {
    contacts, stats, loading, error,
    search, setSearch, statut, setStatut, reload,
  } = useContacts()

  const kpis = [
    { label: 'Clients',        value: stats.total,       icon: 'tabler:users',    color: 'primary' },
    { label: 'Entreprises',    value: stats.entreprises, icon: 'tabler:building', color: 'info' },
    { label: 'Comptes actifs', value: stats.actifs,      icon: 'tabler:circle-check', color: 'success' },
    { label: 'Avec missions',  value: stats.avecMission, icon: 'tabler:package',  color: 'warning' },
  ]

  return (
    <>
      <PageBreadcrumb title="Annuaire clients" subName="Clients & ventes" />

      {/* Synthèse */}
      <Row className="g-3 mb-3">
        {kpis.map((k, i) => (
          <Col xl={3} sm={6} key={i}>
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="d-flex align-items-center gap-3">
                <span className={`avatar-md bg-soft-${k.color} rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
                  <IconifyIcon icon={k.icon} className={`fs-24 text-${k.color}`} />
                </span>
                <div>
                  <h4 className={`mb-0 fw-bold text-${k.color}`}>{k.value}</h4>
                  <p className="text-muted mb-0 fs-13">{k.label}</p>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Barre de recherche / filtres */}
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="text-muted fs-14">
                <strong>{contacts.length}</strong> client{contacts.length > 1 ? 's' : ''} affiché{contacts.length > 1 ? 's' : ''}
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Form.Select size="sm" style={{ minWidth: 150 }} value={statut}
                  onChange={e => setStatut(e.target.value)}>
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIF">Actif</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="DESACTIVE">Désactivé</option>
                </Form.Select>
                <InputGroup size="sm" style={{ minWidth: 240 }}>
                  <InputGroup.Text className="bg-light"><IconifyIcon icon="tabler:search" /></InputGroup.Text>
                  <Form.Control placeholder="Nom, société, e-mail, ville…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </InputGroup>
                <Button variant="light" size="sm" onClick={reload} title="Actualiser">
                  <IconifyIcon icon="tabler:refresh" />
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2 mb-0">Chargement de l’annuaire…</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <span><IconifyIcon icon="tabler:alert-circle" className="me-2" />{error}</span>
          <Button size="sm" variant="outline-danger" onClick={reload}>Réessayer</Button>
        </Alert>
      ) : contacts.length === 0 ? (
        <Card><CardBody className="text-center text-muted py-5">
          <IconifyIcon icon="tabler:users-group" className="fs-48 mb-2 opacity-25" />
          <p className="mb-1">Aucun client ne correspond à votre recherche.</p>
          <Button variant="link" size="sm" onClick={() => { setSearch(''); setStatut('ALL') }}>
            Réinitialiser les filtres
          </Button>
        </CardBody></Card>
      ) : (
        <Contacts
          contacts={contacts}
          onCreerMission={c => navigate(`/gestion/missions?clientId=${c.idUtilisateur}`)}
        />
      )}
    </>
  )
}

export default ContactPage
