import { useParams, useSearchParams } from 'react-router-dom'
import { Col, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useEffect, useState } from 'react'
import viewDetailsService, { OrdreDetail } from '@/services/viewDetailsService'
import Dashboard from './components/Dashboard'
import Attachments from './components/Attachments'
import Commentaires from './components/Commentaires'

const ViewDetailsPage = () => {
  // L'ID peut venir de l'URL : /tasks/view-details?id=42
  const [searchParams] = useSearchParams()
  const idStr = searchParams.get('id')
  const id = Number(idStr)

  const [ordre,     setOrdre]     = useState<OrdreDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!idStr) { setError('ID manquant'); setIsLoading(false); return }
    if (isNaN(id)) { setError('ID invalide'); setIsLoading(false); return }

    viewDetailsService.getDetail(id)
      .then(setOrdre)
      .catch(() => setError('Ordre de travail introuvable.'))
      .finally(() => setIsLoading(false))
  }, [id, idStr])

  const handleAddCommentaire = async (contenu: string) => {
    if (!ordre) return
    try {
      const nouveau = await viewDetailsService.addCommentaire(ordre.id, contenu)
      setOrdre(prev => prev ? {
        ...prev,
        commentaires: [nouveau, ...prev.commentaires],
      } : prev)
    } catch (err) {
      console.error('Erreur ajout commentaire', err)
    }
  }

  const handleUpload = async (file: File) => {
    if (!ordre) return
    try {
      const attachment = await viewDetailsService.uploadAttachment(ordre.id, file)
      setOrdre(prev => prev ? {
        ...prev,
        attachments: [...prev.attachments, attachment],
      } : prev)
    } catch (err) {
      console.error('Erreur upload', err)
    }
  }

  if (isLoading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2 text-muted">Chargement de l'ordre de travail...</p>
    </div>
  )

  if (error || !ordre) return (
    <div className="alert alert-danger m-4">{error || 'Introuvable'}</div>
  )

  return (
    <>
      <PageBreadcrumb title={`Détails # ${ordre.titre}`} subName="Tâches" />
      <Row>
        <Col xl={8}>
          <Dashboard ordre={ordre} />
          <Commentaires
            commentaires={ordre.commentaires}
            onAdd={handleAddCommentaire}
          />
        </Col>
        <Col xl={4}>
          <Attachments
            attachments={ordre.attachments}
            onUpload={handleUpload}
          />
        </Col>
      </Row>
    </>
  )
}

export default ViewDetailsPage