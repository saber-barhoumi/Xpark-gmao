import avatar1 from '@/assets/images/users/avatar-1.jpg'
import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * fileService — couche de données du gestionnaire de fichiers XPARK
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * /apps/file-manager était statique : lignes codées en dur, menu de dossiers
 * mort, aucune notion de stockage, actions sans effet. On introduit ici un
 * modèle typé (fichiers, dossiers, stockage) alimenté par un mock, prêt à
 * brancher un backend documentaire (les documents véhicule existent déjà côté
 * Fleet : /documents, /assurances). Point de bascule : le corps de `getAll()`.
 */

export type FileKind = 'pdf' | 'image' | 'excel' | 'word' | 'zip' | 'text'

/** Icône + couleur du design system par type de fichier. */
export const KIND_META: Record<FileKind, { icon: string; variant: string; label: string }> = {
  pdf:   { icon: 'ri:file-pdf-line',   variant: 'danger',    label: 'PDF'     },
  image: { icon: 'ri:image-line',      variant: 'primary',   label: 'Image'   },
  excel: { icon: 'ri:file-excel-line', variant: 'success',   label: 'Excel'   },
  word:  { icon: 'ri:file-word-line',  variant: 'info',      label: 'Word'    },
  zip:   { icon: 'ri:file-zip-line',   variant: 'warning',   label: 'Archive' },
  text:  { icon: 'ri:file-text-line',  variant: 'secondary', label: 'Texte'   },
}

export type FileFolder = 'documents' | 'factures' | 'photos' | 'rapports' | 'archives'

export const FOLDER_META: Record<FileFolder, { label: string; icon: string }> = {
  documents: { label: 'Documents véhicule', icon: 'ri:folder-2-line' },
  factures:  { label: 'Factures',           icon: 'ri:bill-line' },
  photos:    { label: 'Photos flotte',      icon: 'ri:image-2-line' },
  rapports:  { label: 'Rapports',           icon: 'ri:bar-chart-box-line' },
  archives:  { label: 'Archives',           icon: 'ri:archive-line' },
}

export interface FileOwner { name: string; email: string; image: string }
export interface FileMember { text: string; variant: string }

export interface ManagedFile {
  id:        number
  title:     string
  subtitle:  string          // ex. « 5 pages », « 172 photos »
  kind:      FileKind
  folder:    FileFolder
  sizeMb:    number
  updatedAt: string          // ISO
  owner:     FileOwner
  members:   FileMember[]
  starred:   boolean
  pinned:    boolean
}

export interface StorageInfo {
  usedGb:    number
  totalGb:   number
  byKind:    { kind: FileKind; sizeMb: number }[]
}

// ── Mock ─────────────────────────────────────────────────────────────────────
const O = {
  amir:  { name: 'Amir Trabelsi',     email: 'amir@xpark.tn',  image: avatar1 },
  leila: { name: 'Leila Ben Youssef', email: 'leila@xpark.tn', image: avatar2 },
  karim: { name: 'Karim Gharbi',      email: 'karim@xpark.tn', image: avatar3 },
  sonia: { name: 'Sonia Mabrouk',     email: 'sonia@xpark.tn', image: avatar4 },
  hedi:  { name: 'Hedi Nasri',        email: 'hedi@xpark.tn',  image: avatar5 },
}
const M = (t: string, v: string): FileMember => ({ text: t, variant: v })

