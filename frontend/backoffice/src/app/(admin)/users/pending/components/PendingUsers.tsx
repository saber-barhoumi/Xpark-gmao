import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Table, Button, Spinner, Modal, Form } from 'react-bootstrap';
import { userService, PendingUser } from '@/services/userService';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useApiError } from '@/hooks/useApiError';
import { AlerteErreur } from '@/components/AlerteErreur';

const PendingUsers = () => {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showApprove, setShowApprove] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);

    // Forms state
    const [selectedRole, setSelectedRole] = useState('CHAUFFEUR');
    const [rejectReason, setRejectReason] = useState('');
    const { error, execute, clearError } = useApiError();

    const fetchUsers = async () => {
        setLoading(true);
        const data = await execute(() => userService.getPendingUsers());
        if (data) {
            setUsers(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openApprove = (user: PendingUser) => {
        setSelectedUser(user);
        setSelectedRole(user.role || 'CHAUFFEUR');
        setShowApprove(true);
        clearError();
    };

    const openReject = (user: PendingUser) => {
        setSelectedUser(user);
        setRejectReason('');
        setShowReject(true);
        clearError();
    };

    const handleApprove = async () => {
        if (!selectedUser) return;
        setSubmitting(true);
        clearError();
        const success = await execute(async () => {
            await userService.approveUser(selectedUser.idUtilisateur, selectedRole);
            setShowApprove(false);
            fetchUsers();
            return true;
        });
        setSubmitting(false);
    };

    const handleReject = async () => {
        if (!selectedUser) return;
        if (!rejectReason) {
            // We can simulate a validation error locally or just let the backend handle it if it does
            return;
        }
        setSubmitting(true);
        clearError();
        const success = await execute(async () => {
            await userService.rejectUser(selectedUser.idUtilisateur, rejectReason);
            setShowReject(false);
            fetchUsers();
            return true;
        });
        setSubmitting(false);
    };

    return (
        <>
            <Row>
                <Col xs={12}>
                    <Card>
                        <div className="table-responsive">
                            <Table className="table-centered table-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Nom Complet</th>
                                        <th>Email</th>
                                        <th>Téléphone</th>
                                        <th>Rôle Demandé</th>
                                        <th>Date Création</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4">
                                                <Spinner animation="border" variant="primary" />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4 text-muted">
                                                Aucun utilisateur en attente d'approbation.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.idUtilisateur}>
                                                <td>{user.nom} {user.prenom}</td>
                                                <td>{user.email}</td>
                                                <td>{user.telephone}</td>
                                                <td><span className="badge bg-info">{user.role}</span></td>
                                                <td>{new Date(user.dateCreation).toLocaleDateString()}</td>
                                                <td>
                                                    <Button variant="success" size="sm" className="me-2" onClick={() => openApprove(user)}>
                                                        <IconifyIcon icon="tabler:check" className="fs-16 me-1" /> Approuver
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => openReject(user)}>
                                                        <IconifyIcon icon="tabler:x" className="fs-16 me-1" /> Rejeter
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Modal Approuver */}
            <Modal show={showApprove} onHide={() => !submitting && setShowApprove(false)}>
                <Modal.Header closeButton={!submitting}>
                    <Modal.Title>Approuver Utilisateur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && (
                        <AlerteErreur
                            status={error.status}
                            message={error.message}
                            onDismiss={clearError}
                            className="mb-3"
                        />
                    )}
                    <p>Vous êtes sur le point d'approuver <strong>{selectedUser?.nom} {selectedUser?.prenom}</strong>.</p>
                    <Form.Group className="mb-3">
                        <Form.Label>Attribuer un rôle final :</Form.Label>
                        <Form.Select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            disabled={submitting}
                        >
                            <option value="CLIENT">Client</option>
                            <option value="CHAUFFEUR">Chauffeur</option>
                            <option value="TECHNICIEN">Technicien</option>
                            <option value="GESTIONNAIRE">Gestionnaire</option>
                            <option value="ADMIN">Administrateur</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowApprove(false)} disabled={submitting}>
                        Annuler
                    </Button>
                    <Button variant="success" onClick={handleApprove} disabled={submitting}>
                        {submitting ? 'Validation...' : 'Confirmer'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Rejeter */}
            <Modal show={showReject} onHide={() => !submitting && setShowReject(false)}>
                <Modal.Header closeButton={!submitting}>
                    <Modal.Title>Rejeter Utilisateur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && (
                        <AlerteErreur
                            status={error.status}
                            message={error.message}
                            onDismiss={clearError}
                            className="mb-3"
                        />
                    )}
                    <p>Voulez-vous rejeter la demande de <strong>{selectedUser?.nom} {selectedUser?.prenom}</strong> ?</p>
                    <Form.Group className="mb-3">
                        <Form.Label>Raison du rejet (envoyée par email) :</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            disabled={submitting}
                            placeholder="Ex: Informations incomplètes..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReject(false)} disabled={submitting}>
                        Annuler
                    </Button>
                    <Button variant="danger" onClick={handleReject} disabled={submitting}>
                        {submitting ? 'Rejet...' : 'Rejeter'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default PendingUsers;
