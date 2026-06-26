import {
  DateInput, EventClickArg, EventDropArg, EventInput,
} from '@fullcalendar/core'
import { DateClickArg, Draggable, type DropArg } from '@fullcalendar/interaction'
import { useEffect, useState, useCallback } from 'react'
import calendarService, { CalendarEventCategory } from '@/services/calendarService'

export type SubmitEventType = {
  title:          string
  category:       CalendarEventCategory
  description?:   string
  typeEvenement?: string
  isExternal?:    boolean // Pour savoir si on ajoute à la sidebar
}

const useCalendar = () => {
  const [show,         setShow]           = useState(false)
  const [isEditable,   setIsEditable]     = useState(false)
  const [isLoading,    setIsLoading]      = useState(true)
  const [events,       setEvents]         = useState<EventInput[]>([])
  const [eventData,    setEventData]      = useState<EventInput>()
  const [dateInfo,     setDateInfo]       = useState<DateClickArg>()
  const [error,        setError]          = useState<string | null>(null)
  
  // Bug 1: State pour les tâches dans la sidebar
  const [externalEvents, setExternalEvents] = useState([
    { id: '1', variant: 'success', title: 'New Event Planning' },
    { id: '2', variant: 'info',    title: 'Meeting' },
    { id: '3', variant: 'warning', title: 'Generating Reports' },
    { id: '4', variant: 'danger',  title: 'Create New theme' },
  ])

  // ── Charger les événements depuis l'API ───────────────────────
  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await calendarService.getEvents()
      setEvents(data)
    } catch (err) {
      setError('Impossible de charger le calendrier.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Initialisation du Draggable (important pour les nouveaux éléments ajoutés à la sidebar)
  useEffect(() => {
    const draggableEl = document.getElementById('external-events')
    let draggable: Draggable | null = null
    if (draggableEl) {
      draggable = new Draggable(draggableEl, { 
        itemSelector: '.external-event',
        eventData: (el) => ({
          title:     el.getAttribute('title'),
          className: el.getAttribute('data-class'),
        })
      })
    }
    return () => draggable?.destroy()
  }, [externalEvents]) // Se ré-exécute si on ajoute un externalEvent

  const onOpenModal  = () => setShow(true)
  const onCloseModal = () => {
    setEventData(undefined)
    setDateInfo(undefined)
    setShow(false)
  }

  const onDateClick = (arg: DateClickArg) => {
    setDateInfo(arg)
    setIsEditable(false)
    onOpenModal()
  }

  const onEventClick = (arg: EventClickArg) => {
    setEventData({
      id:        String(arg.event.id),
      title:     arg.event.title,
      className: arg.event.classNames[0],
      extendedProps: arg.event.extendedProps,
    })
    setIsEditable(true)
    onOpenModal()
  }

  // ── Créer un événement → API ou Sidebar ──────────────────────
  const onAddEvent = useCallback(async (data: SubmitEventType) => {
    if (data.isExternal) {
      // Bug 1: Ajout à la sidebar
      const newExt = {
        id:      Math.random().toString(),
        title:   data.title,
        variant: data.category.replace('bg-', ''),
      }
      setExternalEvents(prev => [...prev, newExt])
      onCloseModal()
      return
    }

    try {
      const newEvent = await calendarService.createEvent({
        title:          data.title,
        category:       data.category,
        start:          dateInfo?.date ?? new Date(),
        typeEvenement:  data.typeEvenement as any,
        description:    data.description,
      })
      setEvents(prev => [...prev, newEvent])
      onCloseModal()
    } catch (err) {
      setError('Erreur lors de la création de l\'événement.')
    }
  }, [dateInfo])

  // ── Modifier un événement ────────────────────────────────────
  const onUpdateEvent = useCallback(async (data: SubmitEventType) => {
    if (!eventData?.id) return
    try {
      const updated = await calendarService.updateEvent(String(eventData.id), {
        title:    data.title,
        category: data.category,
      })
      setEvents(prev =>
        prev.map(e => String(e.id) === String(eventData.id) ? updated : e)
      )
      onCloseModal()
      setIsEditable(false)
    } catch (err) {
      setError('Erreur lors de la modification.')
    }
  }, [eventData])

  // ── Supprimer un événement ───────────────────────────────────
  const onRemoveEvent = useCallback(async () => {
    if (!eventData?.id) return
    try {
      await calendarService.deleteEvent(String(eventData.id))
      setEvents(prev => prev.filter(e => String(e.id) !== String(eventData.id)))
      onCloseModal()
    } catch (err) {
      setError('Erreur lors de la suppression.')
    }
  }, [eventData])

  // ── Persister le drag & drop interne au calendrier ─────────────
  const onEventDrop = useCallback(async (arg: EventDropArg) => {
    try {
      await calendarService.updateEvent(arg.event.id, {
        start: arg.event.start?.toISOString() || new Date().toISOString(),
        end:   arg.event.end?.toISOString(),
      })
      setEvents(prev =>
        prev.map(e => {
          if (String(e.id) === arg.event.id) {
            return {
              ...e,
              start:     arg.event.start as DateInput,
              end:       arg.event.end as DateInput,
              className: arg.event.classNames,
            }
          }
          return e
        })
      )
    } catch (err) {
      arg.revert()
      setError('Erreur lors du déplacement.')
    }
  }, [])

  // ── Drag & Drop depuis la sidebar → Bug 3 ──────────────────────
  const onDrop = useCallback(async (arg: any) => {
    const title = arg.draggedEl?.getAttribute('title') || arg.event?.title
    const category = arg.draggedEl?.getAttribute('data-class') || arg.event?.classNames?.[0]
    
    // Si c'est un event effectif (eventReceive)
    if (arg.event) {
        arg.event.remove() // On supprime l'event local de FullCalendar pour éviter le doublon (Bug 3)
    }

    try {
      const newEvent = await calendarService.createEvent({
        title,
        category:  category || 'bg-primary' as CalendarEventCategory,
        start:     new Date(arg.dateStr || arg.event.startStr),
      })
      setEvents(prev => [...prev, newEvent])
    } catch (err) {
      setError('Erreur lors du dépôt de l\'événement.')
    }
  }, [])

  const createNewEvent = () => {
    setIsEditable(false)
    onOpenModal()
  }

  return {
    show, isLoading, error,
    events, externalEvents, eventData, dateInfo, isEditable,
    createNewEvent,
    onDateClick, onEventClick,
    onDrop, onEventDrop,
    onCloseModal,
    onAddEvent, onUpdateEvent, onRemoveEvent,
  }
}

export default useCalendar
