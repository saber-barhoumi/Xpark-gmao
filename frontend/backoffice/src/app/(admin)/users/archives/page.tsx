import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import userService, { ArchivedUser } from '@/services/userService'

/**
 * Archives des comptes — /users/archives.
 *
 * Un compte porteur d'historique métier (missions, factures, maintenance,
 * messagerie…) n'est jamais détruit : il est archivé ici. Il disparaît des
 * écrans actifs, ses relations restent intactes, et il peut être restauré.
 * La purge définitive n'est possible que si plus aucune donnée n'y est liée.
 */

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'danger', ADMINISTRATEUR: 'danger', GESTIONNAIRE: 'warning',
    TECHNICIEN: 'info', CHAUFFEUR: 'primary', CLIENT: 'secondary', RH: 'success',
}

const dateFr = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function ArchivesPage() {
    const [archives, setArchives] = useState<ArchivedUser[]>([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState<string | null>(null)
    const [search, setSearch]     = useState('')
    const [roleFilter, setRole]   = useState('')
    const [busy, setBusy]         = useState<number | null>(null)

    const charger = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            setArchives(await userService.getArchived())
        } catch {
            setError('Impossible de charger les archives.')
        } finally {
            setLoading(false)
        }
    }, [])
    useEffect(() => { charger() }, [charger])

    const filtres = useMemo(() => archives.filter(a => {
        const q = search.trim().toLowerCase()
        return (!roleFilter || a.role === roleFilter)
            && (!q
                || `${a.prenom} ${a.nom}`.toLowerCase().includes(q)
                || (a.email ?? '').toLowerCase().includes(q)
                || (a.telephone ?? '').includes(q))
    }), [archives, search, roleFilter])

    const roles = useMemo(() => [...new Set(archives.map(a => a.role))].sort(), [archives])

    const restaurer = async (a: ArchivedUser) => {
        const r = await Swal.fire({
            title: `Restaurer ${a.prenom} ${a.nom} ?`,
            text: 'Le compte réapparaîtra dans la liste des utilisateurs, suspendu. Vous devrez le réactiver pour rétablir son accès.',
            icon: 'question', showCancelButton: true,
            confirmButtonText: 'Restaurer', cancelButtonText: 'Annuler',
        })
        if (!r.isConfirmed) return
        setBusy(a.idUtilisateur)
        try {
            await userService.restoreArchived(a.idUtilisateur)
            await charger()
            Swal.fire('Compte restauré', 'Il est suspendu : réactivez-le depuis la page Utilisateurs.', 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Restauration impossible.', 'error')
        } finally { setBusy(null) }
    }

    const purger = async (a: ArchivedUser) => {
        if (a.totalReferences > 0) {
            Swal.fire('Purge impossible',
                `Ce compte porte ${a.totalReferences} donnée(s) métier. L'historique de l'entreprise doit être préservé.`,
                'warning')
            return
        }
        const r = await Swal.fire({
            title: 'Supprimer définitivement ?',
            text: `${a.prenom} ${a.nom} sera effacé sans possibilité de retour.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Supprimer définitivement', cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33',
        })
        if (!r.isConfirmed) return
        setBusy(a.idUtilisateur)
        try {
            await userService.purgeArchived(a.idUtilisateur)
            await charger()
            Swal.fire('Supprimé', 'Le compte a été définitivement supprimé.', 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression impossible.', 'error')
        } finally { setBusy(null) }
    }

    return (
        <>
            <PageBreadcrumb title="Archives" subName="Administration" />

            <Alert variant="info" className="d-flex align-items-start gap-2">
                <IconifyIcon icon="tabler:archive" className="fs-20 mt-1 flex-shrink-0" />
                <div>
                    Les comptes qui portent un <strong>historique métier</strong> (missions, factures,
                    maintenance, messagerie…) ne sont jamais détruits : ils sont archivés ici.
                    Leur historique reste intact et ils peuvent être restaurés à tout moment.
                </div>
            </Alert>

            <Card className="mb-3">
                <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="text-muted fs-14">
                        <strong>{filtres.length}</strong> compte{filtres.length > 1 ? 's' : ''} archivé{filtres.length > 1 ? 's' : ''}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <Form.Select size="sm" style={{ minWidth: 160 }} value={roleFilter}
                            onChange={e => setRole(e.target.value)}>
                            <option value="">Tous les rôles</option>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </Form.Select>
                        <InputGroup size="sm" style={{ minWidth: 240 }}>
                            <InputGroup.Text className="bg-light"><IconifyIcon icon="tabler:search" /></InputGroup.Text>
                            <Form.Control placeholder="Nom, e-mail, téléphone…"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </InputGroup>
                        <Button variant="light" size="sm" onClick={charger} title="Actualiser">
                            <IconifyIcon icon="tabler:refresh" />
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2 mb-0">Chargement des archives…</p>
                </div>
            ) : error ? (
                <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                    <span><IconifyIcon icon="tabler:alert-circle" className="me-2" />{error}</span>
                    <Button size="sm" variant="outline-danger" onClick={charger}>Réessayer</Button>
                </Alert>
            ) : filtres.length === 0 ? (
                <Card><Card.Body className="text-center text-muted py-5">
                    <IconifyIcon icon="tabler:archive-off" className="fs-48 mb-2 opacity-25" />
                    <p className="mb-1">
                        {archives.length === 0 ? 'Aucun compte archivé.' : 'Aucun archivé ne correspond à votre recherche.'}
                    </p>
                    {archives.length > 0 && (
                        <Button variant="link" size="sm" onClick={() => { setSearch(''); setRole('') }}>
                            Réinitialiser les filtres
                        </Button>
                    )}
                </Card.Body></Card>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-3">Compte</th>
                                    <th>Rôle</th>
                                    <th>Contact</th>
                                    <th>Créé le</th>
                                    <th>Archivé le</th>
                                    <th>Historique conservé</th>
                                    <th className="text-end pe-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtres.map(a => (
                                    <tr key={a.idUtilisateur}>
                                        <td className="ps-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="rounded-circle bg-soft-secondary text-secondary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                                    style={{ width: 36, height: 36 }}>
                                                    {`${(a.prenom || '?')[0] ?? ''}${(a.nom || '')[0] ?? ''}`.toUpperCase()}
                                                </span>
                                                <div>
                                                    <div className="fw-semibold">{a.prenom} {a.nom}</div>
                                                    <div className="text-muted fs-12">#{a.idUtilisateur}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><Badge bg={ROLE_COLORS[a.role] ?? 'secondary'}>{a.role}</Badge></td>
                                        <td className="small">
                                            <div className="text-truncate" style={{ maxWidth: 220 }}>{a.email}</div>
                                            <div className="text-muted">{a.telephone || '—'}</div>
                                        </td>
                                        <td className="small">{dateFr(a.dateCreation)}</td>
                                        <td className="small">{dateFr(a.dateArchivage)}</td>
                                        <td>
                                            {a.totalReferences > 0 ? (
                                                <Badge bg="soft-info" text="info" className="fw-normal">
                                                    <IconifyIcon icon="tabler:database" className="me-1" />
                                                    {a.totalReferences} donnée(s)
                                                </Badge>
                                            ) : (
                                                <span className="text-muted small">Aucune</span>
                                            )}
                                        </td>
                                        <td className="text-end pe-3">
                                            <div className="d-flex gap-1 justify-content-end">
                                                <Button variant="outline-success" size="sm" title="Restaurer"
                                                    disabled={busy === a.idUtilisateur}
                                                    onClick={() => restaurer(a)}>
                                                    {busy === a.idUtilisateur
                                                        ? <Spinner animation="border" size="sm" />
                                                        : <IconifyIcon icon="tabler:arrow-back-up" />}
                                                </Button>
                                                <Button variant="outline-danger" size="sm"
                                                    title={a.totalReferences > 0
                                                        ? 'Purge impossible : historique métier rattaché'
                                                        : 'Supprimer définitivement'}
                                                    disabled={busy === a.idUtilisateur || a.totalReferences > 0}
                                                    onClick={() => purger(a)}>
                                                    <IconifyIcon icon="tabler:trash-x" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}
        </>
    )
}
