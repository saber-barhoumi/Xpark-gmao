import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  Card, CardBody, CardHeader,
  Col, Row, Form, Spinner,
} from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService, { AuthResponse } from '@/services/authService'
import profileService from '@/services/profileService'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'

// ── Types ──────────────────────────────────────────────────────
interface ProfileFormData {
  prenom:          string
  nom:             string
  email:           string
  telephone:       string
  site:            string
  specialite:      string
  departement:     string
  bio:             string
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}

type FieldErrors = Partial<Record<keyof ProfileFormData, string>>

const SPECIALITES = [
  'Électromécanique', 'Hydraulique', 'Pneumatique',
  'Électricité industrielle', 'Automatisme',
  'HVAC', 'Informatique industrielle', 'Mécanique générale',
]

const DEPARTEMENTS = [
  'Direction Maintenance', 'Direction Exploitation',
  'Direction Technique', 'Ressources Humaines', 'Administration',
]

// ── Composant de secours (Unauthorized / 401 Style) ──────────────
const UnauthorizedView = () => (
  <div className="auth-bg d-flex min-vh-100 align-items-center">
    <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
      <Col xxl={4} lg={6} md={8}>
        <div className="auth-brand d-flex justify-content-center mb-2">
          <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
          <img src={logo} alt="logo light" height={26} className="logo-light" />
        </div>
        <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO — Système de Gestion</p>
        <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0 shadow-lg border-0">
          <div className="text-center">
            <h1 className="text-error display-1 fw-bold text-primary">401</h1>
            <h3 className="mt-3 mb-2">Accès Non Autorisé</h3>
            <p className="text-muted mb-4 fs-14">
              Désolé, mais vous n'êtes pas autorisé à accéder à cette page. 
              Veuillez vous reconnecter pour continuer.
            </p>
            <Link to="/auth/login" className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2">
              <IconifyIcon icon='tabler:login' className="fs-18" /> Se Connecter
            </Link>
          </div>
        </Card>
      </Col>
    </Row>
  </div>
)

