import React, { useState, useRef, KeyboardEvent } from 'react'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'

const PIN_LENGTH = 6

const LoginPinPage = () => {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState(Array(PIN_LENGTH).fill(''))
  const [step, setStep] = useState<'email' | 'pin'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    if (value && index < PIN_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleEmailStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) return
    setStep('pin')
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const pinCode = pin.join('')
    if (pinCode.length < PIN_LENGTH) {
      setError('Veuillez saisir tous les chiffres du PIN')
      return
    }
    setLoading(true)
    try {
      await authService.loginWithPin({ email, pin: pinCode })
      window.location.href = '/'
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou PIN incorrect')
      setPin(Array(PIN_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title='Login Pin' />
      <div className="auth-bg d-flex min-vh-100">
        <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
          <Col xxl={3} lg={5} md={6}>
            <a href="/" className="auth-brand d-flex justify-content-center mb-2">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </a>
            <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
            <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
              <h4 className="fw-semibold mb-2 fs-20">Connexion avec PIN</h4>

              {step === 'email' ? (
                <>
                  <p className="text-muted mb-4">Entrez votre email pour continuer avec votre code PIN.</p>
                  {error && <div className="alert alert-danger text-start mb-3">{error}</div>}
                  <form onSubmit={handleEmailStep} className="text-start mb-3">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="pin-email">Email</label>
                      <input
                        type="email"
                        id="pin-email"
                        className="form-control"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="d-grid">
                      <button className="btn btn-primary fw-semibold" type="submit" id="btn-pin-next">
                        Continuer
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-muted mb-4">
                    Entrez votre code PIN à {PIN_LENGTH} chiffres pour&nbsp;
                    <span className="fw-semibold text-dark">{email}</span>
                  </p>
                  {error && <div className="alert alert-danger text-start mb-3">{error}</div>}
                  <form onSubmit={handlePinSubmit} className="text-start mb-3">
                    <label className="form-label" htmlFor="pin-0">Code PIN</label>
                    <div className="d-flex gap-2 mt-1 mb-3 justify-content-center">
                      {pin.map((digit, i) => (
                        <input
                          key={i}
                          id={`pin-${i}`}
                          ref={(el) => { inputRefs.current[i] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="form-control text-center fw-bold fs-20"
                          style={{ width: 46, height: 54 }}
                          value={digit}
                          onChange={(e) => handlePinChange(i, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(i, e)}
                          autoComplete="off"
                        />
                      ))}
                    </div>
                    <div className="mb-3 d-grid">
                      <button className="btn btn-primary fw-semibold" type="submit" disabled={loading} id="btn-pin-submit">
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Vérification...</>
                        ) : 'Se connecter'}
                      </button>
                    </div>
                    <button type="button" className="btn btn-link text-muted p-0 fs-13" onClick={() => { setStep('email'); setPin(Array(PIN_LENGTH).fill('')) }}>
                      ← Changer d'email
                    </button>
                  </form>
                </>
              )}

              <p className="text-muted fs-14 mb-0">
                Connexion classique ?&nbsp;
                <a href="/auth/login" className="fw-semibold text-danger ms-1">Email + Mot de passe</a>
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

export default LoginPinPage