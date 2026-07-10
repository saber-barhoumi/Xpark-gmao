import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService, { LoginHistoryEntry } from '@/services/authService'
import { timeAgo, readableAgent } from '../helpers'

/**
 * Activité récente du compte — historique réel des connexions (IAM.API,
 * /auth/security/login-history). Remplace le faux fil de commentaires du template.
 */
const Comments = () => {
  const [history, setHistory] = useState<LoginHistoryEntry[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService.getLoginHistory(8)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">Activité récente du compte</h4>
        <Link to="/security" className="fs-13 fw-semibold text-decoration-underline link-offset-2">
          Sécurité (MFA)
        </Link>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-muted text-center py-3 mb-0 fs-13">
            Aucune activité enregistrée pour le moment.
          </p>
        ) : (
          <>
            {history.map((h, idx) => (
              <div key={idx}
                className={`d-flex align-items-start gap-3 ${idx < history.length - 1 ? 'border-bottom border-light pb-3 mb-3' : ''}`}>
                <div className={`flex-shrink-0 rounded-circle p-2 d-flex align-items-center justify-content-center
                    ${h.isSuccessful ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                  <IconifyIcon icon={h.isSuccessful ? 'tabler:login-2' : 'tabler:alert-triangle'} className="fs-18" />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h5 className="mt-0 mb-1">
                    {h.isSuccessful ? 'Connexion réussie' : 'Tentative de connexion échouée'}
                    <small className="ms-2 text-muted fw-normal">{timeAgo(h.loggedInAt)}</small>
                  </h5>
                  <p className="text-muted fs-13 mb-0">
                    {readableAgent(h.userAgent)}
                    {h.ipAddress ? ` · IP ${h.ipAddress}` : ''}
                    {h.mfaMethod ? ` · MFA ${h.mfaMethod}` : ''}
                    {!h.isSuccessful && h.failureReason ? ` · ${h.failureReason}` : ''}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-muted fs-12 mb-0 mt-3">
              🔒 Une activité suspecte ? Changez votre mot de passe et activez le MFA depuis la page{' '}
              <Link to="/security">Sécurité</Link>.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default Comments
