import IconifyIcon from '@/components/wrappers/IconifyIcon'
import React, { useState } from 'react'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { Commentaire } from '@/services/viewDetailsService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

interface CommentairesProps {
  commentaires: Commentaire[]
  onAdd: (contenu: string) => Promise<void>
}

const Commentaires = ({ commentaires, onAdd }: CommentairesProps) => {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    
    setSubmitting(true)
    try {
      await onAdd(newComment)
      setNewComment('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title">Commentaires ({commentaires.length})</h4>
      </CardHeader>
      <CardBody>
        <div className="comment-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {commentaires.length === 0 && (
            <p className="text-muted text-center my-3">Aucun commentaire pour le moment.</p>
          )}
          {commentaires.map((c) => (
            <div key={c.id} className="d-flex mb-3 border-bottom pb-2 border-dashed">
              <div className="avatar-sm bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0">
                {c.auteur.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h5 className="mt-0 fs-14">
                  {c.auteur}
                  <small className="text-muted fw-normal float-end">
                    {dayjs(c.createdAt).fromNow()}
                  </small>
                </h5>
                <p className="mb-0 text-muted fs-13">{c.contenu}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border rounded mt-4">
          <form onSubmit={handleSubmit} className="comment-area-box">
            <textarea
              rows={3}
              className="form-control border-0 resize-none"
              placeholder="Votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
            <div className="p-2 bg-light d-flex justify-content-end align-items-center">
              <button 
                type="submit" 
                className="btn btn-sm btn-success"
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <IconifyIcon icon='tabler:loader' className="ti-spin me-1" />
                ) : (
                  <IconifyIcon icon='tabler:send' className="me-1" />
                )}
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </CardBody>
    </Card>
  )
}

export default Commentaires
