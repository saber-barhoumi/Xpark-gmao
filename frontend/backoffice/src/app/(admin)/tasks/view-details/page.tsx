import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Badge, Card, CardBody, Col, Row, Spinner } from 'react-bootstrap'
import { useCallback, useEffect, useState } from 'react'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import viewDetailsService, { OrdreDetail } from '@/services/viewDetailsService'
import ordreTravailService, { OrdreTravail } from '@/services/ordreTravailService'
import Dashboard from './components/Dashboard'
import Attachments from './components/Attachments'
import Commentaires from './components/Commentaires'

/**
 * Détail d'un ordre de travail — /tasks/view-details?id=42
 *
 * Le lien du menu ne porte pas d'`id` : plutôt que d'afficher « ID manquant »
 * (comportement précédent, qui rendait l'entrée de menu inutilisable), on
 * propose alors la liste des ordres de travail à ouvrir.
 */
const ViewDetailsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const idStr = searchParams.get('id')
  const id = Number(idStr)

  const [ordre,     setOrdre]     = useState<OrdreDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState('')

  // Mode « sélecteur » quand aucun id n'est fourni
  const [liste,        setListe]        = useState<OrdreTravail[]>([])
  const [listeLoading, setListeLoading] = useState(false)

  const charger = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setOrdre(await viewDetailsService.getDetail(id))
    } catch {
      setError(`Ordre de travail #${id} introuvable.`)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!idStr) {
      // Pas d'id → on charge la liste pour laisser l'utilisateur choisir
      setIsLoading(false)
      setListeLoading(true)
      ordreTravailService.getAll({ pageSize: 100 })
        .then(res => setListe(res?.items ?? []))
        .catch(() => setError('Impossible de charger les ordres de travail.'))
        .finally(() => setListeLoading(false))
      return
    }
    if (Number.isNaN(id)) { setError('Identifiant invalide.'); setIsLoading(false); return }
    charger()
  }, [id, idStr, charger])

  const handleAddCommentaire = async (contenu: string) => {
    if (!ordre) return
    const nouveau = await viewDetailsService.addCommentaire(ordre.id, contenu)
    setOrdre(prev => prev ? { ...prev, commentaires: [nouveau, ...prev.commentaires] } : prev)
  }

  const handleUpload = async (file: File) => {
    if (!ordre) return
    const attachment = await viewDetailsService.uploadAttachment(ordre.id, file)
    setOrdre(prev => prev ? { ...prev, attachments: [...prev.attachments, attachment] } : prev)
  }

  // ── Mode sélecteur ────────────────────────────────────────────────────────
  if (!idStr) return (
    <>
      <PageBreadcrumb title="Vue détaillée" subName="Tâches" />
      <Card>
        <CardBody>
          <h5 className="mb-1">Choisir un ordre de travail</h5>
          <p className="text-muted">
            Sélectionnez l’ordre de travail dont vous voulez consulter le détail,
            ou ouvrez-en un depuis le <a href="/tasks/kanban">tableau Kanban</a>.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          {listeLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : liste.length === 0 ? (
            <p className="text-muted mb-0">Aucun ordre de travail enregistré.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Référence</th><th>Description</th>
                    <th>Statut</th><th>Priorité</th><th />
                  </tr>
                </thead>
                <tbody>
                  {liste.map(ot => (
                    <tr key={ot.idOrdreTravail}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/tasks/view-details?id=${ot.idOrdreTravail}`)}>
                      <td className="fw-semibold">{ot.reference}</td>
                      <td className="text-muted">{ot.description}</td>
                      <td><Badge bg="light" text="dark">{ot.statut}</Badge></td>
                      <td><Badge bg="light" text="dark">{ot.priorite}</Badge></td>
                      <td className="text-end">
                        <IconifyIcon icon="tabler:chevron-right" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )

  // ── Mode détail ───────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2 text-muted">Chargement de l’ordre de travail…</p>
    </div>
  )

  if (error || !ordre) return (
    <>
      <PageBreadcrumb title="Vue détaillée" subName="Tâches" />
      <Alert variant="danger" className="d-flex align-items-center justify-content-between">
        <span>{error || 'Introuvable'}</span>
        <a className="btn btn-sm btn-light" href="/tasks/view-details">
          Voir la liste des ordres de travail
        </a>
      </Alert>
    </>
  )

  return (
    <>
      <PageBreadcrumb title={`Détails — ${ordre.titre}`} subName="Tâches" />
      <Row>
        <Col xl={8}>
          <Dashboard ordre={ordre} />
          <Commentaires commentaires={ordre.commentaires} onAdd={handleAddCommentaire} />
        </Col>
        <Col xl={4}>
          <Attachments attachments={ordre.attachments} onUpload={handleUpload} />
        </Col>
      </Row>
    </>
  )
}

export default ViewDetailsPage
