import { Badge, Col, Modal, ProgressBar, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { STATUS_VARIANT, type Project } from '@/services/projectService'


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
          {line('tabler:checkbox',        project.mesure,            `${project.tasksDone} / ${project.tasksTotal}`)}
          {line('tabler:alert-circle',    project.indicateur.label,  project.indicateur.value)}
          {line('tabler:category',        'Domaine',                 project.category)}
          {line('tabler:users',           'Équipe',                  `${project.team.length} personne(s)`)}
        </Row>

        <h6 className="mb-2">Équipe affectée</h6>
        <div className="d-flex flex-wrap gap-3">
          {project.team.length === 0 && <span className="text-muted fs-13">Aucune personne affectée.</span>}
          {project.team.map(m => (
            <div key={m.id} className="d-flex align-items-center gap-2">
              {m.avatar
                ? <img src={m.avatar} className="rounded-circle avatar-sm" alt={m.name} />
                : <span className="avatar-sm rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-bold">
                    {m.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </span>}
              <div>
                <div className="fs-13 fw-semibold">{m.name}</div>
                <div className="fs-12 text-muted">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default ProjectDetails
