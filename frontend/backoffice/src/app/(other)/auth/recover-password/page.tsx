import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'

const RecoverPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.recoverPassword(email)
      navigate('/auth/create-password', { state: { email } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title='Recover Password' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={3} lg={5} md={6}>
            <Link to="/auth/login" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </Link>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-3 fs-18">Réinitialiser votre mot de passe</h4>
              <p className="text-muted mb-4">
                Entrez votre adresse email et nous vous enverrons un code pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 text-start mb-3" role="alert">
                  <i className="ri-error-warning-line fs-16"></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="text-start mb-3">
                <div className="mb-3">
                  <label className="form-label" htmlFor="recover-email">Email</label>
                  <input
                    type="email"
                    id="recover-email"
                    className="form-control"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="d-grid">
                  <button className="btn btn-primary fw-semibold" type="submit" disabled={loading} id="btn-recover">
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Envoi en cours...</>
                    ) : 'Envoyer le code'}
                  </button>
                </div>
              </form>

              <p className="text-muted fs-14 mt-3 mb-0">
                Retour à <Link to="/auth/login" className="fw-semibold text-danger ms-1">la connexion !</Link>
              </p>
            </Card>
            <p className="mt-4 text-center mb-0">
              © XPARK GMAO - <span className="fw-bold text-uppercase fs-12">Tous droits réservés</span>
            </p>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default RecoverPasswordPage