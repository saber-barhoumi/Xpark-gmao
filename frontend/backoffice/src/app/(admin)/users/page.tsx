import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import authService from '@/services/authService'
import userService, { AccountUser } from '@/services/userService'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'

const ROLES = ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE', 'TECHNICIEN', 'CHAUFFEUR', 'CLIENT']

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'danger', ADMINISTRATEUR: 'danger', GESTIONNAIRE: 'warning',
    TECHNICIEN: 'info', CHAUFFEUR: 'primary', CLIENT: 'secondary',
}
const STATUT_COLORS: Record<string, string> = {
    ACTIF: 'success', EN_ATTENTE: 'info', SUSPENDU: 'warning', DESACTIVE: 'secondary',
}

/**
 * Gestion des comptes — /users
 * ADMIN / ADMINISTRATEUR / GESTIONNAIRE : liste complète des comptes de la
 * base avec rôle et statut ; modification (infos + rôle), suspension/
 * réactivation et suppression.
 */
export default function UsersPage() {
    const navigate = useNavigate()
    const [users, setUsers] = useState<AccountUser[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    // Modal édition
    const [editing, setEditing] = useState<AccountUser | null>(null)
    const [editForm, setEditForm] = useState({ nom: '', prenom: '', telephone: '', role: '' })
    const [saving, setSaving] = useState(false)

    const me = authService.getCurrentUser()
    // Seuls les rôles qui pilotent l'exploitation créent des missions (mêmes
    // rôles que la page Missions).
    const peutCreerMission = ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'].includes(me?.role ?? '')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setUsers(await userService.getAllUsers())
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Impossible de charger les comptes.', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = useMemo(() => users.filter(u => {
        const text = `${u.nom} ${u.prenom} ${u.email}`.toLowerCase()
        return (!search || text.includes(search.toLowerCase()))
            && (!roleFilter || u.role === roleFilter)
    }), [users, search, roleFilter])

    // Sélection multiple — on ne peut jamais sélectionner SON PROPRE compte
    const selectable = useMemo(() => filtered.filter(u => u.email !== me?.email), [filtered, me?.email])
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(selectable, u => u.idUtilisateur)

    // Suppression en masse : réutilise le DELETE unitaire ; les comptes liés à
    // des missions/réservations sont refusés (409) par l'API → bilan partiel.
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        const results = await Promise.allSettled(ids.map(id => userService.deleteUser(id)))
        const ok = results.filter(r => r.status === 'fulfilled').length
        const ko = results.length - ok
        sel.clear()
        await load()
        if (ko === 0) Swal.fire('Supprimés', `${ok} compte(s) supprimé(s).`, 'success')
        else Swal.fire('Bilan', `${ok} supprimé(s) · ${ko} refusé(s) (comptes liés à des missions — suspendez-les à la place).`, 'warning')
        setDeleting(false)
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    const openEdit = (u: AccountUser) => {
        setEditing(u)
        setEditForm({ nom: u.nom, prenom: u.prenom, telephone: u.telephone, role: u.role })
    }

    const saveEdit = async () => {
        if (!editing) return
        setSaving(true)
        try {
            await userService.updateUser(editing.idUtilisateur, {
                nom: editForm.nom, prenom: editForm.prenom, telephone: editForm.telephone,
            })
            if (editForm.role !== editing.role) {
                await userService.changeUserRole(editing.idUtilisateur, editForm.role)
            }
            setEditing(null)
            await load()
            Swal.fire('Enregistré', 'Le compte a été mis à jour.', 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Mise à jour impossible.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const toggleStatut = async (u: AccountUser) => {
        const suspend = u.statut === 'ACTIF'
        const confirm = await Swal.fire({
            title: suspend ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?',
            text: `${u.prenom} ${u.nom} (${u.email})`,
            icon: 'question', showCancelButton: true,
            confirmButtonText: suspend ? 'Suspendre' : 'Réactiver',
            cancelButtonText: 'Annuler',
        })
        if (!confirm.isConfirmed) return
        try {
            if (suspend) await userService.suspendUser(u.idUtilisateur)
            else await userService.activateUser(u.idUtilisateur)
            await load()
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Action impossible.', 'error')
        }
    }

    const confirmEmail = async (u: AccountUser) => {
        const confirm = await Swal.fire({
            title: "Confirmer l'email manuellement ?",
            text: `${u.email} — utile si le code de confirmation n'a pas été reçu (SMTP indisponible).`,
            icon: 'question', showCancelButton: true,
            confirmButtonText: 'Confirmer', cancelButtonText: 'Annuler',
        })
        if (!confirm.isConfirmed) return
        try {
            await userService.confirmEmailManually(u.idUtilisateur)
            await load()
            Swal.fire('Confirmé', `L'email de ${u.prenom} ${u.nom} est confirmé — le compte peut se connecter.`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Action impossible.', 'error')
        }
    }

    const deleteUser = async (u: AccountUser) => {
        const confirm = await Swal.fire({
            title: 'Supprimer définitivement ?',
            html: `<strong>${u.prenom} ${u.nom}</strong> (${u.email})<br/>
                   <small>Cette action est irréversible. Si le compte est lié à des
                   missions/réservations, la suppression sera refusée — suspendez-le à la place.</small>`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler',
        })
        if (!confirm.isConfirmed) return
        try {
            await userService.deleteUser(u.idUtilisateur)
            await load()
            Swal.fire('Supprimé', 'Le compte a été supprimé.', 'success')
        } catch (err: any) {
            Swal.fire(
                err.response?.status === 409 ? 'Suppression impossible' : 'Erreur',
                err.response?.data?.message || 'Suppression impossible.',
                err.response?.status === 409 ? 'warning' : 'error')
        }
    }

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:group-line" className="me-2 text-primary" />
                        Gestion des comptes
                    </h4>
                    <p className="text-muted mb-0">
                        {users.length} compte(s) — modifier les informations, changer le rôle, suspendre ou supprimer
                    </p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    <BulkDeleteButtons
                        selectedCount={sel.count} totalCount={selectable.length}
                        label="compte(s)" deleting={deleting}
                        onDeleteSelected={() => deleteMany(sel.selectedIds)}
                        onDeleteAll={() => deleteMany(selectable.map(u => u.idUtilisateur))}
                        warning="Votre propre compte est exclu. Les comptes liés à des missions seront refusés."
                    />
                    <Button variant="outline-secondary" size="sm" onClick={load}>
                        <IconifyIcon icon="ri:refresh-line" className="me-1" /> Rafraîchir
                    </Button>
                </Col>
            </Row>

            {/* ── Filtres ───────────────────────────────────────── */}
            <Row className="g-2 mb-3">
                <Col md={4}>
                    <Form.Control size="sm" placeholder="🔍 Rechercher (nom, prénom, email)…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </Col>
                <Col md={3}>
                    <Form.Select size="sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">Tous les rôles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </Form.Select>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <Table hover className="table-centered align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: 34 }}>
                                        <input type="checkbox" className="form-check-input"
                                            checked={sel.allSelected} onChange={sel.toggleAll}
                                            title="Tout sélectionner (sauf votre compte)" />
                                    </th>
                                    <th>Compte</th>
                                    <th>Téléphone</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th>Email confirmé</th>
                                    <th>Créé le</th>
                                    <th style={{ width: 150 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-muted py-4">Aucun compte trouvé</td></tr>
                                )}
                                {filtered.map(u => (
                                    <tr key={u.idUtilisateur}>
                                        <td>
                                            <input type="checkbox" className="form-check-input"
                                                disabled={u.email === me?.email}
                                                title={u.email === me?.email ? 'Vous ne pouvez pas supprimer votre propre compte' : undefined}
                                                checked={sel.isSelected(u.idUtilisateur)}
                                                onChange={() => sel.toggle(u.idUtilisateur)} />
                                        </td>
                                        <td>
                                            <div className="fw-semibold">
                                                {u.prenom} {u.nom}
                                                {me?.idUtilisateur === u.idUtilisateur && (
                                                    <Badge bg="dark" className="ms-2">Vous</Badge>
                                                )}
                                            </div>
                                            <div className="small text-muted">{u.email}</div>
                                        </td>
                                        <td className="small">{u.telephone || '—'}</td>
                                        <td><Badge bg={ROLE_COLORS[u.role] ?? 'secondary'}>{u.role}</Badge></td>
                                        <td><Badge bg={STATUT_COLORS[u.statut] ?? 'secondary'}>{u.statut}</Badge></td>
                                        <td>
                                            {u.emailConfirmed
                                                ? <IconifyIcon icon="ri:checkbox-circle-fill" className="text-success fs-5" />
                                                : <IconifyIcon icon="ri:close-circle-line" className="text-muted fs-5" />}
                                        </td>
                                        <td className="small">{new Date(u.dateCreation).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                {/* Créer une mission pour ce client — réutilise l'assistant
                                                    de création existant, avec le client pré-sélectionné. */}
                                                {u.role === 'CLIENT' && peutCreerMission && (
                                                    <Button variant="outline-success" size="sm"
                                                        title={`Créer une mission pour ${u.prenom} ${u.nom}`}
                                                        onClick={() => navigate(`/gestion/missions?clientId=${u.idUtilisateur}`)}>
                                                        <IconifyIcon icon="ri:truck-line" />
                                                    </Button>
                                                )}
                                                <Button variant="outline-primary" size="sm" title="Modifier"
                                                    onClick={() => openEdit(u)}>
                                                    <IconifyIcon icon="ri:pencil-line" />
                                                </Button>
                                                {!u.emailConfirmed && (
                                                    <Button variant="outline-info" size="sm"
                                                        title="Confirmer l'email manuellement (code non reçu)"
                                                        onClick={() => confirmEmail(u)}>
                                                        <IconifyIcon icon="ri:mail-check-line" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant={u.statut === 'ACTIF' ? 'outline-warning' : 'outline-success'}
                                                    size="sm"
                                                    title={u.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                                                    disabled={me?.idUtilisateur === u.idUtilisateur}
                                                    onClick={() => toggleStatut(u)}>
                                                    <IconifyIcon icon={u.statut === 'ACTIF' ? 'ri:pause-circle-line' : 'ri:play-circle-line'} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" title="Supprimer"
                                                    disabled={me?.idUtilisateur === u.idUtilisateur}
                                                    onClick={() => deleteUser(u)}>
                                                    <IconifyIcon icon="ri:delete-bin-line" />
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

            {/* ── Modal édition ─────────────────────────────────── */}
            <Modal show={!!editing} onHide={() => setEditing(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-16">
                        <IconifyIcon icon="ri:user-settings-line" className="me-2" />
                        Modifier le compte
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="small text-muted mb-3">{editing?.email}</p>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Nom</Form.Label>
                            <Form.Control size="sm" value={editForm.nom}
                                onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Prénom</Form.Label>
                            <Form.Control size="sm" value={editForm.prenom}
                                onChange={e => setEditForm({ ...editForm, prenom: e.target.value })} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Téléphone</Form.Label>
                            <Form.Control size="sm" value={editForm.telephone}
                                onChange={e => setEditForm({ ...editForm, telephone: e.target.value })} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Rôle</Form.Label>
                            <Form.Select size="sm" value={editForm.role}
                                disabled={me?.idUtilisateur === editing?.idUtilisateur}
                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </Form.Select>
                            {me?.idUtilisateur === editing?.idUtilisateur && (
                                <div className="small text-muted mt-1">Vous ne pouvez pas changer votre propre rôle.</div>
                            )}
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => setEditing(null)}>Annuler</Button>
                    <Button variant="primary" size="sm" onClick={saveEdit} disabled={saving}>
                        {saving
                            ? <><Spinner animation="border" size="sm" className="me-1" />Enregistrement…</>
                            : <><IconifyIcon icon="ri:save-3-line" className="me-1" />Enregistrer</>}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
