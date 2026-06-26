import React, { useEffect, useRef, useState } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Spinner, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import authService, { AuthResponse } from '@/services/authService'
import profileService, { UserProfile, ProfileStats } from '@/services/profileService'

const getInitials = (prenom = '', nom = '') =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase() || 'XP'

const formatEmployeeId = (id?: number) =>
  id ? `XPGM-${String(id).padStart(4, '0')}` : 'XPGM-0000'

const DEFAULT_COMPETENCES = [
  'Maintenance préventive', 'Diagnostic pannes', 'HVAC', 'Équipements lourds',
]

// ── PROFESSIONNAL UI ERROR (Card-based version of 401) ─────────────
const UnauthorizedCard = () => (
  <Card className="border-0 shadow-sm text-center p-5 overflow-hidden">
    <div className="py-4">
      <div className="mb-4">
        <IconifyIcon icon="tabler:lock-off" className="display-1 text-danger opacity-25" />
      </div>
      <h3 className="fw-bold text-dark mb-2">Session expirée ou non autorisée</h3>
      <p className="text-muted mb-4 fs-14 pb-2">
        Votre session a expiré ou vous n'avez pas les droits nécessaires. 
        Veuillez vous reconnecter pour accéder à vos données.
      </p>
      <Link to="/auth/login" className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2">
        <IconifyIcon icon="tabler:login" className="fs-18" /> Se Connecter
      </Link>
    </div>
  </Card>
)

