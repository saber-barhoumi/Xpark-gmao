import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    role: 'CHAUFFEUR',
  })
  const { error, execute, clearError } = useApiError()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()
    setFieldErrors({})
    setSuccessMessage('')

    const response = await execute(async () => {
      try {
        // Mapping vers le nouveau DTO simplifié
        const dto = {
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          motDePasse: formData.password
        }
        return await authService.register(dto)
      } catch (err: any) {
        if (err.response?.data?.errors) {
          setFieldErrors(err.response.data.errors)
        }
        throw err
      }
    })

    if (response && response.success) {
      setSuccessMessage(response.message || "Votre demande a été soumise. Elle est en attente d'approbation.")
      // Optionnel: On peut aussi scroller vers le haut
      window.scrollTo(0, 0)
    }
    setLoading(false)
  }

  const getFieldError = (field: string): string | undefined => {
    return fieldErrors[field]?.[0]
  }

  return (
    <>
      <PageBreadcrumb title='Register' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={4} lg={6} md={8}>
            <a href="/" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </a>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-3 fs-18">Inscription Collaborateur</h4>
              <p className="text-muted mb-4 fs-14">
                L'inscription est soumise à validation par un administrateur.
                Veuillez sélectionner le rôle souhaité et remplir vos informations.
              </p>

              {error && (
                <AlerteErreur
                  status={error.status}
                  message={error.message}
                  onDismiss={clearError}
                  className="mb-3"
                />
              )}

              {successMessage && (
                <div className="alert alert-success text-start" role="alert">
                  <h5 className="alert-heading"><i className="ri-check-double-line me-2"></i>Demande soumise !</h5>
                  <p className="mb-2">{successMessage}</p>
                  <hr />
                  <p className="mb-0">
                    <a href="/auth/login" className="alert-link">Retour à la page de connexion</a>
                  </p>
                </div>
              )}

              {!successMessage && (
                <form onSubmit={handleSubmit} className="text-start mb-3">
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="reg-nom">Nom</label>
                        <input type="text" id="reg-nom" className={`form-control ${getFieldError('nom') ? 'is-invalid' : ''}`} placeholder="Nom" value={formData.nom} onChange={update('nom')} required />
                        {getFieldError('nom') && <div className="invalid-feedback d-block">{getFieldError('nom')}</div>}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="reg-prenom">Prénom</label>
                        <input type="text" id="reg-prenom" className={`form-control ${getFieldError('prenom') ? 'is-invalid' : ''}`} placeholder="Prénom" value={formData.prenom} onChange={update('prenom')} required />
                        {getFieldError('prenom') && <div className="invalid-feedback d-block">{getFieldError('prenom')}</div>}
                      </div>
                    </Col>
                  </Row>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="reg-email">Email</label>
                    <input type="email" id="reg-email" className={`form-control ${getFieldError('email') ? 'is-invalid' : ''}`} placeholder="votre@email.com" value={formData.email} onChange={update('email')} required autoComplete="email" />
                    {getFieldError('email') && <div className="invalid-feedback d-block">{getFieldError('email')}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="reg-password">Mot de passe</label>
                    <input type="password" id="reg-password" className={`form-control ${getFieldError('password') ? 'is-invalid' : ''}`} placeholder="••••••••" value={formData.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
                    {getFieldError('password') && <div className="invalid-feedback d-block">{getFieldError('password')}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="reg-confirm">Confirmer le mot de passe</label>
                    <input type="password" id="reg-confirm" className={`form-control ${getFieldError('confirmPassword') ? 'is-invalid' : ''}`} placeholder="••••••••" value={formData.confirmPassword} onChange={update('confirmPassword')} required autoComplete="new-password" />
                    {getFieldError('confirmPassword') && <div className="invalid-feedback d-block">{getFieldError('confirmPassword')}</div>}
                  </div>
                  <div className="d-flex mb-3">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="checkbox-terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                      <label className="form-check-label" htmlFor="checkbox-terms">
                        J'accepte les <a href="#!" className="link-dark text-decoration-underline">Conditions d'utilisation</a>
                      </label>
                    </div>
                  </div>
                  <div className="d-grid">
                    <button className="btn btn-primary fw-semibold" type="submit" disabled={loading || !agreed} id="btn-register">
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Inscription...</>
                      ) : "S'inscrire"}
                    </button>
                  </div>
                </form>
              )}

              <p className="text-muted fs-14 mb-0">
                Déjà un compte ?&nbsp;
                <a href="/auth/login" className="fw-semibold text-danger ms-1">Se connecter !</a>
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

export default RegisterPage