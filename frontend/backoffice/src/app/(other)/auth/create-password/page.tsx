import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'

const CreatePasswordPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const stateEmail = (location.state as { email?: string } | null)?.email || ''

  const [formData, setFormData] = useState({ email: stateEmail, token: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await authService.createPassword(formData)
      navigate('/auth/login?reset=true')
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
            <Link to="/auth/login" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </Link>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-2 fs-20">Réinitialiser votre mot de passe</h4>
              <p className="text-muted mb-4">Entrez le code reçu par email et choisissez un nouveau mot de passe.</p>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 text-start mb-3" role="alert">
                  <i className="ri-error-warning-line fs-16"></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="text-start mb-3">
                <div className="mb-3">
                  <label className="form-label" htmlFor="reset-email">Email</label>
                  <input
                    type="email"
                    id="reset-email"
                    className="form-control"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="reset-token">Code reçu par email</label>
                  <input
                    type="text"
                    id="reset-token"
                    className="form-control"
                    placeholder="Ex : 2b00e07543d5..."
                    value={formData.token}
                    onChange={(e) => setFormData((p) => ({ ...p, token: e.target.value.trim() }))}
                    required
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="new-password">
                    Nouveau mot de passe <small className="text-info ms-1">Min. 8 caractères</small>
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    className="form-control"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) => setFormData((p) => ({ ...p, newPassword: e.target.value }))}
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
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Réinitialisation...</>
                    ) : 'Réinitialiser le mot de passe'}
                  </button>
                </div>
              </form>

              <p className="text-muted fs-14 mt-2 mb-0">
                Retour à <Link to="/auth/login" className="fw-semibold text-danger ms-1">la connexion !</Link>
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
