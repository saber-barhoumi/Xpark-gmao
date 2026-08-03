import React, {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode,
} from 'react'
import { DropResult } from '@hello-pangea/dnd'
import * as signalR from '@microsoft/signalr'
import ConfirmModal from '@/components/ConfirmModal'
import { trace } from '@/helpers/journal'
import kanbanService, {
  KanbanCard, KANBAN_SECTIONS,
} from '@/services/kanbanService'

interface KanbanContextType {
  sections:             any[]
  getCardsForSection:   (sectionId: string) => KanbanCard[]
  onDragEnd:            (result: DropResult) => void
  isLoading:            boolean
  error:                string | null
  addCard:              (sectionId: string) => void
  editCard:             (card: KanbanCard) => void
  deleteCard:           (id: string) => Promise<void>
  clearColumn:          (statut: string) => void
  selectedCard:         KanbanCard | null
  showModal:            boolean
  modalSection:         string | null
  closeModal:           () => void
  saveCard:             (data: Partial<KanbanCard>) => Promise<void>
  totalBySection:       Record<string, number>
  
  // Nouveaux champs pour le filtrage
  searchTerm:           string
  setSearchTerm:        (val: string) => void
  filterTechnician:     string
  setFilterTechnician:  (val: string) => void
  filterPriority:       string
  setFilterPriority:    (val: string) => void
  technicians:          string[]
  technicianList:       any[]
  vehiculeList:         any[]
}

