import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Button, Card, Col, Row, Form, Spinner, Alert, InputGroup } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import employeeService from '@/services/employeeService'
import { Employee, EmployeeDto, PostEmployee, StatutEmployee } from '@/types/employee'
import EmployeeModal from './components/EmployeeModal'
import Swal from 'sweetalert2'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'

const EmployeesPage = () => {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPost, setFilterPost] = useState('')
    const [filterStatut, setFilterStatut] = useState('')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    const loadEmployees = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await employeeService.getAll({
                post: filterPost || undefined,
                statut: filterStatut || undefined
            })
            setEmployees(data)
        } catch (err) {
            setError('Impossible de charger la liste des employés.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [filterPost, filterStatut])

    useEffect(() => {
        loadEmployees()
    }, [loadEmployees])

    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return employees
        const q = searchQuery.toLowerCase()
        return employees.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.prenom.toLowerCase().includes(q) ||
            e.numeroMatricule.toLowerCase().includes(q)
        )
    }, [employees, searchQuery])

    // Sélection multiple (désactivation en masse)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(filteredEmployees, e => e.idEmployee)

    // Désactivation en masse : réutilise employeeService.delete unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        try {
            await Promise.all(ids.map(id => employeeService.delete(id)))
            sel.clear()
            await loadEmployees()
            Swal.fire('Désactivés', `${ids.length} employé(s) désactivé(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Désactivation partielle ou impossible.', 'error')
            await loadEmployees()
        } finally { setDeleting(false) }
    }

    const handleSave = async (data: EmployeeDto) => {
        try {
            if (selectedEmployee) {
                await employeeService.update(selectedEmployee.idEmployee, data)
                Swal.fire('Succès', 'Employé mis à jour avec succès.', 'success')
            } else {
                await employeeService.create(data)
                Swal.fire('Succès', 'Nouvel employé ajouté avec succès.', 'success')
            }
            loadEmployees()
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement.'
            Swal.fire('Erreur', msg, 'error')
            throw err
        }
    }

    const handleDelete = async (emp: Employee) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: `Voulez-vous vraiment désactiver l'employé ${emp.prenom} ${emp.name} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, désactiver',
            cancelButtonText: 'Annuler'
        })

        if (result.isConfirmed) {
            try {
                await employeeService.delete(emp.idEmployee)
                Swal.fire('Désactivé', 'L\'employé a été désactivé.', 'success')
                loadEmployees()
            } catch (err) {
                Swal.fire('Erreur', 'Impossible de désactiver l\'employé.', 'error')
            }
        }
    }

    const getStatusBadge = (statut: StatutEmployee) => {
        switch (statut) {
            case StatutEmployee.DISPONIBLE: return <Badge bg="success-subtle" className="text-success border border-success">Disponible</Badge>
            case StatutEmployee.EN_MISSION: return <Badge bg="warning-subtle" className="text-warning border border-warning">En Mission</Badge>
            case StatutEmployee.EN_CONGE: return <Badge bg="primary-subtle" className="text-primary border border-primary">En Congé</Badge>
            case StatutEmployee.INACTIF: return <Badge bg="secondary-subtle" className="text-secondary border border-secondary">Inactif</Badge>
            default: return <Badge bg="light" className="text-dark">{statut}</Badge>
        }
    }

    return (
        <div className="container-fluid">
            <Row className="mb-4 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:group-line" className="me-2 text-primary" />
                        Gestion des Employés
                    </h4>
                    <p className="text-muted mb-0">Interface de gestion des ressources humaines (Moyens Humains)</p>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => { setSelectedEmployee(null); setShowModal(true) }}>
                        <IconifyIcon icon="ri:user-add-line" className="me-1" /> Ajouter un employé
                    </Button>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-3">
                    <Row className="g-2">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <IconifyIcon icon="ri:search-line" />
                                </InputGroup.Text>
                                <Form.Control
                                    className="border-start-0"
                                    placeholder="Rechercher par nom, prénom ou matricule..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={filterPost} onChange={e => setFilterPost(e.target.value)}>
                                <option value="">Tous les postes</option>
                                {Object.values(PostEmployee).map(p => <option key={p} value={p}>{p}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
                                <option value="">Tous les statuts</option>
                                {Object.values(StatutEmployee).map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button variant="outline-secondary" className="w-100" onClick={() => { setSearchQuery(''); setFilterPost(''); setFilterStatut('') }}>
                                Réinitialiser
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Chargement des données...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-muted small text-uppercase">
                                    <tr>
                                        <th className="ps-3">Matricule</th>
                                        <th>Employé</th>
                                        <th>Poste / Service</th>
                                        <th>Contacter</th>
                                        <th>Statut</th>
                                        <th className="text-end pe-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                                        <tr key={emp.idEmployee}>
                                            <td className="ps-3"><code className="fw-bold">{emp.numeroMatricule}</code></td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold">
                                                        {emp.name[0]}{emp.prenom[0]}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{emp.prenom} {emp.name}</div>
                                                        <small className="text-muted">Embauché le {new Date(emp.dateEmbauche).toLocaleDateString()}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{emp.post}</div>
                                                <small className="text-muted">{emp.service}</small>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <IconifyIcon icon="ri:phone-line" className="me-1 text-success" />
                                                    {emp.telephone}
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(emp.statut)}</td>
                                            <td className="text-end pe-3">
                                                <Button variant="link" size="sm" className="text-primary p-0 me-2" onClick={() => { setSelectedEmployee(emp); setShowModal(true) }}>
                                                    <IconifyIcon icon="ri:edit-line" fontSize={18} />
                                                </Button>
                                                <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDelete(emp)}>
                                                    <IconifyIcon icon="ri:delete-bin-line" fontSize={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4 text-muted">Auncon employé ne correspond à votre recherche.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <EmployeeModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSave}
                employee={selectedEmployee}
            />
        </div>
    )
}

export default EmployeesPage
