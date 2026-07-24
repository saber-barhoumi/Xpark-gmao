import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { ProjectStatus } from '@/services/projectService'

export type SortKey = 'recent' | 'progress' | 'name' | 'due'

interface HeadProps {
  search:      string
  statut:      ProjectStatus | 'ALL'
  sortKey:     SortKey
  onSearch:    (v: string) => void
  onStatut:    (v: ProjectStatus | 'ALL') => void
  onSort:      (v: SortKey) => void
}

/** Barre de filtres — entièrement contrôlée. */
const Head = ({ search, statut, sortKey, onSearch, onStatut, onSort }: HeadProps) => {
  return (
    <Row>
      <Col xs={12}>
        <Card>
          <CardBody className="d-flex justify-content-end align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Form.Select size="sm" style={{ minWidth: 160 }} value={statut}
                           onChange={e => onStatut(e.target.value as ProjectStatus | 'ALL')}>
                <option value="ALL">Tous les statuts</option>
                {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Form.Select>

              <Form.Select size="sm" style={{ minWidth: 150 }} value={sortKey}
                           onChange={e => onSort(e.target.value as SortKey)}>
                <option value="recent">Plus récents</option>
                <option value="progress">Avancement</option>
                <option value="name">Nom (A→Z)</option>
                <option value="due">Échéance</option>
              </Form.Select>

              <InputGroup size="sm" style={{ minWidth: 200 }}>
                <InputGroup.Text className="bg-light"><IconifyIcon icon="tabler:search" /></InputGroup.Text>
                <Form.Control placeholder="Rechercher un projet…" value={search}
                              onChange={e => onSearch(e.target.value)} />
              </InputGroup>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default Head
