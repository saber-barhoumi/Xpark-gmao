import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Row, Col, Card, Badge, Spinner, Tabs, Tab, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import equipmentService from '@/services/equipmentService'
import { EquipementDetail } from '@/types/equipment'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import dayjs from 'dayjs'
import { QRCodeCanvas } from 'qrcode.react'

// Import tab components
import HistoriqueMouvementsTab from './components/HistoriqueMouvementsTab'
import InspectionsTechniquesTab from './components/InspectionsTechniquesTab'
import NotesContratsTab from './components/NotesContratsTab'

const ETAT_COLORS: Record<string, string> = {
    Neuf: 'success',
    Bon: 'primary',
    Use: 'warning',
    ARemplacer: 'danger',
    HorsService: 'secondary',
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

export default function EquipementsDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [equipment, setEquipment] = useState<EquipementDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            loadDetail()
        }
    }, [id])

    const loadDetail = async () => {
        setLoading(true)
        try {
            const data = await equipmentService.getById(Number(id))
            setEquipment(data)
        } catch (err) {
            console.error('Failed to load equipment details')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
    if (!equipment) return <div className="text-center py-5">Équipement non trouvé</div>

    return (
        <>
            <PageBreadcrumb title={`Détails: ${equipment.nom}`} />

            {equipment.dateEstimationRemplacement && dayjs(equipment.dateEstimationRemplacement).isBefore(dayjs().add(3, 'month')) && (
                <Alert variant="warning" className="border-0 shadow-sm mb-4 d-flex align-items-center">
                    <IconifyIcon icon="ri:alarm-warning-line" className="fs-24 me-2 text-warning" />
                    <div>
                        <strong>Maintenance Prédictive :</strong> Cet équipement devra probablement être remplacé vers le 
                        <strong> {dayjs(equipment.dateEstimationRemplacement).format('MMMM YYYY')}</strong> (basé sur son rythme d'utilisation actuel).
                    </div>
                </Alert>
            )}

            <Row>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-4 overflow-hidden">
                        {equipment.imageUrl ? (
                            <div className="text-center bg-light p-0" style={{ height: '200px' }}>
                                <img 
                                    src={equipment.imageUrl.startsWith('http') ? equipment.imageUrl : `${API_URL.replace('/api', '')}${equipment.imageUrl}`} 
                                    alt={equipment.nom} 
                                    className="img-fluid h-100 w-100 object-fit-cover" 
                                />
                            </div>
                        ) : (
                            <div className="text-center bg-soft-primary p-4">
                                <IconifyIcon icon="ri:tools-line" className="fs-64 text-primary opacity-25" />
                            </div>
                        )}
                        <Card.Body className="text-center">
                            <h4 className="mb-1">{equipment.nom}</h4>
                            <p className="text-muted small">{equipment.codeInventaire}</p>
                            <Badge bg={ETAT_COLORS[equipment.etat]} className="rounded-pill px-3">
                                {equipment.etat}
                            </Badge>

                            <hr className="my-4" />

                            <div className="text-start mb-4">
                                <h6 className="text-uppercase fs-11 text-muted mb-3 fw-bold">Identification</h6>
                                <p className="text-muted mb-2 fs-13"><strong>Type:</strong> <span className="float-end">{equipment.type}</span></p>
                                <p className="text-muted mb-2 fs-13"><strong>Catégorie:</strong> <span className="float-end">{equipment.categorie}</span></p>
                                <p className="text-muted mb-2 fs-13"><strong>Marque:</strong> <span className="float-end">{equipment.marque || '-'}</span></p>
                                <p className="text-muted mb-2 fs-13"><strong>Modèle:</strong> <span className="float-end">{equipment.modele || '-'}</span></p>
                                <p className="text-muted mb-2 fs-13"><strong>S/N:</strong> <span className="float-end">{equipment.numeroSerie || '-'}</span></p>
                            </div>

                            <div className="mt-4 p-3 bg-light rounded text-center">
                                <h6 className="text-uppercase fs-11 text-muted mb-2">Accès Mobile (QR Code)</h6>
                                <div className="bg-white p-2 d-inline-block rounded shadow-sm">
                                    <QRCodeCanvas value={window.location.href} size={110} />
                                </div>
                                <p className="text-muted small mt-2 mb-0">Scannez pour un accès direct mobile</p>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Santé & Usage</h5>
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-grow-1">
                                    <h6 className="my-0">Utilisations</h6>
                                    <small className="text-muted">Total missions</small>
                                </div>
                                <div className="flex-shrink-0">
                                    <h5 className="text-primary">{equipment.nombreUtilisations}</h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-0">
                                <div className="flex-grow-1">
                                    <h6 className="my-0">État Calculé</h6>
                                    <small className="text-muted">Basé sur l'usure</small>
                                </div>
                                <div className="flex-shrink-0">
                                    <Badge bg={equipment.seuilRemplacementUtilisations && (equipment.nombreUtilisations / equipment.seuilRemplacementUtilisations) > 0.8 ? 'danger' : 'success'}>
                                        {equipment.seuilRemplacementUtilisations ? Math.max(0, (1 - (equipment.nombreUtilisations / equipment.seuilRemplacementUtilisations)) * 100).toFixed(0) : 100}%
                                    </Badge>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <Tabs defaultActiveKey="history" id="equipment-detail-tabs" className="nav-bordered mb-3">
                                <Tab eventKey="history" title="Historique">
                                    <HistoriqueMouvementsTab 
                                        mouvements={equipment.mouvements} 
                                        onRefresh={loadDetail}
                                    />
                                </Tab>
                                <Tab eventKey="inspections" title="Inspections">
                                    <InspectionsTechniquesTab 
                                        equipementId={equipment.id}
                                        inspections={equipment.inspections} 
                                        onRefresh={loadDetail}
                                    />
                                </Tab>
                                <Tab eventKey="notes" title="Notes & Contrats">
                                    <NotesContratsTab 
                                        equipementId={equipment.id}
                                        notesGenerales={equipment.notesGenerales}
                                        notes={equipment.notes}
                                        contrats={equipment.contrats}
                                        onRefresh={loadDetail}
                                    />
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    )
}
