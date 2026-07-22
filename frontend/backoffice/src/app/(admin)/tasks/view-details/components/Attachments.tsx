import FileUpload from '@/components/FileUpload'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { Attachment } from '@/services/viewDetailsService'
import { getFileExtensionIcon } from '@/utils/get-icons'

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

interface AttachmentsProps {
  attachments: Attachment[]
  onUpload:    (file: File) => void
  /** Absent = suppression non proposée. */
  onDelete?:   (id: number) => Promise<void>
}

const Attachments = ({ attachments, onUpload, onDelete }: AttachmentsProps) => {
  return (
    <Card>
      {/* Le menu déroulant d'origine (Edit / Mark as Duplicate / Delete) venait
          du template : aucun de ses éléments n'avait de gestionnaire, ils ne
          faisaient donc rien. Retiré au profit d'une action réelle par fichier. */}
      <CardHeader className="border-bottom border-dashed">
        <h5 className="header-title mb-0">Pièces jointes ({attachments.length})</h5>
      </CardHeader>
      <CardBody>
        {attachments.length > 0 && (
          <div className="mb-3">
            {attachments.map((file) => (
              <div key={file.id} className="border rounded mb-2 p-2 d-flex align-items-center">
                <div className="avatar-sm bg-light rounded d-flex align-items-center justify-content-center me-2">
                  <IconifyIcon icon={getFileExtensionIcon(file.nom)} className="fs-24 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h5 className="fs-14 mb-0 text-truncate">
                    <a href={`${API_URL}${file.url}`} target="_blank" rel="noopener noreferrer" className="text-dark">
                      {file.nom}
                    </a>
                  </h5>
                  <small className="text-muted">{(file.taille / 1024).toFixed(1)} KB</small>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger p-0 ms-2 flex-shrink-0"
                    title="Supprimer cette pièce jointe"
                    onClick={() => onDelete(file.id)}>
                    <IconifyIcon icon="tabler:trash" className="fs-18" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <FileUpload
          title="Ajouter un fichier"
          onFileUpload={(files) => {
            if (files && files.length > 0) {
              onUpload(files[0] as File);
            }
          }}
        />
      </CardBody>
    </Card>
  )
}

export default Attachments