// ── Composant Principal ──────────────────────────────────────────
const EditProfileForm = () => {
  const navigate    = useNavigate()
  const user        = authService.getCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── PROFESSIONAL FLOW : commencer avec isLoading = true ───────
  const [isLoading,    setIsLoading]    = useState(true)
  const [isSaving,     setIsSaving]     = useState(false)
  const [fetchError,   setFetchError]   = useState('')
  const [successMsg,   setSuccessMsg]   = useState('')
  const [saveError,    setSaveError]    = useState('')

  // ── Formulaire — vide par défaut, rempli APRÈS fetch ──────────
  const [form,   setForm]   = useState<ProfileFormData>({
    prenom: '', nom: '', email: '', telephone: '',
    site: '', specialite: '', departement: '', bio: '',
    currentPassword: '', newPassword: '', confirmPassword: '',
  })

  // ── Erreurs : VIDES au montage, peuplées SEULEMENT sur submit ─
  const [errors,   setErrors]   = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileFormData, boolean>>>({})

  // ── Photo ──────────────────────────────────────────────────────
  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  // ── API URL ───────────────────────────────────────────────────
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'

  // ── STEP 1 : fetch → resetForm (Professional Flow) ────────────
  useEffect(() => {
    // Si pas de user, on arrête le chargement et on laisse le switch de rendu gérer l'affichage de UnauthorizedView
    if (!user?.idUtilisateur) {
      setIsLoading(false)
      return
    }

    profileService.getProfile(user.idUtilisateur)
      .then(profile => {
        setForm(prev => ({
          ...prev,
          prenom:      profile.prenom      || '',
          nom:         profile.nom         || '',
          email:       profile.email       || '',
          telephone:   profile.telephone   || '',
          site:        profile.site        || '',
          specialite:  profile.specialite  || '',
          departement: profile.departement || '',
          bio:         profile.bio         || '',
        }))
        setPhotoUrl(profile.photoUrl ? `${API_URL.replace('/api', '')}${profile.photoUrl}` : null)
      })
      .catch((err) => {
        console.error('[EditProfileForm] Fetch error:', err)
        // Fallback sur les données du JWT si l'API échoue
        setForm(prev => ({
          ...prev,
          prenom: user.prenom || '',
          nom:    user.nom    || '',
          email:  user.email  || '',
        }))
      })
      .finally(() => {
        setIsLoading(false)
        setErrors({})
        setTouched({})
      })
  }, [])

  const validateField = (name: keyof ProfileFormData, value: string): string => {
    switch (name) {
      case 'prenom':
        return value.trim() ? '' : 'Le prénom est requis'
      case 'nom':
        return value.trim() ? '' : 'Le nom est requis'
      case 'email':
        if (!value.trim()) return "L'email est requis"
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email invalide'
        return ''
      case 'newPassword':
        if (value && value.length < 8) return '8 caractères minimum'
        return ''
      case 'confirmPassword':
        if (form.newPassword && value !== form.newPassword)
          return 'Les mots de passe ne correspondent pas'
        return ''
      case 'currentPassword':
        if (form.newPassword && !value) return 'Mot de passe actuel requis'
        return ''
      default:
        return ''
    }
  }

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (touched[name as keyof ProfileFormData]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name as keyof ProfileFormData, value) }))
    }
  }, [touched, form.newPassword])

  const handleBlur = useCallback((
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name as keyof ProfileFormData, value),
    }))
  }, [form.newPassword])

  const validateAll = (): boolean => {
    const allFields: (keyof ProfileFormData)[] = [
      'prenom', 'nom', 'email',
      'currentPassword', 'newPassword', 'confirmPassword',
    ]

    const newErrors: FieldErrors = {}
    const newTouched: Partial<Record<keyof ProfileFormData, boolean>> = {}

    allFields.forEach(field => {
      const err = validateField(field, form[field])
      if (err) newErrors[field] = err
      newTouched[field] = true
    })

    setErrors(newErrors)
    setTouched(newTouched)
    return Object.keys(newErrors).length === 0
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Photo trop volumineuse (max 5 Mo)')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSuccessMsg('')

    if (!validateAll()) return
    if (!user?.idUtilisateur) return

    setIsSaving(true)
    try {
      const dataToSave = {
        prenom:      form.prenom,
        nom:         form.nom,
        email:       form.email,
        telephone:   form.telephone,
        site:        form.site,
        specialite:  form.specialite,
        departement: form.departement,
        bio:         form.bio,
        ...(form.newPassword ? {
          currentPassword: form.currentPassword,
          newPassword:     form.newPassword,
        } : {}),
      }

      await profileService.updateProfile(user.idUtilisateur, dataToSave)

      let finalPhotoUrl = photoUrl
      if (photoFile) {
        setPhotoUploading(true)
        const newPhotoPath = await profileService.uploadPhoto(user.idUtilisateur, photoFile)
        finalPhotoUrl = `${API_URL.replace('/api', '')}${newPhotoPath}`
        setPhotoUploading(false)
      }

      if (user) {
        const updatedUser: AuthResponse = { 
          ...user, 
          prenom: form.prenom, 
          nom: form.nom,
          photoUrl: photoFile ? finalPhotoUrl?.replace(API_URL.replace('/api', ''), '') : user.photoUrl
        }
        localStorage.setItem('xpark_user', JSON.stringify(updatedUser))
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('profileUpdate'));
      }

      setSuccessMsg('Profil mis à jour avec succès !')
      setTimeout(() => navigate('/users/profile'), 1500)

    } catch (err: any) {
      setSaveError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarSrc = photoPreview || photoUrl
  const initials  = `${form.prenom[0] ?? ''}${form.nom[0] ?? ''}`.toUpperCase() || 'XP'

  // ── GESTION DES ÉTATS DE RENDU ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Chargement de votre profil...</p>
      </div>
    )
  }

  // Si pas authentifié -> Page 401 style
  if (!user?.idUtilisateur) {
    return <UnauthorizedView />
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4 shadow-sm border-0">
          <IconifyIcon icon="tabler:circle-check" className="fs-20" />
          {successMsg}
        </div>
      )}
      {saveError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 shadow-sm border-0">
          <IconifyIcon icon="tabler:alert-circle" className="fs-20" />
          {saveError}
        </div>
      )}

      <Card className="mb-4 shadow-sm border-0 overflow-hidden">
        <CardHeader className="bg-light bg-opacity-50 border-bottom py-3">
          <h5 className="mb-0 d-flex align-items-center gap-2 fw-bold text-dark">
            <IconifyIcon icon="tabler:user-circle" className="fs-22 text-primary" />
            Informations personnelles
          </h5>
        </CardHeader>
        <CardBody className="p-4">
          <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom flex-wrap">
            <div
              className="position-relative flex-shrink-0"
              style={{ cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
              title="Changer la photo"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Photo de profil"
                  className="rounded-circle border border-4 border-white shadow-sm"
                  style={{ width: 100, height: 100, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold border border-4 border-white shadow-sm"
                  style={{ width: 100, height: 100, fontSize: 32 }}
                >
                  {initials}
                </div>
              )}
              <div
                className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow-sm"
                style={{ width: 32, height: 32 }}
              >
                <IconifyIcon icon="tabler:camera" className="fs-16 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
              />
            </div>

            <div>
              <h4 className="mb-1 fw-bold text-dark">
                {form.prenom} {form.nom}
              </h4>
              <p className="text-muted mb-3 fs-14">
                <IconifyIcon icon="tabler:mail" className="me-1" />
                {form.email}
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconifyIcon icon="tabler:upload" className="fs-18" />
                  {photoUploading ? 'Upload en cours...' : 'Changer la photo'}
                </button>
                {(photoPreview || photoFile) && (
                  <button
                    type="button"
                    className="btn btn-soft-danger d-inline-flex align-items-center gap-2"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                  >
                    <IconifyIcon icon="tabler:x" className="fs-18" />
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>

          <Row className="g-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Prénom <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={!!errors.prenom}
                  isValid={touched.prenom && !errors.prenom}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="Votre prénom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.prenom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Nom <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={!!errors.nom}
                  isValid={touched.nom && !errors.nom}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="Votre nom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Email Professionnel <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={!!errors.email}
                  isValid={touched.email && !errors.email}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="votre@email.com"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">Numéro de Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="+216 XX XXX XXX"
                />
              </Form.Group>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card className="mb-4 shadow-sm border-0 overflow-hidden">
        <CardHeader className="bg-light bg-opacity-50 border-bottom py-3">
          <h5 className="mb-0 d-flex align-items-center gap-2 fw-bold text-dark">
            <IconifyIcon icon="tabler:briefcase" className="fs-22 text-primary" />
            Informations métier & GMAO
          </h5>
        </CardHeader>
        <CardBody className="p-4">
          <Row className="g-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">Spécialité Technique</Form.Label>
                <Form.Select
                  name="specialite"
                  value={form.specialite}
                  onChange={handleChange}
                  className="form-select-lg bg-light bg-opacity-50 border-0"
                >
                  <option value="">Sélectionner une spécialité</option>
                  {SPECIALITES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">Département Affecté</Form.Label>
                <Form.Select
                  name="departement"
                  value={form.departement}
                  onChange={handleChange}
                  className="form-select-lg bg-light bg-opacity-50 border-0"
                >
                  <option value="">Sélectionner un département</option>
                  {DEPARTEMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Site / Zone de Maintenance Habituelle
                </Form.Label>
                <Form.Control
                  type="text"
                  name="site"
                  value={form.site}
                  onChange={handleChange}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="Ex: Tunis — Zone Industrielle"
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">Bio & Certifications</Form.Label>
                <Form.Control
                  as="textarea"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="Décrivez brièvement votre expérience, outils maîtrisés..."
                  style={{ resize: 'none' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card className="mb-4 shadow-sm border-0 overflow-hidden">
        <CardHeader className="bg-light bg-opacity-50 border-bottom py-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 d-flex align-items-center gap-2 fw-bold text-dark">
            <IconifyIcon icon="tabler:lock" className="fs-22 text-primary" />
            Sécurité du Compte
          </h5>
          <span className="badge bg-soft-info text-info fs-11 fw-medium px-2 py-1">
            OPTIONNEL
          </span>
        </CardHeader>
        <CardBody className="p-4">
          <Row className="g-4">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Mot de passe actuel
                </Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={!!errors.currentPassword}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="REQUIS pour changer votre mot de passe"
                  autoComplete="current-password"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.currentPassword}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Nouveau mot de passe
                </Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={!!errors.newPassword}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="8 caractères minimum"
                  autoComplete="new-password"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.newPassword}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-muted fs-12 text-uppercase mb-2">
                  Confirmez le nouveau mot de passe
                </Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={!!errors.confirmPassword}
                  className="form-control-lg bg-light bg-opacity-50 border-0"
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <div className="d-flex justify-content-end gap-3 mb-5">
        <Link
          to="/users/profile"
          className="btn btn-lg btn-soft-secondary d-inline-flex align-items-center gap-2 px-4 shadow-sm"
        >
          <IconifyIcon icon="tabler:arrow-left" className="fs-20" />
          Annuler
        </Link>
        <button
          type="submit"
          className="btn btn-lg btn-primary d-inline-flex align-items-center gap-2 px-5 shadow-lg border-0"
          disabled={isSaving}
          style={{ transition: 'all 0.2s transform active' }}
        >
          {isSaving ? (
            <>
              <Spinner animation="border" size="sm" />
              Traitement en cours...
            </>
          ) : (
            <>
              <IconifyIcon icon="tabler:device-floppy" className="fs-20" />
              Mettre à jour mon profil
            </>
          )}
        </button>
      </div>
    </Form>
  )
}

export default EditProfileForm
