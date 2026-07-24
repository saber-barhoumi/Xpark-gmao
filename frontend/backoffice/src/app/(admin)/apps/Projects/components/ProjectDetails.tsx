import { Badge, Col, Modal, ProgressBar, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { STATUS_VARIANT, type Project } from '@/services/projectService'

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTnd  = (n: number) => n.toLocaleString('fr-FR') + ' TND'

/** Fiche détaillée d'un projet (lecture). */
const ProjectDetails = ({ project, open, onClose }: { project: Project | null; open: boolean; onClose: () => void }) => {
  if (!project) return null
  const variant = STATUS_VARIANT[project.status]

  const line = (icon: string, label: string, value: React.ReactNode) => (
    <Col sm={6} className="mb-3">
      <div className="d-flex align-items-center gap-2">
        <IconifyIcon icon={icon} className={`fs-20 text-${variant}`} />
        <div>
          <p className="text-muted mb-0 fs-12">{label}</p>
          <span className="fw-semibold">{value}</span>
        </div>
      </div>
    </Col>
  )

  return (
    <Modal show={open} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <div>
          <Modal.Title as="h5">{project.title}</Modal.Title>
          <span className={`text-${variant} text-uppercase fw-semibold fs-11`}>{project.category}</span>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Badge bg={`soft-${variant}`} text={variant as any} className="fs-13">{project.status}</Badge>
          <span className="text-muted fs-13">Chef de projet : <strong>{project.lead}</strong></span>
        </div>

        <p className="text-muted">{project.description}</p>

        <h6 className="mb-2">Avancement <span className={`text-${variant} float-end`}>{project.progress}%</span></h6>
        <ProgressBar variant={variant} className="progress-soft progress-sm mb-4" now={project.progress} />

        <Row>
          {line('tabler:calendar-plus', 'Début',       fmtDate(project.startDate))}
          {line('tabler:calendar-due',  'Échéance',     fmtDate(project.dueDate))}
          {line('tabler:checkbox',      'Tâches',       `${project.tasksDone} / ${project.tasksTotal}`)}
          {line('tabler:message-2',     'Commentaires', project.comments)}
          {line('tabler:coin',          'Budget',       project.budget ? fmtTnd(project.budget) : '—')}
          {line('tabler:users',         'Équipe',       `${project.team.length} membre(s)`)}
        </Row>

        <h6 className="mb-2">Équipe</h6>
        <div className="d-flex flex-wrap gap-3">
          {project.team.map((m, i) => (
            <div key={i} className="d-flex align-items-center gap-2">
              <img src={m.avatar} className="rounded-circle avatar-sm" alt={m.name} />
              <span className="fs-13">{m.name}</span>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default ProjectDetails
