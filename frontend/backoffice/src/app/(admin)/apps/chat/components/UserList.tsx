import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { UserStatus } from '@/services/chatService'
import { getFirstTwoLetters } from '@/utils/change-casing'
import { CardBody } from 'react-bootstrap'

type UserListProps = {
  onlineUsers: UserStatus[]
  onStartChat: (userId: number) => void
}

const UserList = ({ onlineUsers, onStartChat }: UserListProps) => {
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'ENLIGNE': return 'success'
      case 'ABSENT': return 'warning'
      case 'OCCUPE': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'ENLIGNE': return 'En ligne'
      case 'ABSENT': return 'Absent'
      case 'OCCUPE': return 'Occupé'
      default: return 'Hors ligne'
    }
  }

  const formatLastSeen = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  return (
    <div>
      <CardBody className="py-2 px-3 border-bottom">
        <div className="d-flex align-items-center gap-2 py-1">
          <IconifyIcon icon="tabler:users" className="fs-20 text-primary" />
          <h5 className="mb-0 fw-semibold">Utilisateurs en ligne</h5>
          <span className="badge bg-success-subtle text-success ms-auto">{onlineUsers.length}</span>
        </div>
      </CardBody>

      <SimplebarReactClient style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <div className="p-2">
          {onlineUsers.length === 0 && (
            <div className="text-center py-4">
              <IconifyIcon icon="tabler:users-minus" className="fs-1 text-muted" />
              <p className="text-muted mt-2 mb-0">Aucun utilisateur en ligne</p>
            </div>
          )}

          {onlineUsers.map((user) => {
            const displayName = user.utilisateur
              ? `${user.utilisateur.prenom} ${user.utilisateur.nom}`
              : `Utilisateur #${user.utilisateurId}`

            const photo = user.utilisateur?.photo || user.utilisateur?.photoUrl;

            return (
              <div
                key={user.utilisateurId}
                className="d-flex align-items-center p-2 mb-1 rounded"
                onClick={() => onStartChat(user.utilisateurId)}
                style={{ cursor: 'pointer' }}
                role="button"
              >
                <div className="position-relative me-2 flex-shrink-0">
                  <div className="avatar-sm rounded-circle bg-info text-white d-flex align-items-center justify-content-center">
                    {photo ? (
                      <img 
                        src={`${API_URL}${photo}`} 
                        alt={displayName} 
                        className="h-100 w-100 rounded-circle" 
                        style={{ objectFit: 'cover' }} 
                      />
                    ) : (
                      <span className="fw-semibold" style={{ fontSize: '0.7rem' }}>
                        {getFirstTwoLetters(displayName)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`position-absolute bottom-0 end-0 bg-${getStatusColor(user.statut)} rounded-circle border border-2 border-white`}
                    style={{ width: '10px', height: '10px' }}
                  ></span>
                </div>

                <div className="flex-grow-1 overflow-hidden">
                  <h6 className="mb-0 fs-13 text-truncate">{displayName}</h6>
                  <small className="text-muted">
                    {getStatusText(user.statut)}
                    {user.messageCustom && ` · ${user.messageCustom}`}
                  </small>
                </div>

                <small className="text-muted flex-shrink-0 ms-1">
                  {formatLastSeen(user.derniereActivite)}
                </small>
              </div>
            )
          })}
        </div>
      </SimplebarReactClient>
    </div>
  )
}

export default UserList
