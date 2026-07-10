import { useEffect, useState } from 'react'
import { Card, CardHeader, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { missionService } from '@/services/missionService'
import { Mission } from '@/types/mission'
import { dateTimeFr } from '../helpers'

/**
 * Missions à venir — vraies missions (Mission.API) au départ le plus proche.
 * Remplace les « Upcoming Reminders » statiques du template.
 */

const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'primary',
}

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente d’affectation',
  EN_COURS: 'En cours',
}

const Reminders = () => {
  const [missions, setMissions] = useState<Mission[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    missionService.getAll()
      .then((all) => {
        const aVenir = all
          .filter(m => ['EN_ATTENTE', 'EN_COURS'].includes(m.statut))
          .sort((a, b) => new Date(a.dateDepart).getTime() - new Date(b.dateDepart).getTime())
          .slice(0, 5)
        setMissions(aVenir)
      })
      .catch(() => setMissions([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">Missions à venir</h4>
        <Link to="/gestion/missions" className="fs-13 fw-semibold text-decoration-underline link-offset-2">
          Toutes les missions
        </Link>
      </CardHeader>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : !missions || missions.length === 0 ? (
        <p className="text-muted text-center py-4 mb-0 fs-13">
          Aucune mission planifiée pour le moment.
        </p>
      ) : (
        <ul className="list-group mb-0 list-group-flush">
          {missions.map((m) => (
            <li className="list-group-item border-light" key={m.idMission}>
              <div className="d-flex align-items-center gap-2">
                <div className="me-1">
                  <IconifyIcon width={16} height={16} icon="ri:circle-fill"
                    className={`text-${STATUT_COLOR[m.statut] ?? 'secondary'}`} />
                </div>
                <div className="min-w-0">
                  <h5 className="mb-1 text-truncate">
                    #{m.idMission} · {m.destination || m.objetMission || 'Mission'}
                  </h5>
                  <span className="text-muted fs-12 text-truncate d-block">
                    Départ {dateTimeFr(m.dateDepart)} · {STATUT_LABEL[m.statut] ?? m.statut}
                    {m.chauffeurNom ? ` · ${m.chauffeurNom}` : ''}
                  </span>
                </div>
                <div className="ms-auto">
                  <Link to="/gestion/missions"
                    className="text-decoration-underline fw-semibold ms-auto link-offset-2 fs-13">
                    Voir
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default Reminders
