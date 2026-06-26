// OCRUploadZone.tsx — Zone drag & drop + analyse Gemini AI
import React, { useRef, useState, useCallback } from 'react'
import { Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import groqOCRService, {
  DocumentType,
  ExtractedOCRData,
} from '@/services/groqOCRService'

interface UploadedDoc {
  file: File
  type: DocumentType
  preview: string
  status: 'pending' | 'analyzing' | 'done' | 'error'
  error?: string
}

interface OCRUploadZoneProps {
  onExtracted: (data: ExtractedOCRData) => void
  onLoading: (loading: boolean) => void
  title?: string
  subtitle?: string
  defaultType?: DocumentType
}

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CARTE_GRISE',      label: 'Carte Grise' },
  { value: 'ASSURANCE',        label: 'Assurance' },
  { value: 'VIGNETTE',         label: 'Vignette' },
  { value: 'VISITE_TECHNIQUE', label: 'Visite Technique' },
  { value: 'PERMIS_CONDUIRE',  label: 'Permis de Conduire' },
  { value: 'TICKET_CARBURANT', label: 'Ticket / Reçu Carburant' },
]

const OCRUploadZone: React.FC<OCRUploadZoneProps> = ({
  onExtracted,
  onLoading,
  title = 'Scan automatique des documents',
  subtitle = 'Uploadez la carte grise, assurance, vignette ou visite technique',
  defaultType = 'AUTO',
}) => {
  const [docs, setDocs]             = useState<UploadedDoc[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [successMsg, setSuccessMsg]   = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Ajouter un fichier ──────────────────────────────────────
  const addFile = useCallback((file: File) => {
    const preview = URL.createObjectURL(file)
    setDocs(prev => [...prev, { file, type: defaultType, preview, status: 'pending' }])
  }, [defaultType])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(f => addFile(f))
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    Array.from(e.dataTransfer.files).forEach(f => addFile(f))
  }

  const removeDoc = (idx: number) => {
    setDocs(prev => {
      const doc = prev[idx]
      if (doc?.preview) URL.revokeObjectURL(doc.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const updateDocType = (idx: number, type: DocumentType) => {
    setDocs(prev => prev.map((d, i) => (i === idx ? { ...d, type } : d)))
  }

  // ── Analyser tous les documents ─────────────────────────────
  const analyzeAll = async () => {
    if (docs.length === 0) return
    setIsAnalyzing(true)
    setGlobalError('')
    setSuccessMsg('')
    onLoading(true)

    const merged: ExtractedOCRData = {}
    let hasSuccess = false

    for (let i = 0; i < docs.length; i++) {
      // Marquer "analyzing"
      setDocs(prev =>
        prev.map((d, idx) => (idx === i ? { ...d, status: 'analyzing' } : d))
      )

      try {
        const data = await groqOCRService.extractFromDocument(
          docs[i].file,
          docs[i].type
        )

        // Fusionner (les valeurs non-null écrasent)
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            ;(merged as Record<string, unknown>)[key] = value
          }
        })

        setDocs(prev =>
          prev.map((d, idx) => (idx === i ? { ...d, status: 'done' } : d))
        )
        hasSuccess = true
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Erreur inconnue'
        setDocs(prev =>
          prev.map((d, idx) =>
            idx === i ? { ...d, status: 'error', error: message } : d
          )
        )
      }
    }

    if (hasSuccess) {
      onExtracted(merged)
      const fieldCount = Object.values(merged).filter(
        v => v !== null && v !== undefined
      ).length
      setSuccessMsg(
        `✅ ${fieldCount} champs extraits automatiquement !`
      )
    } else {
      setGlobalError(
        "Aucun document n'a pu être lu. Vérifiez la qualité des images."
      )
    }

    setIsAnalyzing(false)
    onLoading(false)
  }

  return (
    <div className="mb-4">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          className="rounded d-flex align-items-center justify-content-center"
          style={{
            width: 36,
            height: 36,
            background: 'rgba(59,130,246,.12)',
            flexShrink: 0,
          }}
        >
          <IconifyIcon
            icon="tabler:scan"
            className="text-primary"
            style={{ fontSize: 20 }}
          />
        </div>
        <div>
          <h6 className="mb-0 fw-semibold" style={{ fontSize: 14 }}>
            {title}
          </h6>
          <p className="mb-0 text-muted" style={{ fontSize: 12 }}>
            {subtitle}
          </p>
        </div>
        <span
          className="badge ms-auto"
          style={{
            fontSize: 11,
            background: 'rgba(59,130,246,.12)',
            color: '#3b82f6',
          }}
        >
          Powered by Groq LLaMA 3
        </span>
      </div>

      {/* ── Zone de drop ───────────────────────────────────── */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border rounded p-4 text-center mb-3 ${
          isDragging ? 'border-primary' : ''
        }`}
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          cursor: 'pointer',
          transition: 'all .2s',
          background: isDragging
            ? 'rgba(59,130,246,.06)'
            : 'var(--bs-light, #f8f9fa)',
        }}
      >
        <IconifyIcon
          icon="tabler:cloud-upload"
          className={isDragging ? 'text-primary' : 'text-muted'}
          style={{ fontSize: 36 }}
        />
        <p className="mb-1 fw-semibold" style={{ fontSize: 14 }}>
          {isDragging
            ? 'Déposez ici...'
            : 'Glissez vos documents ou cliquez pour sélectionner'}
        </p>
        <p className="text-muted mb-0" style={{ fontSize: 12 }}>
          JPG, PNG, WebP, PDF — max 20 Mo par fichier
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileInput}
        />
      </div>

      {/* ── Liste des documents uploadés ────────────────────── */}
      {docs.length > 0 && (
        <div className="mb-3">
          {docs.map((doc, idx) => (
            <div
              key={idx}
              className="d-flex align-items-center gap-3 p-2 mb-2 rounded border bg-white"
            >
              {/* Miniature */}
              <img
                src={doc.preview}
                alt=""
                className="rounded"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />

              {/* Sélecteur type + nom */}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <p
                  className="mb-1 fw-semibold text-truncate"
                  style={{ fontSize: 13 }}
                >
                  {doc.file.name}
                </p>
                <select
                  className="form-select form-select-sm"
                  value={doc.type}
                  onChange={e =>
                    updateDocType(idx, e.target.value as DocumentType)
                  }
                  disabled={doc.status === 'analyzing'}
                  style={{ width: 'auto', display: 'inline-block' }}
                >
                  <option value="AUTO">🤖 Auto-détection</option>
                  {DOC_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div style={{ flexShrink: 0 }}>
                {doc.status === 'pending' && (
                  <span className="badge bg-secondary bg-opacity-25 text-secondary">
                    En attente
                  </span>
                )}
                {doc.status === 'analyzing' && (
                  <span className="badge bg-primary bg-opacity-25 text-primary d-flex align-items-center gap-1">
                    <Spinner animation="border" size="sm" /> Analyse...
                  </span>
                )}
                {doc.status === 'done' && (
                  <span className="badge bg-success bg-opacity-25 text-success">
                    <IconifyIcon icon="tabler:check" className="me-1" />
                    Extrait
                  </span>
                )}
                {doc.status === 'error' && (
                  <span
                    className="badge bg-danger bg-opacity-25 text-danger"
                    title={doc.error}
                  >
                    <IconifyIcon icon="tabler:x" className="me-1" />
                    Erreur
                  </span>
                )}
              </div>

              {/* Supprimer */}
              <button
                type="button"
                className="btn btn-sm btn-soft-danger p-1"
                onClick={e => {
                  e.stopPropagation()
                  removeDoc(idx)
                }}
                disabled={doc.status === 'analyzing'}
              >
                <IconifyIcon icon="tabler:trash" style={{ fontSize: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Bouton analyser ─────────────────────────────────── */}
      {docs.length > 0 && (
        <button
          type="button"
          className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={analyzeAll}
          disabled={isAnalyzing || docs.every(d => d.status === 'done')}
        >
          {isAnalyzing ? (
            <>
              <Spinner animation="border" size="sm" />
              Analyse en cours avec Groq...
            </>
          ) : (
            <>
              <IconifyIcon icon="tabler:wand" style={{ fontSize: 18 }} />
              Analyser et remplir automatiquement ({docs.length} document
              {docs.length > 1 ? 's' : ''})
            </>
          )}
        </button>
      )}

      {/* ── Messages feedback ──────────────────────────────── */}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mt-3 mb-0 py-2">
          <IconifyIcon icon="tabler:sparkles" style={{ fontSize: 18 }} />
          {successMsg}
        </div>
      )}
      {globalError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0 py-2">
          <IconifyIcon icon="tabler:alert-circle" style={{ fontSize: 18 }} />
          {globalError}
        </div>
      )}
    </div>
  )
}

export default OCRUploadZone
