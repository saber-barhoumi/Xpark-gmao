import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { ProgressBar } from 'react-bootstrap'
import Swal from 'sweetalert2'
import type { FileFolder, StorageInfo } from '@/services/fileService'

interface FolderItem { key: FileFolder; label: string; icon: string; count: number }

interface OffcanvasCardProps {
  folders:        FolderItem[]
  storage:        StorageInfo
  activeFolder:   FileFolder | 'ALL'
  onSelectFolder: (f: FileFolder | 'ALL') => void
  toggle?:        () => void
}

/** Barre latérale : dossiers (comptage dynamique) + jauge de stockage. */
const OffcanvasCard = ({ folders, storage, activeFolder, onSelectFolder, toggle }: OffcanvasCardProps) => {
  const totalFiles = folders.reduce((s, f) => s + f.count, 0)
  const pct = storage.totalGb ? Math.min(100, Math.round((storage.usedGb / storage.totalGb) * 100)) : 0

  return (
    <div className="card d-flex flex-column w-100">
      <div className="p-3">
        <div className="d-flex justify-content-between gap-2 align-items-center mb-3">
          <button type="button" className="btn fw-medium btn-danger w-100"
                  onClick={() => Swal.fire({ icon: 'info', title: 'Nouvel envoi', text: 'À brancher sur l\'upload documentaire.' })}>
            Nouvel envoi <IconifyIcon icon="ri:upload-2-line" className="ms-1" />
          </button>
          {toggle && (
            <button type="button" onClick={toggle} className="btn btn-soft-danger ms-auto d-xxl-none">
              <IconifyIcon icon="ri:close-line" />
            </button>
          )}
        </div>

        <div className="file-menu list-group">
          <a role="button" onClick={() => onSelectFolder('ALL')}
             className={`list-group-item rounded d-flex justify-content-between align-items-center ${activeFolder === 'ALL' ? 'active' : ''}`}>
            <span><IconifyIcon icon="ri:folders-line" className="fs-18 align-middle me-2" />Tous les fichiers</span>
            <span className="badge bg-light text-dark">{totalFiles}</span>
          </a>
          {folders.map(f => (
            <a role="button" key={f.key} onClick={() => onSelectFolder(f.key)}
               className={`list-group-item rounded d-flex justify-content-between align-items-center ${activeFolder === f.key ? 'active' : ''}`}>
              <span><IconifyIcon icon={f.icon} className="fs-18 align-middle me-2" />{f.label}</span>
              <span className="badge bg-light text-dark">{f.count}</span>
            </a>
          ))}
        </div>

        {/* Stockage */}
        <div className="mt-4 border rounded p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0 fs-14"><IconifyIcon icon="ri:database-2-line" className="me-1" />Stockage</h5>
            <span className="text-muted fs-12">{pct}%</span>
          </div>
          <ProgressBar now={pct} variant={pct > 85 ? 'danger' : pct > 60 ? 'warning' : 'success'} className="progress-sm mb-2" />
          <p className="text-muted fs-13 mb-3">
            <strong>{storage.usedGb} Go</strong> utilisés sur {storage.totalGb} Go
          </p>
          <div className="d-flex flex-column gap-1">
            {storage.byKind.slice(0, 4).map(k => (
              <div key={k.kind} className="d-flex justify-content-between fs-12 text-muted">
                <span className="text-capitalize">{k.kind}</span>
                <span>{k.sizeMb >= 1024 ? (k.sizeMb / 1024).toFixed(1) + ' Go' : k.sizeMb.toFixed(1) + ' Mo'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OffcanvasCard
