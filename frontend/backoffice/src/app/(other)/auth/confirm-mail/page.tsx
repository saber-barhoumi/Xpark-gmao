import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import mailConfirmImg from '@/assets/images/png/mail-confirm.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'

const ConfirmMailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Parser les paramètres URL
  const params = new URLSearchParams(location.search)
  const email = params.get('email') || ''
  const token = params.get('token') || ''

  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'resent' | 'confirming'>('pending')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState(email)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Si on a les paramètres email et token, confirmer automatiquement
    if (email && token) {
      setStatus('confirming')
      authService.confirmEmail(email, token)
        .then(() => {
          setStatus('success')
          // Redirection automatique après 3 secondes
          setTimeout(() => {
            navigate('/auth/login?confirmed=true')
          }, 3000)
        })
        .catch((err) => {
          setMessage(err.response?.data?.message || 'Lien de confirmation invalide ou expiré')
          setStatus('error')
        })
    }
  }, [email, token, navigate])

  const handleResend = async () => {
    if (!resendEmail) return
    setLoading(true)
    try {
      await authService.resendConfirmation(resendEmail)
      setStatus('resent')
    } catch {
      setMessage('Erreur lors du renvoi. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title='Confirm Mail' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={3} lg={5} md={6}>
            <a href="/" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </a>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-4 fs-20">Vérifiez votre email</h4>

              {status === 'success' && (
                <>
                  <i className="ri-mail-check-line text-success" style={{ fontSize: 56 }}></i>
                  <div className="alert alert-success mt-3 text-start" role="alert">
                    <strong>Email confirmé avec succès !</strong>
                    <p className="mb-0 fs-13 mt-1">Votre compte est activé. Vous pouvez maintenant vous connecter.</p>
                  </div>
                  <p className="text-muted fs-13 mt-2">Redirection vers la connexion...</p>
                </>
              )}

              {status === 'confirming' && (
                <>
                  <i className="ri-checkbox-circle-line text-primary" style={{ fontSize: 56 }}></i>
                  <p className="text-muted fs-14 mt-3">Confirmation en cours...</p>
                  <div className="spinner-border text-primary mt-2" role="status">
                    <span className="visually-hidden">Vérification...</span>
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <i className="ri-error-warning-line text-danger" style={{ fontSize: 56 }}></i>
                  <div className="alert alert-danger mt-3 text-start" role="alert">
                    <strong>Lien invalide</strong>
                    <p className="mb-0 fs-13 mt-1">{message}</p>
                  </div>
                  <p className="text-muted fs-13 mt-3">Besoin d'un nouveau lien ?</p>
                  <div className="d-flex gap-2 mt-1">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="votre@email.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                    />
                    <button className="btn btn-outline-primary" onClick={handleResend} disabled={loading} id="btn-resend">
                      {loading ? <span className="spinner-border spinner-border-sm" role="status"></span> : 'Renvoyer'}
                    </button>
                  </div>
                </>
              )}

              {status === 'resent' && (
                <>
                  <img src={mailConfirmImg} alt="mail confirmation" width={86} className="mx-auto d-block" />
                  <div className="alert alert-info mt-3 text-start" role="alert">
                    <strong>Email renvoyé !</strong>
                    <p className="mb-0 fs-13 mt-1">Vérifiez votre boîte mail et cliquez sur le lien de confirmation.</p>
                  </div>
                </>
              )}

              {status === 'pending' && (
                <>
                  <img src={mailConfirmImg} alt="mail confirmation" width={86} className="mx-auto d-block" />
                  <div className="mt-3">
                    <p className="text-muted fs-14">
                      Un email de confirmation a été envoyé à <strong>{email || 'votre adresse'}</strong>
                    </p>
                    <p className="text-muted fs-14">
                      Cliquez sur le lien dans l'email pour activer votre compte.
                    </p>
                    <div className="alert alert-warning text-start mt-3" role="alert">
                      <i className="ri-shield-check-line me-1"></i>
                      <strong>Approbation requise</strong>
                      <p className="mb-0 fs-13 mt-1">Après la confirmation de votre email, un administrateur devra approuver votre compte avant que vous puissiez vous connecter.</p>
                    </div>
                  </div>
                  <div className="text-muted fs-13 mt-4 pt-3 border-top">
                    <p className="mb-2">
                      <strong>Vous n'avez pas reçu l'email ?</strong>
                    </p>
                    <ul className="list-unstyled text-start">
                      <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                      <li>• Vérifiez que l'adresse email est correcte</li>
                      <li>• Attendez quelques minutes et vérifiez à nouveau</li>
                    </ul>
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={handleResend}
                      disabled={loading}
                    >
                      {loading ? 'Envoi...' : 'Renvoyer l\'email'}
                    </button>
                  </div>
                </>
              )}

              <a href="/auth/login" className="btn btn-outline-secondary d-block mt-3">Retour à la connexion</a>
            </Card>
            <p className="mt-3 text-center mb-0">
              © XPARK GMAO - <span className="fw-bold text-uppercase fs-12">Tous droits réservés</span>
            </p>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default ConfirmMailPage