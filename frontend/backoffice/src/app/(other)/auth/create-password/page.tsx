import React, { useState, useEffect } from 'react'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'

const CreatePasswordPage = () => {
  const [formData, setFormData] = useState({ email: '', token: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Extraire email & token depuis l'URL (?email=...&token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || ''
    const token = params.get('token') || ''
    if (email && token) {
      setFormData((prev) => ({ ...prev, email, token }))
      authService.validateToken(token).then(setTokenValid)
    } else {
      setTokenValid(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await authService.createPassword(formData)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title='Create Password' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={3} lg={5} md={6}>
            <a href="/" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </a>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-2 fs-20">Créer votre mot de passe</h4>
              <p className="text-muted mb-4">Choisissez un mot de passe sécurisé pour votre compte.</p>

              {success ? (
                <div className="alert alert-success text-start" role="alert">
                  <i className="ri-checkbox-circle-line fs-20 me-2 text-success"></i>
                  <strong>Mot de passe créé !</strong>
                  <p className="mb-0 fs-13 mt-1">Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.</p>
                  <a href="/auth/login" className="btn btn-primary btn-sm mt-2">Se connecter</a>
                </div>
              ) : tokenValid === false ? (
                <div className="alert alert-danger text-start" role="alert">
                  <i className="ri-error-warning-line fs-20 me-2"></i>
                  <strong>Lien invalide ou expiré</strong>
                  <p className="mb-0 fs-13 mt-1">Ce lien n'est plus valide. Contactez l'administrateur.</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 text-start mb-3" role="alert">
                      <i className="ri-error-warning-line fs-16"></i>
                      <span>{error}</span>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="text-start mb-3">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="new-password">
                        Nouveau mot de passe <small className="text-info ms-1">Min. 8 caractères</small>
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        className="form-control"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="confirm-password">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        id="confirm-password"
                        className="form-control"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="mb-2 d-grid">
                      <button className="btn btn-primary fw-semibold" type="submit" disabled={loading} id="btn-create-pw">
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Création...</>
                        ) : 'Créer le mot de passe'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              <p className="text-muted fs-14 mt-2 mb-0">
                Retour à <a href="/auth/login" className="fw-semibold text-danger ms-1">la connexion !</a>
              </p>
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

export default CreatePasswordPage