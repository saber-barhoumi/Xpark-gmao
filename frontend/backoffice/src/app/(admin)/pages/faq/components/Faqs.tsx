import { useMemo, useState } from 'react'
import { Accordion, Badge, Button, Card, CardBody, Col, Form, InputGroup, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { contactDetails, faqCategories, type FaqItem } from '../data'
import Question from './Question'

/** Met en évidence le terme recherché dans un texte. */
const highlight = (text: string, q: string) => {
  if (!q.trim()) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i === -1) return text
  return <>{text.slice(0, i)}<mark className="p-0 bg-warning-subtle">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>
}

const Faqs = () => {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')

  // Catégories filtrées par la recherche + l'onglet actif.
  const categories = useMemo(() => {
    const q = search.trim().toLowerCase()
    return faqCategories
      .filter(c => activeCat === 'all' || c.key === activeCat)
      .map(c => ({
        ...c,
        items: c.items.filter(it =>
          !q || it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q)),
      }))
      .filter(c => c.items.length > 0)
  }, [search, activeCat])

  const totalMatches = categories.reduce((s, c) => s + c.items.length, 0)

  return (
    <>
      {/* ── Hero + recherche ──────────────────────────────────────── */}
      <Card className="border-0 shadow-sm mb-3 overflow-hidden">
        <CardBody className="text-center py-5" style={{ background: 'linear-gradient(135deg,#727cf5 0%,#5561d0 100%)' }}>
          <IconifyIcon icon="tabler:help-hexagon" className="fs-48 text-white opacity-75 mb-2" />
          <h2 className="text-white fw-bold mb-1">Comment pouvons-nous vous aider ?</h2>
          <p className="text-white opacity-75 mb-4">Trouvez rapidement une réponse à vos questions sur XPARK GMAO</p>
          <div className="d-flex justify-content-center">
            <InputGroup style={{ maxWidth: 520 }}>
              <InputGroup.Text className="bg-white border-0"><IconifyIcon icon="tabler:search" className="fs-20" /></InputGroup.Text>
              <Form.Control className="border-0 py-2" placeholder="Rechercher une question…"
                            value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <Button variant="white" className="border-0" onClick={() => setSearch('')}>
                  <IconifyIcon icon="tabler:x" />
                </Button>
              )}
            </InputGroup>
          </div>
          {search && <p className="text-white opacity-75 mt-2 mb-0 fs-13">{totalMatches} résultat(s) trouvé(s)</p>}
        </CardBody>
      </Card>

      {/* ── Filtres par catégorie ─────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
        <Button variant={activeCat === 'all' ? 'primary' : 'light'} size="sm" onClick={() => setActiveCat('all')}>
          <IconifyIcon icon="tabler:list" className="me-1" /> Tout
        </Button>
        {faqCategories.map(c => (
          <Button key={c.key} variant={activeCat === c.key ? 'primary' : 'light'} size="sm" onClick={() => setActiveCat(c.key)}>
            <IconifyIcon icon={c.icon} className="me-1" /> {c.label}
            <Badge bg={activeCat === c.key ? 'light' : 'secondary'} text={activeCat === c.key ? 'primary' : undefined} className="ms-1">{c.items.length}</Badge>
          </Button>
        ))}
      </div>

      <Row>
        {/* ── Colonne FAQ ─────────────────────────────────────────── */}
        <Col xl={8}>
          {categories.length === 0 ? (
            <Card><CardBody className="text-center text-muted py-5">
              <IconifyIcon icon="tabler:mood-empty" className="fs-48 mb-2 opacity-25" />
              <p className="mb-1">Aucune question ne correspond à « {search} ».</p>
              <Button variant="link" size="sm" onClick={() => { setSearch(''); setActiveCat('all') }}>Réinitialiser</Button>
            </CardBody></Card>
          ) : categories.map(cat => (
            <Card key={cat.key} className="mb-3">
              <CardBody>
                <h4 className="mb-3 d-flex align-items-center gap-2 anchor" id={cat.key}>
                  <span className="avatar-sm bg-soft-primary rounded d-flex align-items-center justify-content-center">
                    <IconifyIcon icon={cat.icon} className="fs-22 text-primary" />
                  </span>
                  {cat.label}
                </h4>
                <Accordion defaultActiveKey="0" alwaysOpen={!!search}>
                  {cat.items.map((item: FaqItem, idx) => (
                    <Accordion.Item eventKey={`${idx}`} key={idx}>
                      <Accordion.Header>{highlight(item.question, search)}</Accordion.Header>
                      <Accordion.Body className="text-muted">{highlight(item.answer, search)}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </CardBody>
            </Card>
          ))}
        </Col>

        {/* ── Colonne contact / aide ──────────────────────────────── */}
        <Col xl={4}>
          <Card className="mb-3">
            <CardBody>
              <h5 className="mb-3">Besoin d'aide ?</h5>
              <div className="d-flex flex-column gap-3 mb-3">
                {contactDetails.map((c, i) => (
                  <div key={i} className="d-flex align-items-center gap-2">
                    <span className="avatar-sm bg-soft-primary rounded-circle d-flex align-items-center justify-content-center">
                      <IconifyIcon icon={c.icon} className="fs-20 text-primary" />
                    </span>
                    <div>
                      <p className="mb-0 fs-12 text-muted">{c.title}</p>
                      <span className="fw-semibold">{c.description}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-muted fs-13 mb-0">
                Vous ne trouvez pas votre réponse ? Posez votre question et notre équipe vous répondra.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h5 className="mb-3">Poser une question</h5>
              <Question />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Faqs
