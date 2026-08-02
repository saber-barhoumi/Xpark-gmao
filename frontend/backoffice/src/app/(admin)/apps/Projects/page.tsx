import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardBody, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import projectService, { Project, ProjectStatus } from '@/services/projectService'
import Head, { type SortKey } from './components/Head'
import Projects from './components/Projects'
import ProjectStats from './components/ProjectStats'
import ProjectDetails from './components/ProjectDetails'

const PAGE_SIZE = 6

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const [search,  setSearch]  = useState('')
  const [statut,  setStatut]  = useState<ProjectStatus | 'ALL'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [page,    setPage]    = useState(1)
  const [selected, setSelected] = useState<Project | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      setProjects(await projectService.getAll())
    } catch {
      setError('Impossible de charger les projets.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => projectService.computeStats(projects), [projects])

  const filtered = useMemo(() => {
    let list = [...projects]
    if (statut !== 'ALL') list = list.filter(p => p.status === statut)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.lead.toLowerCase().includes(q))
    }
    switch (sortKey) {
      case 'progress': list.sort((a, b) => b.progress - a.progress); break
      case 'name':     list.sort((a, b) => a.title.localeCompare(b.title)); break
      // « À traiter » : ce qui reste à faire en volume, puis l'avancement le
      // plus faible — l'ordre le plus utile pour un exploitant.
      case 'restant':  list.sort((a, b) => (b.tasksTotal - b.tasksDone) - (a.tasksTotal - a.tasksDone)); break
      default:         list.sort((a, b) => a.progress - b.progress)
    }
    return list
  }, [projects, statut, search, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current    = Math.min(page, totalPages)
  const pageItems  = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [statut, search, sortKey])

  return (
    <>
      <PageBreadcrumb title="Projets" subName="Applications" />

      <ProjectStats stats={stats} />

      <Head
        search={search} statut={statut} sortKey={sortKey}
        onSearch={setSearch} onStatut={setStatut} onSort={setSortKey}
      />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2 mb-0">Chargement des projets…</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <span><IconifyIcon icon="tabler:alert-circle" className="me-2" />{error}</span>
          <Button size="sm" variant="outline-danger" onClick={load}>Réessayer</Button>
        </Alert>
      ) : filtered.length === 0 ? (
        <Card><CardBody className="text-center text-muted py-5">
          <IconifyIcon icon="tabler:folder-off" className="fs-48 mb-2 opacity-25" />
          <p className="mb-1">Aucun projet ne correspond à votre recherche.</p>
          <Button variant="link" size="sm" onClick={() => { setSearch(''); setStatut('ALL') }}>Réinitialiser les filtres</Button>
        </CardBody></Card>
      ) : (
        <>
          <Projects projects={pageItems} onView={setSelected} />

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <p className="fs-14 m-0 text-muted">
              {filtered.length} projet(s) — page {current} / {totalPages}
            </p>
            {totalPages > 1 && (
              <ul className="pagination pagination-boxed mb-0">
                <li className={`page-item ${current === 1 ? 'disabled' : ''}`}>
                  <a role="button" className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <IconifyIcon icon="tabler:chevron-left" />
                  </a>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <li key={n} className={`page-item ${n === current ? 'active' : ''}`}>
                    <a role="button" className="page-link" onClick={() => setPage(n)}>{n}</a>
                  </li>
                ))}
                <li className={`page-item ${current === totalPages ? 'disabled' : ''}`}>
                  <a role="button" className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    <IconifyIcon icon="tabler:chevron-right" />
                  </a>
                </li>
              </ul>
            )}
          </div>
        </>
      )}

      <ProjectDetails project={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default ProjectsPage