const KanbanContext = createContext<KanbanContextType | null>(null)

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'
const HUB_URL = API_BASE.replace('/api', '') + '/kanbanHub'

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
  const [cards,       setCards]       = useState<KanbanCard[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [modalSection, setModalSection] = useState<string | null>(null)
  const [connection,  setConnection]  = useState<signalR.HubConnection | null>(null)

  // Métadonnées pour les sélecteurs
  const [technicianList, setTechnicianList] = useState<any[]>([])
  const [vehiculeList,   setVehiculeList]   = useState<any[]>([])

  // Confirm modal
  const [clearConfirm, setClearConfirm] = useState<{ show: boolean; statut: string }>({ show: false, statut: '' })

  // États de filtrage
  const [searchTerm,       setSearchTerm]       = useState('')
  const [filterTechnician, setFilterTechnician] = useState('All')
  const [filterPriority,   setFilterPriority]   = useState('All')

  // ── Charger les cartes et métadonnées ────────────────────────
  const loadCards = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [kanbanData, metaData] = await Promise.all([
        kanbanService.getKanban(),
        kanbanService.getKanbanMetadata()
      ])
      
      const allCards = Object.entries(kanbanData).flatMap(([, cards]) => cards)
      setCards(allCards)
      setTechnicianList(metaData.techniciens)
      setVehiculeList(metaData.vehicules)
    } catch (err) {
      setError('Impossible de charger le Kanban.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── SignalR Connection ──────────────────────────────────────
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('xpark_token') || '',
      })
      .withAutomaticReconnect()
      .build()

    setConnection(newConnection)
  }, [])

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          trace('[Kanban] Connexion temps réel établie')
          connection.invoke('JoinKanban')
          
          connection.on('CardMoved', ({ id, statut }) => {
            setCards(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
          })
          
          connection.on('SectionCleared', (statut: string) => {
            setCards(prev => prev.filter(c => c.statut !== statut))
          })
          
          connection.on('CardDeleted', (id) => {
            setCards(prev => prev.filter(c => c.id !== id))
          })
        })
        .catch(err => console.error('SignalR connection error: ', err))
    }
    return () => { connection?.stop() }
  }, [connection])

  useEffect(() => { loadCards() }, [loadCards])

  // ── Liste unique des techniciens pour le filtre ──────────────
  const technicians = React.useMemo(() => {
    const names = cards.map(c => c.technicien).filter(Boolean) as string[]
    return ['All', ...new Set(names)]
  }, [cards])

  // ── Filtrage des cartes ───────────────────────────────────────
  const filteredCards = React.useMemo(() => {
    return cards.filter(card => {
      const matchSearch = searchTerm === '' || 
        card.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.technicien && card.technicien.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchTech = filterTechnician === 'All' || card.technicien === filterTechnician
      const matchPrio = filterPriority === 'All' || card.priorite === filterPriority

      return matchSearch && matchTech && matchPrio
    })
  }, [cards, searchTerm, filterTechnician, filterPriority])

  const getCardsForSection = useCallback(
    (sectionId: string) => filteredCards.filter(c => c.statut === sectionId),
    [filteredCards]
  )

  // ── Drag & Drop ──────────────────────────────────────────────
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId &&
        source.index === destination.index) return

    const newStatut = destination.droppableId

    setCards(prev => prev.map(c =>
      c.id === draggableId ? { ...c, statut: newStatut } : c
    ))

    try {
      await kanbanService.updateStatut(draggableId, newStatut)
    } catch (err) {
      setCards(prev => prev.map(c =>
        c.id === draggableId ? { ...c, statut: source.droppableId } : c
      ))
      setError('Erreur lors du déplacement.')
    }
  }, [])

  const addCard = useCallback((sectionId: string) => {
    setSelectedCard(null)
    setModalSection(sectionId)
    setShowModal(true)
  }, [])

  const editCard = useCallback((card: KanbanCard) => {
    setSelectedCard(card)
    setModalSection(card.statut)
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setSelectedCard(null)
    setModalSection(null)
  }, [])

  const saveCard = useCallback(async (data: Partial<KanbanCard>) => {
    try {
      if (selectedCard) {
        setCards(prev => prev.map(c =>
          c.id === selectedCard.id ? { ...c, ...data } : c
        ))
      } else {
        await kanbanService.createCard({
          description:  data.description,
          priorite:     data.priorite || 'NORMALE',
          statut:       modalSection || 'PLANIFIE',
          dateFin:      data.dateEcheance ? new Date(data.dateEcheance) : undefined,
          vehiculeId:   data.vehiculeId ? parseInt(data.vehiculeId as any) : 1, // Fallback if needed
          technicienId: data.technicienId ? parseInt(data.technicienId as any) : undefined
        })
        loadCards()
      }
      closeModal()
    } catch (err) {
      setError('Erreur lors de l\'enregistrement.')
    }
  }, [selectedCard, modalSection, closeModal, loadCards])

  const deleteCard = useCallback(async (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id))
    try {
      await kanbanService.deleteCard(id)
    } catch (err) {
      setError('Erreur lors de la suppression.')
      loadCards()
    }
  }, [loadCards])

  const clearColumn = useCallback((statut: string) => {
    setClearConfirm({ show: true, statut })
  }, [])

  const confirmClearColumn = useCallback(async (statut: string) => {
    setClearConfirm({ show: false, statut: '' })
    try {
      await kanbanService.clearSection(statut)
      setCards(prev => prev.filter(c => c.statut !== statut))
    } catch (err) {
      setError('Erreur lors du nettoyage de la colonne.')
    }
  }, [])

  // ── Totaux par colonne (basés sur les cartes filtrées) ───────
  const totalBySection = React.useMemo(() => {
    return KANBAN_SECTIONS.reduce((acc, section) => ({
      ...acc,
      [section.id]: filteredCards.filter(c => c.statut === section.id).length,
    }), {} as Record<string, number>)
  }, [filteredCards])

  return (
    <KanbanContext.Provider value={{
      sections: KANBAN_SECTIONS,
      getCardsForSection,
      onDragEnd,
      isLoading, error,
      addCard, editCard, deleteCard,
      clearColumn,
      selectedCard, showModal, modalSection,
      closeModal, saveCard,
      totalBySection,
      searchTerm, setSearchTerm,
      filterTechnician, setFilterTechnician,
      filterPriority, setFilterPriority,
      technicians,
      technicianList,
      vehiculeList
    }}>
      {children}
      <ConfirmModal
        show={clearConfirm.show}
        title="Vider la colonne"
        message={`Voulez-vous vraiment vider la colonne "${clearConfirm.statut}" ? Toutes les tâches seront supprimées.`}
        confirmLabel="Vider"
        variant="warning"
        onConfirm={() => confirmClearColumn(clearConfirm.statut)}
        onCancel={() => setClearConfirm({ show: false, statut: '' })}
      />
    </KanbanContext.Provider>
  )
}

export const useKanbanContext = () => {
  const ctx = useContext(KanbanContext)
  if (!ctx) throw new Error('useKanbanContext must be used inside KanbanProvider')
  return ctx
}
