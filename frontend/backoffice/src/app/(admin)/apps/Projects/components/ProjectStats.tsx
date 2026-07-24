import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import type { ProjectStats as Stats } from '@/services/projectService'

/** Bandeau de statistiques en tête de la page Projets. */
const ProjectStats = ({ stats }: { stats: Stats }) => {
  const cards = [
    { label: 'Projets',      value: stats.total,           icon: 'tabler:folders',        color: 'primary' },
    { label: 'Actifs',       value: stats.actifs,          icon: 'tabler:activity',       color: 'info'    },
    { label: 'Terminés',     value: stats.termines,        icon: 'tabler:circle-check',   color: 'success' },
    { label: 'En retard',    value: stats.enRetard,        icon: 'tabler:alert-triangle', color: 'danger'  },
    { label: 'Avancement moyen', value: `${stats.avgProgress}%`, icon: 'tabler:chart-donut', color: 'warning' },
  ]
  return (
    <Row className="g-3 mb-1">
      {cards.map((c, i) => (
        <Col key={i} xl md={6} sm={6} xs={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="d-flex align-items-center gap-3">
              <div className={`avatar-md bg-soft-${c.color} rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
                <IconifyIcon icon={c.icon} className={`fs-24 text-${c.color}`} />
              </div>
              <div>
                <h4 className={`mb-0 fw-bold text-${c.color}`}>{c.value}</h4>
                <p className="text-muted mb-0 fs-13">{c.label}</p>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default ProjectStats