const MOCK_FILES: ManagedFile[] = [
  { id: 1,  title: 'Carte grise — 123 TUN 2020.pdf', subtitle: '2 pages',   kind: 'pdf',   folder: 'documents', sizeMb: 1.2,   updatedAt: '2026-07-18', owner: O.amir,  members: [M('A', 'success'), M('K', 'primary')], starred: true,  pinned: true },
  { id: 2,  title: 'Assurance flotte 2026.pdf',       subtitle: '14 pages',  kind: 'pdf',   folder: 'documents', sizeMb: 3.4,   updatedAt: '2026-07-12', owner: O.leila, members: [M('L', 'danger')], starred: false, pinned: false },
  { id: 3,  title: 'Factures juillet.xlsx',           subtitle: '32 lignes', kind: 'excel', folder: 'factures',  sizeMb: 0.8,   updatedAt: '2026-07-20', owner: O.sonia, members: [M('S', 'info'), M('C', 'warning')], starred: true,  pinned: false },
  { id: 4,  title: 'FAC-202607-0006.pdf',             subtitle: '1 page',    kind: 'pdf',   folder: 'factures',  sizeMb: 0.3,   updatedAt: '2026-07-21', owner: O.sonia, members: [M('S', 'info')], starred: false, pinned: false },
  { id: 5,  title: 'Photos état des lieux.zip',       subtitle: '54 photos', kind: 'zip',   folder: 'photos',    sizeMb: 128.5, updatedAt: '2026-07-05', owner: O.hedi,  members: [M('H', 'secondary'), M('A', 'primary')], starred: false, pinned: false },
  { id: 6,  title: 'Camion-321-avant.jpg',            subtitle: 'Image',     kind: 'image', folder: 'photos',    sizeMb: 4.1,   updatedAt: '2026-07-15', owner: O.hedi,  members: [M('H', 'secondary')], starred: true,  pinned: false },
  { id: 7,  title: 'Rapport consommation Q2.xlsx',    subtitle: '20 feuilles', kind: 'excel', folder: 'rapports', sizeMb: 2.6, updatedAt: '2026-07-08', owner: O.karim, members: [M('K', 'primary'), M('L', 'danger')], starred: false, pinned: false },
  { id: 8,  title: 'Maintenance prédictive.pdf',      subtitle: '12 pages',  kind: 'pdf',   folder: 'rapports',  sizeMb: 5.2,   updatedAt: '2026-07-19', owner: O.leila, members: [M('L', 'danger'), M('W', 'success')], starred: true,  pinned: false },
  { id: 9,  title: 'Contrat prestataire.docx',        subtitle: '8 pages',   kind: 'word',  folder: 'documents', sizeMb: 0.6,   updatedAt: '2026-06-28', owner: O.amir,  members: [M('A', 'success')], starred: false, pinned: false },
  { id: 10, title: 'Sauvegarde 2025.zip',             subtitle: 'Archive',   kind: 'zip',   folder: 'archives',  sizeMb: 512.0, updatedAt: '2026-01-04', owner: O.karim, members: [M('K', 'primary')], starred: false, pinned: false },
  { id: 11, title: 'Procédures internes.txt',         subtitle: '1 page',    kind: 'text',  folder: 'archives',  sizeMb: 0.1,   updatedAt: '2026-05-30', owner: O.hedi,  members: [M('H', 'secondary')], starred: false, pinned: false },
  { id: 12, title: 'Visite technique — 456.pdf',      subtitle: '3 pages',   kind: 'pdf',   folder: 'documents', sizeMb: 1.0,   updatedAt: '2026-07-01', owner: O.leila, members: [M('L', 'danger')], starred: false, pinned: false },
]

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

const fileService = {
  /** Remplacer par un appel au backend documentaire le moment venu. */
  async getAll(): Promise<ManagedFile[]> {
    await wait(500)
    return structuredClone(MOCK_FILES)
  },

  /** Dossiers avec comptage dérivé de la liste. */
  computeFolders(files: ManagedFile[]): { key: FileFolder; label: string; icon: string; count: number }[] {
    return (Object.keys(FOLDER_META) as FileFolder[]).map(key => ({
      key,
      label: FOLDER_META[key].label,
      icon:  FOLDER_META[key].icon,
      count: files.filter(f => f.folder === key).length,
    }))
  },

  /** Stockage : total fixe (250 Go), utilisé = somme des tailles. */
  computeStorage(files: ManagedFile[]): StorageInfo {
    const byKindMap = new Map<FileKind, number>()
    files.forEach(f => byKindMap.set(f.kind, (byKindMap.get(f.kind) ?? 0) + f.sizeMb))
    const usedMb = files.reduce((s, f) => s + f.sizeMb, 0)
    return {
      usedGb:  +(usedMb / 1024).toFixed(2),
      totalGb: 250,
      byKind:  [...byKindMap.entries()].map(([kind, sizeMb]) => ({ kind, sizeMb })).sort((a, b) => b.sizeMb - a.sizeMb),
    }
  },
}

export default fileService
