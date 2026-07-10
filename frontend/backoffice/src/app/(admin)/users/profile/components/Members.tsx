import { useEffect, useState } from 'react'
import { Card, CardHeader, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import { userService, AccountUser } from '@/services/userService'
import { photoUrl, initials } from '../helpers'

/**
 * Mon équipe — collègues actifs chargés depuis IAM.API (/user-management).
 * L'endpoint est réservé ADMIN/ADMINISTRATEUR/GESTIONNAIRE : pour les autres
 * rôles (403), la carte se masque d'elle-même au lieu d'afficher une erreur.
 */
const Members = () => {
  const me = authService.getCurrentUser()
  const [team, setTeam] = useState<AccountUser[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    userService.getAllUsers()
      .then((users) => {
        const collegues = users
          .filter(u => u.actif && u.statut === 'ACTIF')
          .filter(u => u.role !== 'CLIENT')
          .filter(u => u.idUtilisateur !== me?.idUtilisateur)
          .slice(0, 6)
        setTeam(collegues)
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false))
  }, [])

  // Rôle sans accès à la liste des comptes → pas de carte du tout
  if (denied) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">Mon équipe</h4>
        <Link to="/users" className="fs-13 fw-semibold text-decoration-underline link-offset-2">
          Tous les comptes
        </Link>
      </CardHeader>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : !team || team.length === 0 ? (
        <p className="text-muted text-center py-4 mb-0 fs-13">Aucun autre membre actif.</p>
      ) : (
        <ul className="list-group mb-0 list-group-flush">
          {team.map((u) => (
            <li className="list-group-item border-light" key={u.idUtilisateur}>
              <div className="d-flex align-items-center gap-2">
                <div className="avatar-sm flex-shrink-0">
                  {photoUrl(u.photo) ? (
                    <img src={photoUrl(u.photo)!} alt={`${u.prenom} ${u.nom}`}
                      className="img-fluid rounded-circle" style={{ objectFit: 'cover', aspectRatio: '1' }} />
                  ) : (
                    <div className="rounded-circle bg-info bg-opacity-10 text-info fw-bold d-flex align-items-center justify-content-center h-100 w-100">
                      {initials(u.prenom, u.nom)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h5 className="mb-0 lh-base text-truncate">{u.prenom} {u.nom}</h5>
                  <p className="text-muted mb-0 fs-13">{u.role}</p>
                </div>
                <div className="ms-auto">
                  <a href={`mailto:${u.email}`} className="btn btn-sm btn-soft-primary" title={u.email}>
                    <IconifyIcon icon="tabler:mail" className="me-1" />Contacter
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default Members
