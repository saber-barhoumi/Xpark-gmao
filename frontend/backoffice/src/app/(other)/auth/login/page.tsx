import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'

const LoginPage = () => {
  const location = useLocation()
  
  // Parser les paramètres URL
  const params = new URLSearchParams(location.search)
  const confirmed = params.get('confirmed') || null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { error, execute, clearError } = useApiError()
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // ─── MFA (vérification en deux étapes) ───
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [mfaToken, setMfaToken] = useState('')
  const [mfaMethods, setMfaMethods] = useState<string[]>([])
  const [mfaMethod, setMfaMethod] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  // Afficher message de succès si venant de confirmation
  useEffect(() => {
    if (confirmed === 'true') {
      setSuccess('Votre email a été confirmé ! Vous pouvez maintenant vous connecter.')
    }
  }, [confirmed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const credentials = { email: email.trim(), password }
    const response = await execute(() => authService.login(credentials))

    if (response) {
      // ─── Étape 2 requise : vérification MFA (FICHE Authentication & Security) ───
      if (response.requiresMfa && response.mfaToken) {
        setMfaToken(response.mfaToken)
        setMfaMethods(response.mfaMethods ?? [])
        setMfaMethod(response.mfaMethods?.[0] ?? 'AUTHENTICATOR')
        setStep('mfa')
        setLoading(false)
        return
      }

      // Save token and user info
      localStorage.setItem('xpark_token', response.token)
      localStorage.setItem('xpark_user', JSON.stringify({
        email: response.email,
        id: response.idUtilisateur,
        role: response.role
      }))

      window.location.href = '/'
    }
    setLoading(false)
  }

  // ─── Vérification du code MFA (TOTP ou email) ───
  const handleMfaVerify = async (code: string = mfaCode) => {
    if (code.length !== 6) return
    setLoading(true)
    setMfaError('')
    try {
      const response = await authService.verifyMfa(mfaToken, mfaMethod, code)
      localStorage.setItem('xpark_user', JSON.stringify({
        email: response.email,
        id: response.idUtilisateur,
        role: response.role
      }))
      window.location.href = '/'
    } catch (err: any) {
      setMfaError(err.response?.data?.message || 'Code de vérification invalide.')
      setMfaCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setMfaCode(value)
    if (value.length === 6) handleMfaVerify(value)   // auto-submit à 6 chiffres
  }

  const handleResendEmail = async () => {
    try {
      await authService.resendMfaEmail(mfaToken)
      setResendCountdown(60)
      const timer = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      setMfaError('Erreur lors du renvoi du code.')
    }
  }

  return (
    <>
      <PageBreadcrumb title='Login' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={3} lg={5} md={6}>
            <a href="/" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" width={130} height={26} className="logo-dark" style={{ objectFit: 'contain' }} />
              <img src={logo} alt="logo light" width={130} height={26} className="logo-light" style={{ objectFit: 'contain' }} />
            </a>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            {step === 'mfa' ? (
              <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
                <h4 className="fw-semibold mb-1 fs-18">
                  <i className="ri-shield-keyhole-line me-1 text-primary"></i>
                  Vérification en deux étapes
                </h4>
                <p className="text-muted fs-14 mb-3">
                  Compte : <strong>{email}</strong>
                </p>

                {mfaMethods.length > 1 && (
                  <div className="d-flex gap-2 justify-content-center mb-3">
                    {mfaMethods.map(m => (
                      <button
                        key={m} type="button"
                        className={`btn btn-sm ${mfaMethod === m ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                          setMfaMethod(m); setMfaCode(''); setMfaError('')
                          // Envoi automatique du code quand on choisit la méthode Email
                          if (m === 'EMAIL' && mfaMethods[0] !== 'EMAIL' && resendCountdown === 0) handleResendEmail()
                        }}
                      >
                        {m === 'AUTHENTICATOR' ? <><i className="ri-smartphone-line me-1"></i>Authenticator</>
                          : <><i className="ri-mail-line me-1"></i>Email</>}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-muted fs-13 mb-2">
                  {mfaMethod === 'AUTHENTICATOR'
                    ? 'Entrez le code à 6 chiffres de votre application Authenticator (Google/Microsoft).'
                    : 'Un code à 6 chiffres vous a été envoyé par email (valide 10 minutes).'}
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  className="form-control text-center fs-3 fw-bold mb-2"
                  style={{ letterSpacing: '0.5em' }}
                  maxLength={6}
                  value={mfaCode}
                  onChange={handleMfaCodeChange}
                  placeholder="000000"
                  disabled={loading}
                  autoFocus
                />

                {mfaError && <p className="text-danger fs-13 mb-2">{mfaError}</p>}

                <div className="d-grid gap-2 mb-2">
                  <button
                    className="btn btn-primary fw-semibold"
                    onClick={() => handleMfaVerify()}
                    disabled={mfaCode.length !== 6 || loading}
                  >
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Vérification…</>
                      : 'Vérifier'}
                  </button>
                </div>

                {mfaMethod === 'EMAIL' && (
                  resendCountdown > 0
                    ? <p className="text-muted fs-13 mb-2">Renvoyer le code dans {resendCountdown}s</p>
                    : <button type="button" className="btn btn-link fs-13 p-0 mb-2" onClick={handleResendEmail}>
                        Renvoyer le code par email
                      </button>
                )}

                <button
                  type="button"
                  className="btn btn-link fs-13 text-muted p-0"
                  onClick={() => { setStep('credentials'); setMfaCode(''); setMfaError('') }}
                >
                  ← Retour à la connexion
                </button>
              </Card>
            ) : (
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-3 fs-18">Connexion à votre compte</h4>

              {success && (
                <div className="alert alert-success d-flex align-items-center gap-2 text-start mb-3" role="alert">
                  <i className="ri-checkbox-circle-line fs-16"></i>
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <AlerteErreur
                  status={error.status}
                  message={
                    error.message.includes('Email non confirmé') || error.message.includes('confirmer votre adresse')
                      ? (
                        <>
                          {error.message}.{' '}
                          <div className="mt-2">
                            <a href={`/auth/confirm-mail?email=${encodeURIComponent(email)}`} className="btn btn-sm btn-outline-danger">
                              Aller à la confirmation
                            </a>
                          </div>
                        </>
                      )
                      : error.message
                  }
                  onDismiss={clearError}
                  className="mb-3"
                />
              )}

              <form onSubmit={handleSubmit} className="text-start mb-3">
                <div className="mb-3">
                  <label className="form-label" htmlFor="login-email">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    className="form-control"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="login-password">Mot de passe</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="checkbox-signin" />
                    <label className="form-check-label" htmlFor="checkbox-signin">Se souvenir de moi</label>
                  </div>
                  <a href="/auth/recover-password" className="text-muted border-bottom border-dashed">
                    Mot de passe oublié ?
                  </a>
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-primary fw-semibold" type="submit" disabled={loading} id="btn-login">
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Connexion...</>
                    ) : 'Se connecter'}
                  </button>
                </div>
              </form>

              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" />
                <span className="mx-2 text-muted fs-12">OU</span>
                <hr className="flex-grow-1" />
              </div>

              <div className="d-grid gap-2 mb-3">
                <a href="/auth/login-pin" className="btn btn-outline-secondary fw-semibold">
                  <i className="ri-keyboard-line me-2"></i>Se connecter avec PIN
                </a>
              </div>

              <p className="text-muted fs-14 mb-0">
                Pas encore de compte ?&nbsp;
                <a href="/auth/register" className="fw-semibold text-danger ms-1">S'inscrire !</a>
              </p>
            </Card>
            )}
            <p className="mt-4 text-center mb-0">
              © XPARK GMAO - <span className="fw-bold text-uppercase fs-12">Tous droits réservés</span>
            </p>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default LoginPage