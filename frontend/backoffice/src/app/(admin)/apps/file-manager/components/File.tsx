import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle, Form, InputGroup, Spinner } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { KIND_META, FOLDER_META, type FileFolder, type FileKind, type ManagedFile } from '@/services/fileService'

interface FileProps {
  files:        ManagedFile[]
  loading:      boolean
  error:        string | null
  totalCount:   number
  search:       string
  onSearch:     (v: string) => void
  kind:         FileKind | 'ALL'
  onKind:       (v: FileKind | 'ALL') => void
  folder:       FileFolder | 'ALL'
  onClearFolder:() => void
  onToggleStar: (id: number) => void
  onDelete:     (id: number) => void
  onRetry:      () => void
  onOpenSidebar:() => void
}

const toDo = (label: string) => () => Swal.fire({ icon: 'info', title: label, text: 'Action à brancher sur le backend documentaire.' })

/** Panneau principal du gestionnaire de fichiers (liste + recherche + actions). */
const File = ({
  files, loading, error, totalCount, search, onSearch, kind, onKind,
  folder, onClearFolder, onToggleStar, onDelete, onRetry, onOpenSidebar,
}: FileProps) => {
  const titre = folder === 'ALL' ? 'Tous les fichiers' : FOLDER_META[folder].label

  return (
    <div className="card w-100">
      {/* En-tête : titre + recherche + filtre type */}
      <div className="p-3 d-flex align-items-center gap-2 flex-wrap">
        <button type="button" onClick={onOpenSidebar} className="btn btn-sm btn-icon btn-light d-xxl-none d-flex p-1">
          <IconifyIcon icon="ri:menu-2-line" className="lh-1 fs-17" />
        </button>
        <div className="me-auto">
          <h4 className="header-title mb-0">{titre}</h4>
          <p className="text-muted fs-13 mb-0">{files.length} fichier(s){folder !== 'ALL' ? ' dans ce dossier' : ''}</p>
        </div>

        {folder !== 'ALL' && (
          <button className="btn btn-sm btn-soft-secondary" onClick={onClearFolder}>
            <IconifyIcon icon="ri:close-line" className="me-1" />Tout voir
          </button>
        )}
        <Form.Select size="sm" style={{ width: 130 }} value={kind} onChange={e => onKind(e.target.value as FileKind | 'ALL')}>
          <option value="ALL">Tous types</option>
          {(Object.keys(KIND_META) as FileKind[]).map(k => <option key={k} value={k}>{KIND_META[k].label}</option>)}
        </Form.Select>
        <InputGroup size="sm" style={{ width: 220 }}>
          <InputGroup.Text className="bg-light"><IconifyIcon icon="ri:search-line" /></InputGroup.Text>
          <Form.Control placeholder="Rechercher un fichier…" value={search} onChange={e => onSearch(e.target.value)} />
        </InputGroup>
      </div>

      {/* Corps : loading / error / empty / liste */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="text-muted mt-2 mb-0">Chargement…</p></div>
      ) : error ? (
        <div className="text-center py-5 text-danger">
          <IconifyIcon icon="ri:error-warning-line" className="fs-48 mb-2 opacity-50" />
          <p className="mb-2">{error}</p>
          <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>Réessayer</button>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <IconifyIcon icon="ri:folder-open-line" className="fs-48 mb-2 opacity-25" />
          <p className="mb-0">{totalCount === 0 ? 'Aucun fichier.' : 'Aucun fichier ne correspond aux filtres.'}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-centered table-nowrap border-top mb-0">
            <thead className="bg-light bg-opacity-25">
              <tr>
                <th className="ps-3 fw-bold fs-12 text-uppercase text-muted">Nom</th>
                <th className="fs-12 fw-bold text-uppercase text-muted">Ajouté par</th>
                <th className="fs-12 fw-bold text-uppercase text-muted">Taille</th>
                <th className="fs-12 fw-bold text-uppercase text-muted">Modifié</th>
                <th className="fs-12 fw-bold text-uppercase text-muted">Partagé</th>
                <th className="fs-12 fw-bold text-uppercase text-muted text-end pe-3" style={{ width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map(item => {
                const meta = KIND_META[item.kind]
                return (
                  <tr key={item.id}>
                    <td className="ps-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className={`flex-shrink-0 avatar-md bg-${meta.variant}-subtle d-inline-flex align-items-center justify-content-center rounded-2`}>
                          <IconifyIcon icon={meta.icon} className={`fs-22 text-${meta.variant}`} />
                        </div>
                        <div>
                          <span className="fw-medium d-flex align-items-center gap-1">
                            {item.title}
                            {item.pinned && <IconifyIcon icon="ri:pushpin-2-fill" className="text-warning fs-14" title="Épinglé" />}
                          </span>
                          <p className="mb-0 fs-12 text-muted">{item.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img src={item.owner.image} className="rounded-circle avatar-md" alt={item.owner.name} />
                        <div>
                          <p className="mb-0 fw-medium">{item.owner.name}</p>
                          <span className="fs-12 text-muted">{item.owner.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{item.sizeMb >= 1024 ? (item.sizeMb / 1024).toFixed(1) + ' Go' : item.sizeMb.toFixed(1) + ' Mo'}</td>
                    <td>{new Date(item.updatedAt).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                    <td>
                      <div className="avatar-group flex-nowrap">
                        {item.members.map((m, idx) => (
                          <div className="avatar avatar-sm" key={idx}>
                            <span className={`avatar-title bg-${m.variant} rounded-circle fw-bold`}>{m.text}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-end pe-3">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button className="btn btn-sm btn-icon btn-link p-0" title={item.starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                onClick={() => onToggleStar(item.id)}>
                          <IconifyIcon icon={item.starred ? 'ri:star-fill' : 'ri:star-line'} className={item.starred ? 'text-warning fs-18' : 'text-muted fs-18'} />
                        </button>
                        <Dropdown className="flex-shrink-0 text-muted">
                          <DropdownToggle as="a" className="drop-arrow-none fs-20 link-reset" role="button">
                            <IconifyIcon icon="ri:more-2-fill" />
                          </DropdownToggle>
                          <DropdownMenu className="dropdown-menu-end">
                            <DropdownItem onClick={toDo('Partager')}><IconifyIcon icon="ri:share-line" className="me-1" /> Partager</DropdownItem>
                            <DropdownItem onClick={toDo('Lien de partage')}><IconifyIcon icon="ri:link" className="me-1" /> Lien de partage</DropdownItem>
                            <DropdownItem onClick={toDo('Téléchargement')}><IconifyIcon icon="ri:download-line" className="me-1" /> Télécharger</DropdownItem>
                            <DropdownItem onClick={() => onToggleStar(item.id)}><IconifyIcon icon="ri:star-line" className="me-1" /> {item.starred ? 'Retirer des favoris' : 'Favori'}</DropdownItem>
                            <DropdownDivider />
                            <DropdownItem className="text-danger" onClick={() => onDelete(item.id)}><IconifyIcon icon="ri:delete-bin-line" className="me-1" /> Supprimer</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default File
