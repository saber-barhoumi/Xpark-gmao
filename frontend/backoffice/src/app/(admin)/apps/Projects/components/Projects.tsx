import { Card, CardBody, Col, ProgressBar, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { STATUS_VARIANT, type Project } from '@/services/projectService'

interface ProjectsProps {
  projects: Project[]
  onView:   (p: Project) => void
}

/** Grille de cartes projet — présentation pure, pilotée par les props. */
const Projects = ({ projects, onView }: ProjectsProps) => {
  return (
    <Row>
      {projects.map((item) => {
        const variant = STATUS_VARIANT[item.status]
        return (
          <Col xl={4} md={6} key={item.id}>
            <Card className="h-100">
              <CardBody className="d-flex flex-column">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mt-0">
                      <a role="button" className="text-dark" onClick={() => onView(item)}>{item.title}</a>
                    </h4>
                    <p className={`text-${variant} text-uppercase fw-semibold fs-11`}>{item.category}</p>
                  </div>
                  <div><span className={`badge badge-soft-${variant} p-1`}>{item.status}</span></div>
                </div>

                <p className="text-muted mb-3">
                  {item.description}{' '}
                  <a role="button" className="link-dark" onClick={() => onView(item)}>Voir plus</a>
                </p>

                <ul className="list-inline mb-3">
                  <li className="list-inline-item me-4">
                    <h4 className="mb-0 lh-base">{item.tasksDone}/{item.tasksTotal}</h4>
                    <p className="text-muted mb-0">Tâches</p>
                  </li>
                  <li className="list-inline-item">
                    <h4 className="mb-0 lh-base">{item.comments}</h4>
                    <p className="text-muted mb-0">Commentaires</p>
                  </li>
                </ul>

                <div className="d-flex align-items-center mb-3">
                  <h5 className="me-3 mb-0">Équipe :</h5>
                  <div className="avatar-group">
                    {item.team.map((m, idx) => (
                      <span className="avatar" key={idx} title={m.name}>
                        <img src={m.avatar} className="rounded-circle avatar-sm" alt={m.name} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto">
                  <h5 className="mb-2">Avancement <span className={`text-${variant} float-end`}>{item.progress}%</span></h5>
                  <ProgressBar variant={variant} className="progress-soft progress-sm" now={item.progress}
                               aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} />
                </div>
              </CardBody>
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}

export default Projects
