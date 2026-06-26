import React, { useState, useEffect } from 'react'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import avatar1 from '@/assets/images/users/avatar-1.jpg'
import { Card, Col, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService, { AuthResponse } from '@/services/authService'
import profileService from '@/services/profileService'

const LockScreenPage = () => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const user = authService.getCurrentUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      
      setCurrentUser(user)
      setProfileLoading(true)
      
      try {
        // Obtenir les infos fraîches de la DB (photo, nom complet, etc)
        const profile = await profileService.getProfile(user.idUtilisateur)
        if (profile) {
          setCurrentUser(prev => prev ? {
            ...prev,
            prenom:   profile.prenom,
            nom:      profile.nom,
            photoUrl: profile.photoUrl || prev.photoUrl,
            role:     profile.role || prev.role
          } : null)
        }
      } catch (err) {
        console.error('[LockScreen] Profile fetch error:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchUserAndProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!currentUser) throw new Error('Utilisateur non connecté')
      await authService.unlockScreen({
        userId: currentUser.idUtilisateur,
        password,
      })
      window.location.href = '/'
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mot de passe incorrect')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title='Lock Screen' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={3} lg={5} md={6}>
            <a href="/" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </a>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0 shadow-sm border-0">
              <h4 className="fw-bold mb-4 fs-18">
                <IconifyIcon icon="tabler:lock" className="me-2 text-warning fs-20" />
                Session verrouillée
              </h4>
              
              <div className="text-center mb-4">
                {profileLoading ? (
                  <div className="d-flex flex-column align-items-center py-3">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="position-relative d-inline-block">
                      <img 
                        src={currentUser?.photoUrl 
                          ? `${((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000').replace('/api', '')}${currentUser.photoUrl}` 
                          : avatar1
                        } 
                        alt="avatar" 
                        className="avatar-xl rounded-circle img-thumbnail shadow-sm border-3 border-white"
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                      <span className="position-absolute bottom-0 end-0 bg-warning border border-2 border-white rounded-circle p-1">
                        <IconifyIcon icon="tabler:lock-filled" className="text-white fs-12" />
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="fw-bold mb-1 fs-18 text-dark">
                        {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Chargement...'}
                      </h5>
                      <p className="text-muted fs-13 mb-0 d-flex align-items-center justify-content-center gap-1">
                        <IconifyIcon icon="tabler:mail" className="text-primary" />
                        {currentUser?.email || '—'}
                      </p>
                      {currentUser?.role && (
                        <span className="badge bg-soft-primary text-primary mt-2 px-3 py-1 rounded-pill fw-medium border border-primary border-opacity-10">
                          {currentUser.role}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <p className="text-muted fs-13 mb-4 py-2 border-top border-bottom border-light border-opacity-50">
                Votre session est protégée. Entrez votre mot de passe pour reprendre votre travail.
              </p>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 text-start mb-3" role="alert">
                  <i className="ri-error-warning-line fs-16"></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="text-start mb-3">
                <div className="mb-3">
                  <label className="form-label" htmlFor="lock-password">Mot de passe</label>
                  <input
                    type="password"
                    id="lock-password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="current-password"
                  />
                </div>
                <div className="mb-2 d-grid">
                  <button className="btn btn-primary fw-semibold" type="submit" disabled={loading} id="btn-unlock">
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Déverrouillage...</>
                    ) : 'Déverrouiller la session'}
                  </button>
                </div>
              </form>

              <p className="text-muted fs-14 mb-0">
                Ce n'est pas vous ?&nbsp;
                <a href="/auth/login" className="fw-semibold text-danger ms-1">Changer de compte !</a>
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

export default LockScreenPage