const ProfileCard = () => {
  const currentUser = authService.getCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Toujours commencer avec isLoading = true ───────────────────
  const [isLoading,  setIsLoading]  = useState(true)
  const [profile,    setProfile]    = useState<UserProfile | null>(null)
  const [stats,      setStats]      = useState<ProfileStats | null>(null)
  const [photoUrl,   setPhotoUrl]   = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  // ── API URL ───────────────────────────────────────────────────
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'

  // ── Charger profil + stats depuis l'API ────────────────────────
  useEffect(() => {
    if (!currentUser?.idUtilisateur) {
      setIsLoading(false)
      return
    }

    const userId = currentUser.idUtilisateur

    // Appel API obligatoire au montage (Bug 2 Fix)
    Promise.allSettled([
      profileService.getProfile(userId),
      profileService.getStats(userId),
    ]).then(([profileResult, statsResult]) => {
      if (profileResult.status === 'fulfilled') {
        const p = profileResult.value
        setProfile(p)
        setPhotoUrl(p.photoUrl ? `${API_URL.replace('/api', '')}${p.photoUrl}` : null)
      } else {
        console.error('[ProfileCard] Error fetching profile:', profileResult.reason)
        // Fallback sur le JWT si l'API échoue
        setProfile({
          idUtilisateur: currentUser.idUtilisateur,
          prenom:      currentUser.prenom || '',
          nom:         currentUser.nom    || '',
          email:       currentUser.email  || '',
          role:        currentUser.role   || 'Utilisateur',
          telephone:   '',
          site:        '',
          specialite:  '',
          departement: 'Direction Maintenance',
          bio:         '',
          photoUrl:    null,
        })
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value)
      } else {
        console.error('[ProfileCard] Error fetching stats:', statsResult.reason)
        setStats({
          totalInterventions:   0,
          interventionsEnCours: 0,
          interventionsMois:    0,
          tauxResolution:       0,
          prioritaires:         0,
          ordresOuverts:        0,
        })
      }
    }).finally(() => setIsLoading(false))
  }, [])

  // ── Upload photo au clic ────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.idUtilisateur) return

    setPhotoLoading(true)
    try {
      const newPhotoPath = await profileService.uploadPhoto(currentUser.idUtilisateur, file)
      const fullUrl = `${API_URL.replace('/api', '')}${newPhotoPath}`
      setPhotoUrl(fullUrl)
      
      // Update global context/localStorage for immediate topbar sync
      if (currentUser) {
        const updatedUser: AuthResponse = { ...currentUser, photoUrl: newPhotoPath }
        localStorage.setItem('xpark_user', JSON.stringify(updatedUser))
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('profileUpdate'))
      }
    } catch (err) {
      console.error('[ProfileCard] Upload failed:', err)
    } finally {
      setPhotoLoading(false)
      if (e.target) e.target.value = ''
    }
  }

  // ── Spinner pendant le chargement ──────────────────────────────
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardBody className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted mb-0">Synchronisation de vos données...</p>
        </CardBody>
      </Card>
    )
  }

  // Si pas authentifié -> Professional Error View
  if (!currentUser?.idUtilisateur) {
    return <UnauthorizedCard />
  }

  const displayName  = profile
    ? `${profile.prenom} ${profile.nom}`.trim() || 'Utilisateur'
    : 'Utilisateur'
  const initials     = getInitials(profile?.prenom, profile?.nom)
  const role         = profile?.role        || 'Utilisateur'
  const departement  = profile?.departement || 'Direction Maintenance'
  const email        = profile?.email       || '—'
  const employeeId   = formatEmployeeId(profile?.idUtilisateur)

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white">

      {/* ── Bandeau Header avec effet premium ─────────────────── */}
      <div className="bg-picture position-relative bg-primary bg-opacity-10 border-bottom border-light" style={{ minHeight: 120 }}>
        <div className="position-absolute top-0 end-0 d-flex align-items-center gap-2 p-3">
          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1 fs-11 border border-success border-opacity-10">
            <IconifyIcon icon="tabler:circle-filled" className="me-1 fs-10" />
            ACTIF
          </span>
          <span className="badge bg-white bg-opacity-75 text-dark fw-bold fs-11 border border-light-subtle rounded-pill px-3 py-1 shadow-sm">
            {employeeId}
          </span>
        </div>
      </div>

      <CardBody className="pt-0 px-4 pb-4">

        {/* ── Avatar + Identité ─────────────────────────── */}
        <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-end gap-3 mb-4" style={{ marginTop: -50 }}>

          {/* Avatar cliquable avec feed-back visuel */}
          <div
            className="position-relative flex-shrink-0"
            style={{ cursor: 'pointer', width: 100, height: 100 }}
            onClick={() => fileInputRef.current?.click()}
            title="Changer ma photo de profil"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="rounded-circle border border-5 border-white shadow-lg"
                style={{
                  width: 100, height: 100,
                  objectFit: 'cover',
                  filter: photoLoading ? 'brightness(.6)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            ) : (
              <div
                className="avatar-xl rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center fw-bold border border-5 border-white shadow-lg"
                style={{ fontSize: 32, width: 100, height: 100 }}
              >
                {photoLoading
                  ? <Spinner animation="border" size="sm" variant="info" />
                  : initials
                }
              </div>
            )}
            <div
              className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow-sm hover-scale"
              style={{ width: 32, height: 32 }}
            >
              <IconifyIcon icon="tabler:camera" className="fs-16 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="pb-1 text-center text-sm-start flex-grow-1">
            <h3 className="mb-1 fw-bold text-dark lh-base">{displayName}</h3>
            <p className="mb-0 text-muted fs-14 fw-medium d-flex align-items-center justify-content-center justify-content-sm-start flex-wrap gap-1">
              <IconifyIcon icon="tabler:user-star" className="fs-18 text-primary" />
              <span>{role}</span>
              <span className="mx-2 opacity-50 d-none d-sm-inline">•</span>
              <IconifyIcon icon="tabler:building-factory-2" className="fs-18 text-primary" />
              <span>{departement}</span>
            </p>
          </div>
        </div>

        {/* ── Stats GMAO Dynamiques ──────────────────────────── */}
        <div className="row g-3 mb-4">
          <Col xs={4}>
            <div className="bg-light bg-opacity-50 border border-light-subtle rounded-4 p-2 p-sm-3 text-center transition-all hover-up">
              <p className="text-muted mb-1 fs-11 text-uppercase fw-bold tracking-wider">Interventions</p>
              <p className="mb-0 fw-bold fs-22 text-dark">{stats?.totalInterventions ?? 0}</p>
              <p className="mb-0 text-success fs-11 fw-medium">+{stats?.interventionsMois ?? 0} ce mois</p>
            </div>
          </Col>
          <Col xs={4}>
            <div className="bg-light bg-opacity-50 border border-light-subtle rounded-4 p-2 p-sm-3 text-center transition-all hover-up">
              <p className="text-muted mb-1 fs-11 text-uppercase fw-bold tracking-wider">En cours</p>
              <p className="mb-0 fw-bold fs-22 text-dark">{stats?.interventionsEnCours ?? 0}</p>
              <p className="mb-0 text-warning fs-11 fw-medium">{stats?.prioritaires ?? 0} critiques</p>
            </div>
          </Col>
          <Col xs={4}>
            <div className="bg-light bg-opacity-50 border border-light-subtle rounded-4 p-2 p-sm-3 text-center transition-all hover-up">
              <p className="text-muted mb-1 fs-11 text-uppercase fw-bold tracking-wider">Résolution</p>
              <p className="mb-0 fw-bold fs-22 text-dark">{stats?.tauxResolution ?? 0}%</p>
              <p className={`mb-0 fs-11 fw-medium ${(stats?.tauxResolution ?? 0) >= 90 ? 'text-success' : 'text-danger'}`}>
                Cible 90%
              </p>
            </div>
          </Col>
        </div>

        {/* ── Infos Métier & Contact ─────────────────────────── */}
        <div className="border-top pt-4 mb-4">
          <Row className="g-4">
            <Col sm={6}>
              <div className="d-flex align-items-start gap-3">
                <div className="flex-shrink-0 bg-soft-primary text-primary rounded-circle p-2">
                  <IconifyIcon icon="tabler:mail" className="fs-18" />
                </div>
                <div>
                  <p className="text-muted mb-1 fs-11 text-uppercase fw-bold">E-mail Professionnel</p>
                  <a href={`mailto:${email}`} className="fs-14 text-dark fw-medium d-block text-truncate" style={{ maxWidth: '180px' }}>
                    {email}
                  </a>
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-start gap-3">
                <div className="flex-shrink-0 bg-soft-primary text-primary rounded-circle p-2">
                  <IconifyIcon icon="tabler:phone" className="fs-18" />
                </div>
                <div>
                  <p className="text-muted mb-1 fs-11 text-uppercase fw-bold">Téléphone</p>
                  <span className="fs-14 text-dark fw-medium d-block">
                    {profile?.telephone || 'Non renseigné'}
                  </span>
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-start gap-3">
                <div className="flex-shrink-0 bg-soft-primary text-primary rounded-circle p-2">
                  <IconifyIcon icon="tabler:map-pin" className="fs-18" />
                </div>
                <div>
                  <p className="text-muted mb-1 fs-11 text-uppercase fw-bold">Localisation Site</p>
                  <span className="fs-14 text-dark fw-medium d-block">
                    {profile?.site || 'Siège Social'}
                  </span>
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-start gap-3">
                <div className="flex-shrink-0 bg-soft-primary text-primary rounded-circle p-2">
                  <IconifyIcon icon="tabler:tool" className="fs-18" />
                </div>
                <div>
                  <p className="text-muted mb-1 fs-11 text-uppercase fw-bold">Spécialité Technique</p>
                  <span className="fs-14 text-dark fw-medium d-block">
                    {profile?.specialite || 'Maintenance Générale'}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* ── Compétences Certifiées ────────────────────────────── */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <p className="text-muted mb-0 fs-11 fw-bold text-uppercase">Compétences Certifiées</p>
            <IconifyIcon icon="tabler:certificate" className="text-warning fs-18" />
          </div>
          <div className="d-flex flex-wrap gap-2">
            {DEFAULT_COMPETENCES.map(c => (
              <span key={c} className="badge bg-soft-info text-info border border-info border-opacity-10 rounded-pill px-3 py-1 fs-12 fw-medium">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* ── Actions Principales ─────────────────────────────────── */}
        <div className="d-flex flex-column flex-sm-row gap-3 pt-2">
          <Link
            to="/users/profile/edit"
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-2 px-4 flex-grow-1 shadow-sm rounded-pill"
          >
            <IconifyIcon icon="tabler:edit" className="fs-20" />
            <span className="fw-bold">Éditer mon profil</span>
          </Link>
          <Link
            to="/maintenance/interventions"
            className="btn btn-soft-dark d-flex align-items-center justify-content-center gap-2 py-2 px-4 flex-grow-1 rounded-pill"
          >
            <IconifyIcon icon="tabler:history" className="fs-20" />
            <span className="fw-semibold">Interventions</span>
          </Link>
        </div>

      </CardBody>
    </Card>
  )
}

export default ProfileCard