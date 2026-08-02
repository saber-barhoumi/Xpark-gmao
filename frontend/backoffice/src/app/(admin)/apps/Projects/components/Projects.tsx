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

                {/* Chiffres MESURÉS sur les données de la plateforme */}
                <ul className="list-inline mb-3">
                  <li className="list-inline-item me-4">
                    <h4 className="mb-0 lh-base">{item.tasksDone}/{item.tasksTotal}</h4>
                    <p className="text-muted mb-0">{item.mesure}</p>
                  </li>
                  <li className="list-inline-item">
                    <h4 className="mb-0 lh-base">{item.indicateur.value}</h4>
                    <p className="text-muted mb-0">{item.indicateur.label}</p>
                  </li>
                </ul>

                {/* Équipe : vrais comptes (photo réelle ou initiales) */}
                <div className="d-flex align-items-center mb-3">
                  <h5 className="me-3 mb-0">Équipe :</h5>
                  <div className="avatar-group">
                    {item.team.map(m => (
                      <span className="avatar" key={m.id} title={`${m.name} — ${m.role}`}>
                        {m.avatar
                          ? <img src={m.avatar} className="rounded-circle avatar-sm" alt={m.name} />
                          : <span className="avatar-sm rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-bold">
                              {m.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                            </span>}
                      </span>
                    ))}
                    {item.team.length === 0 && <span className="text-muted fs-13">Non affectée</span>}
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
