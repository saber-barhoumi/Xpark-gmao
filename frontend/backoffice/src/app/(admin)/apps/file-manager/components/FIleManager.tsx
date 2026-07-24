import { useEffect, useMemo, useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import useToggle from '@/hooks/useToggle'
import Swal from 'sweetalert2'
import fileService, { ManagedFile, FileFolder, FileKind } from '@/services/fileService'
import File from './File'
import OffcanvasCard from './OffcanvasCard'

/**
 * Orchestrateur du gestionnaire de fichiers : charge les données, tient l'état
 * partagé (dossier actif, recherche, type, tri) et le distribue à la barre
 * latérale (dossiers + stockage) et au panneau principal (liste).
 */
const FIleManager = () => {
  const { isTrue, toggle } = useToggle()

  const [files,   setFiles]   = useState<ManagedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [folder, setFolder] = useState<FileFolder | 'ALL'>('ALL')
  const [kind,   setKind]   = useState<FileKind | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      setFiles(await fileService.getAll())
    } catch {
      setError('Impossible de charger les fichiers.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const folders = useMemo(() => fileService.computeFolders(files), [files])
  const storage = useMemo(() => fileService.computeStorage(files), [files])

  const filtered = useMemo(() => {
    let list = [...files]
    if (folder !== 'ALL') list = list.filter(f => f.folder === folder)
    if (kind !== 'ALL')   list = list.filter(f => f.kind === kind)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(f => f.title.toLowerCase().includes(q) || f.owner.name.toLowerCase().includes(q))
    }
    // épinglés d'abord, puis les plus récents
    return list.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.updatedAt.localeCompare(a.updatedAt))
  }, [files, folder, kind, search])

  const toggleStar = (id: number) =>
    setFiles(prev => prev.map(f => f.id === id ? { ...f, starred: !f.starred } : f))

  const remove = async (id: number) => {
    const r = await Swal.fire({ title: 'Supprimer ce fichier ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Supprimer', confirmButtonColor: '#d33' })
    if (r.isConfirmed) setFiles(prev => prev.filter(f => f.id !== id))
  }

  const sidebar = (inOffcanvas: boolean) => (
    <OffcanvasCard
      folders={folders} storage={storage} activeFolder={folder}
      onSelectFolder={(f) => { setFolder(f); if (inOffcanvas) toggle() }}
      toggle={inOffcanvas ? toggle : undefined}
    />
  )

  return (
    <div className="d-flex gap-2">
      <div className="d-none d-xxl-block" style={{ minWidth: 280 }}>
        {sidebar(false)}
      </div>

      <File
        files={filtered} loading={loading} error={error}
        totalCount={files.length}
        search={search} onSearch={setSearch}
        kind={kind} onKind={setKind}
        folder={folder} onClearFolder={() => setFolder('ALL')}
        onToggleStar={toggleStar} onDelete={remove} onRetry={load}
        onOpenSidebar={toggle}
      />

      <Offcanvas show={isTrue} onHide={toggle} className="offcanvas-start file-manager" tabIndex={-1}>
        {sidebar(true)}
      </Offcanvas>
    </div>
  )
}

export default FIleManager
