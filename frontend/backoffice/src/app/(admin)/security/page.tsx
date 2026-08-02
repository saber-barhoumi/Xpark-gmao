import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import authService, { AuthenticatorSetup, LoginHistoryEntry, MfaSettings } from '@/services/authService'

/**
 * Page Sécurité — /security (FICHE Authentication & Security §4)
 * MFA (Authenticator TOTP + Email OTP) et historique des connexions.
 */
export default function SecurityPage() {
    const [settings, setSettings] = useState<MfaSettings | null>(null)
    const [history, setHistory] = useState<LoginHistoryEntry[]>([])
    const [loading, setLoading] = useState(true)

    // Setup Authenticator (modal QR)
    const [setup, setSetup] = useState<AuthenticatorSetup | null>(null)
    const [confirmCode, setConfirmCode] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [setupError, setSetupError] = useState('')

    // ── Gestion de l'historique : recherche, filtre, sélection, suppression ──
    const [rechercheHisto, setRechercheHisto]   = useState('')
    const [filtreResultat, setFiltreResultat]   = useState('')      // '' | 'ok' | 'ko'
    const [selection, setSelection]             = useState<Set<number>>(new Set())
    const [suppression, setSuppression]         = useState(false)

    const refresh = useCallback(async () => {
        try {
            const [s, h] = await Promise.all([
                authService.getMfaSettings(),
                // 200 entrées : la gestion (filtre, recherche, purge) n'a de sens
                // que sur un historique complet, pas sur les 20 dernières.
                authService.getLoginHistory(200),
            ])
            setSettings(s)
            setHistory(h)
            setSelection(new Set())
        } catch {
            Swal.fire('Erreur', 'Impossible de charger les paramètres de sécurité.', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { refresh() }, [refresh])

    const historiqueFiltre = useMemo(() => {
        let list = [...history]
        if (filtreResultat === 'ok') list = list.filter(h => h.isSuccessful)
        if (filtreResultat === 'ko') list = list.filter(h => !h.isSuccessful)
        const q = rechercheHisto.trim().toLowerCase()
        if (q) {
            list = list.filter(h =>
                (h.ipAddress ?? '').toLowerCase().includes(q) ||
                (h.loginMethod ?? '').toLowerCase().includes(q) ||
                (h.mfaMethod ?? '').toLowerCase().includes(q) ||
                (h.userAgent ?? '').toLowerCase().includes(q) ||
                (h.failureReason ?? '').toLowerCase().includes(q) ||
                new Date(h.loggedInAt).toLocaleString('fr-FR').toLowerCase().includes(q))
        }
        return list
    }, [history, filtreResultat, rechercheHisto])

    const filtreActif = !!filtreResultat || !!rechercheHisto.trim()
    // « Tout sélectionner » porte sur ce qui est VISIBLE : on ne supprime jamais
    // une ligne masquée par un filtre sans que l'utilisateur l'ait vue.
    const toutSelectionne = historiqueFiltre.length > 0
        && historiqueFiltre.every(h => selection.has(h.id))

    const basculerLigne = (id: number) => setSelection(prev => {
        const s = new Set(prev)
        s.has(id) ? s.delete(id) : s.add(id)
        return s
    })

    const basculerTout = () => setSelection(prev => {
        if (toutSelectionne) {
            const s = new Set(prev)
            historiqueFiltre.forEach(h => s.delete(h.id))
            return s
        }
        return new Set([...prev, ...historiqueFiltre.map(h => h.id)])
    })

    const supprimerSelection = async () => {
        const ids = [...selection]
        const r = await Swal.fire({
            title: `Supprimer ${ids.length} entrée(s) ?`,
            text: 'Ces connexions disparaîtront de votre historique de sécurité.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#d33',
        })
        if (!r.isConfirmed) return
        setSuppression(true)
        try {
            await Promise.all(ids.map(id => authService.deleteLoginHistory(id)))
            await refresh()
            Swal.fire({ icon: 'success', title: `${ids.length} entrée(s) supprimée(s)`, timer: 1600, showConfirmButton: false })
        } catch {
            Swal.fire('Erreur', 'La suppression a échoué.', 'error')
            await refresh()
        } finally { setSuppression(false) }
    }

    const supprimerTout = async () => {
        const r = await Swal.fire({
            title: 'Effacer tout l’historique ?',
            text: 'La totalité de vos connexions enregistrées sera supprimée. Action irréversible.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Tout effacer', cancelButtonText: 'Annuler', confirmButtonColor: '#d33',
        })
        if (!r.isConfirmed) return
        setSuppression(true)
        try {
            await authService.clearLoginHistory()
            await refresh()
            Swal.fire({ icon: 'success', title: 'Historique effacé', timer: 1600, showConfirmButton: false })
        } catch {
            Swal.fire('Erreur', 'Le nettoyage a échoué.', 'error')
        } finally { setSuppression(false) }
    }

    // ── Authenticator ────────────────────────────────────────────────────────

    const startAuthenticatorSetup = async () => {
        try {
            setSetup(await authService.setupAuthenticator())
            setConfirmCode('')
            setSetupError('')
        } catch {
            Swal.fire('Erreur', "Impossible de démarrer la configuration de l'Authenticator.", 'error')
        }
    }

    const confirmAuthenticator = async () => {
        setConfirming(true)
        setSetupError('')
        try {
            const updated = await authService.confirmAuthenticator(confirmCode)
            setSettings(updated)
            setSetup(null)
            Swal.fire('MFA activé',
                'Google/Microsoft Authenticator est maintenant requis à chaque connexion.', 'success')
            refresh()
        } catch (err: any) {
            setSetupError(err.response?.data?.message || 'Code invalide. Vérifiez votre application.')
        } finally {
            setConfirming(false)
        }
    }

    const disableAuthenticator = async () => {
        const res = await Swal.fire({
            title: "Désactiver l'Authenticator ?",
            text: 'Votre compte sera moins protégé.',
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#dc3545', confirmButtonText: 'Désactiver',
        })
        if (!res.isConfirmed) return
        setSettings(await authService.disableAuthenticator())
        refresh()
    }

    const toggleEmail = async () => {
        setSettings(await authService.toggleEmailOtp())
        refresh()
    }

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:shield-keyhole-line" className="me-2 text-primary" />
                        Sécurité du compte
                    </h4>
                    <p className="text-muted mb-0">
                        Authentification multi-facteurs (MFA) et historique des connexions
                    </p>
                </Col>
                <Col xs="auto">
                    {settings?.mfaRequired
                        ? <Badge bg="success"><IconifyIcon icon="ri:lock-line" className="me-1" />MFA activé</Badge>
                        : <Badge bg="warning" text="dark"><IconifyIcon icon="ri:lock-unlock-line" className="me-1" />MFA non activé</Badge>}
                </Col>
            </Row>

            {/* ── Méthodes MFA ──────────────────────────────────── */}
            <Row className="g-3 mb-4">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="mb-1">
                                        <IconifyIcon icon="ri:smartphone-line" className="me-1 text-primary" />
                                        Application Authenticator (TOTP)
                                    </h6>
                                    <p className="small text-muted mb-2">
                                        Code à 6 chiffres généré par Google Authenticator, Microsoft
                                        Authenticator ou Authy — change toutes les 30 secondes.
                                    </p>
                                </div>
                                <Badge bg={settings?.authenticatorEnabled ? 'success' : 'secondary'}>
                                    {settings?.authenticatorEnabled ? 'Activé' : 'Désactivé'}
                                </Badge>
                            </div>
                            {settings?.authenticatorEnabled ? (
                                <Button variant="outline-danger" size="sm" onClick={disableAuthenticator}>
                                    Désactiver
                                </Button>
                            ) : (
                                <Button variant="primary" size="sm" onClick={startAuthenticatorSetup}>
                                    <IconifyIcon icon="ri:qr-code-line" className="me-1" />
                                    Configurer avec QR code
                                </Button>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="mb-1">
                                        <IconifyIcon icon="ri:mail-lock-line" className="me-1 text-primary" />
                                        Vérification par Email (OTP)
                                    </h6>
                                    <p className="small text-muted mb-2">
                                        Code à 6 chiffres envoyé par email à chaque connexion —
                                        valide 10 minutes, 5 tentatives maximum.
                                    </p>
                                </div>
                                <Badge bg={settings?.emailOtpEnabled ? 'success' : 'secondary'}>
                                    {settings?.emailOtpEnabled ? 'Activé' : 'Désactivé'}
                                </Badge>
                            </div>
                            <Button
                                variant={settings?.emailOtpEnabled ? 'outline-danger' : 'primary'}
                                size="sm" onClick={toggleEmail}
                            >
                                {settings?.emailOtpEnabled ? 'Désactiver' : 'Activer'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ── Historique des connexions ─────────────────────── */}
            <Card>
                <Card.Header className="bg-transparent d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="mb-0">
                        <IconifyIcon icon="ri:history-line" className="me-1" />
                        Historique des connexions
                        <span className="text-muted fw-normal ms-1">
                            ({historiqueFiltre.length}{filtreActif ? ` sur ${history.length}` : ''})
                        </span>
                    </h6>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                        <Form.Select size="sm" style={{ width: 150 }} value={filtreResultat}
                            onChange={e => setFiltreResultat(e.target.value)}>
                            <option value="">Tous les résultats</option>
                            <option value="ok">Réussies</option>
                            <option value="ko">Échecs</option>
                        </Form.Select>
                        <InputGroup size="sm" style={{ width: 220 }}>
                            <InputGroup.Text className="bg-light"><IconifyIcon icon="ri:search-line" /></InputGroup.Text>
                            <Form.Control placeholder="IP, méthode, appareil…"
                                value={rechercheHisto} onChange={e => setRechercheHisto(e.target.value)} />
                        </InputGroup>
                        {selection.size > 0 && (
                            <Button variant="danger" size="sm" disabled={suppression}
                                onClick={supprimerSelection}>
                                <IconifyIcon icon="ri:delete-bin-line" className="me-1" />
                                Supprimer ({selection.size})
                            </Button>
                        )}
                        <Button variant="outline-danger" size="sm"
                            disabled={suppression || history.length === 0} onClick={supprimerTout}>
                            <IconifyIcon icon="ri:delete-bin-7-line" className="me-1" />
                            Tout effacer
                        </Button>
                    </div>
                </Card.Header>
                <div className="table-responsive">
                    <Table hover size="sm" className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: 34 }} className="ps-3">
                                    <input type="checkbox" className="form-check-input"
                                        title="Tout sélectionner"
                                        checked={toutSelectionne}
                                        ref={el => { if (el) el.indeterminate = selection.size > 0 && !toutSelectionne }}
                                        onChange={basculerTout} />
                                </th>
                                <th>Date</th><th>Méthode</th><th>MFA</th>
                                <th>Adresse IP</th><th>Résultat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historiqueFiltre.length === 0 && (
                                <tr><td colSpan={6} className="text-center text-muted py-4">
                                    {history.length === 0
                                        ? 'Aucune connexion enregistrée pour l’instant'
                                        : 'Aucune connexion ne correspond aux critères'}
                                </td></tr>
                            )}
                            {historiqueFiltre.map(h => (
                                <tr key={h.id} className={selection.has(h.id) ? 'table-active' : undefined}>
                                    <td className="ps-3">
                                        <input type="checkbox" className="form-check-input"
                                            checked={selection.has(h.id)}
                                            onChange={() => basculerLigne(h.id)} />
                                    </td>
                                    <td className="small">{new Date(h.loggedInAt).toLocaleString('fr-FR')}</td>
                                    <td className="small">{h.loginMethod}</td>
                                    <td className="small">{h.mfaMethod
                                        ? <Badge bg="info">{h.mfaMethod}</Badge>
                                        : <span className="text-muted">—</span>}</td>
                                    <td className="small text-muted">{h.ipAddress || '—'}</td>
                                    <td>
                                        {h.isSuccessful
                                            ? <Badge bg="success">Réussie</Badge>
                                            : <Badge bg="danger" title={h.failureReason ?? ''}>Échec</Badge>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card>

            {/* ── Modal setup Authenticator (QR) ────────────────── */}
            <Modal show={!!setup} onHide={() => setSetup(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-16">
                        <IconifyIcon icon="ri:smartphone-line" className="me-2" />
                        Configurer l&apos;Authenticator
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <p className="small text-muted">
                        <strong>Étape 1</strong> — Ouvrez Google/Microsoft Authenticator et scannez :
                    </p>
                    {setup && <img src={setup.qrCodeDataUri} alt="QR Code" width={200} height={200} />}
                    <p className="small text-muted mt-2 mb-3">
                        Ou saisissez la clé manuellement : <code>{setup?.secret}</code>
                    </p>
                    <p className="small text-muted">
                        <strong>Étape 2</strong> — Entrez le code à 6 chiffres affiché :
                    </p>
                    <input
                        type="text" inputMode="numeric" maxLength={6}
                        className="form-control text-center fs-4 fw-bold mb-2"
                        style={{ letterSpacing: '0.5em', maxWidth: 220, margin: '0 auto' }}
                        value={confirmCode}
                        onChange={e => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        autoFocus
                    />
                    {setupError && <Alert variant="danger" className="py-1 small">{setupError}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => setSetup(null)}>Annuler</Button>
                    <Button variant="primary" size="sm" onClick={confirmAuthenticator}
                        disabled={confirmCode.length !== 6 || confirming}>
                        {confirming
                            ? <><Spinner animation="border" size="sm" className="me-1" />Vérification…</>
                            : 'Valider & Activer'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
