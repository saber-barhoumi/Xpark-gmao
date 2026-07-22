import { EventClickArg, EventInput } from '@fullcalendar/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import calendarService, {
  CalendarEventType, TYPE_LABELS, XparkEventProps,
} from '@/services/calendarService'

/** Filtres demandés : type, véhicule, chauffeur, client, plage de dates. */
export interface CalendarFilters {
  types:      CalendarEventType[]   // vide = tous
  vehiculeId: number | null
  employeeId: number | null
  clientId:   number | null
  dateFrom:   string                // 'YYYY-MM-DD', '' = pas de borne
  dateTo:     string
}

const FILTRES_VIDES: CalendarFilters = {
  types: [], vehiculeId: null, employeeId: null, clientId: null,
  dateFrom: '', dateTo: '',
}

/** Option de liste déroulante déduite des événements réellement chargés. */
export interface FilterOption { id: number; label: string }

const props = (e: EventInput) => e.extendedProps as XparkEventProps

const useCalendar = () => {
  const [allEvents,     setAllEvents]     = useState<EventInput[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [failedSources, setFailedSources] = useState<string[]>([])
  const [filters,       setFilters]       = useState<CalendarFilters>(FILTRES_VIDES)
  const [selected,      setSelected]      = useState<EventInput | null>(null)

  // ── Chargement depuis les microservices ────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { events, failedSources } = await calendarService.getEvents()
      setAllEvents(events)
      setFailedSources(failedSources)
    } catch {
      setError('Impossible de charger le calendrier.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  // ── Options de filtres déduites des données chargées ───────────────────────
  // Avantage : on ne propose que des valeurs qui existent vraiment dans le
  // calendrier, et cela n'ajoute aucun appel réseau supplémentaire.
  const buildOptions = (
    idOf: (p: XparkEventProps) => number | undefined,
    labelOf: (p: XparkEventProps) => string | undefined,
  ): FilterOption[] => {
    const map = new Map<number, string>()
    allEvents.forEach(e => {
      const p = props(e)
      const id = idOf(p)
      if (id != null && !map.has(id)) map.set(id, labelOf(p) || `#${id}`)
    })
    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  const vehiculeOptions = useMemo(
    () => buildOptions(p => p.vehiculeId, p => p.immatriculation), [allEvents])
  const employeeOptions = useMemo(
    () => buildOptions(p => p.employeeId, p => p.chauffeurNom), [allEvents])
  const clientOptions = useMemo(
    () => buildOptions(p => p.clientId, p => p.clientNom), [allEvents])

  /** Types réellement présents, pour n'afficher que des filtres utiles. */
  const typeOptions = useMemo(() => {
    const compte = new Map<CalendarEventType, number>()
    allEvents.forEach(e => {
      const t = props(e).type
      compte.set(t, (compte.get(t) ?? 0) + 1)
    })
    return [...compte.entries()]
      .map(([type, count]) => ({ type, count, label: TYPE_LABELS[type] }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allEvents])

  // ── Application des filtres ────────────────────────────────────────────────
  const events = useMemo(() => allEvents.filter(e => {
    const p = props(e)
    if (filters.types.length && !filters.types.includes(p.type))   return false
    if (filters.vehiculeId != null && p.vehiculeId !== filters.vehiculeId) return false
    if (filters.employeeId != null && p.employeeId !== filters.employeeId) return false
    if (filters.clientId   != null && p.clientId   !== filters.clientId)   return false

    if (filters.dateFrom || filters.dateTo) {
      const jour = String(e.start).slice(0, 10)          // ISO → 'YYYY-MM-DD'
      if (filters.dateFrom && jour < filters.dateFrom) return false
      if (filters.dateTo   && jour > filters.dateTo)   return false
    }
    return true
  }), [allEvents, filters])

  // ── Actions de filtrage ───────────────────────────────────────────────────
  const toggleType = useCallback((type: CalendarEventType) => {
    setFilters(f => ({
      ...f,
      types: f.types.includes(type)
        ? f.types.filter(t => t !== type)
        : [...f.types, type],
    }))
  }, [])

  const setFilter = useCallback(
    <K extends keyof CalendarFilters>(cle: K, valeur: CalendarFilters[K]) => {
      setFilters(f => ({ ...f, [cle]: valeur }))
    }, [])

  const resetFilters = useCallback(() => setFilters(FILTRES_VIDES), [])

  const isFiltered = useMemo(
    () => filters.types.length > 0 || filters.vehiculeId != null ||
          filters.employeeId != null || filters.clientId != null ||
          !!filters.dateFrom || !!filters.dateTo,
    [filters])

  // ── Détail d'un événement ─────────────────────────────────────────────────
  const onEventClick = useCallback((arg: EventClickArg) => {
    setSelected({
      id:            arg.event.id,
      title:         arg.event.title,
      start:         arg.event.startStr,
      end:           arg.event.endStr,
      allDay:        arg.event.allDay,
      className:     arg.event.classNames[0],
      extendedProps: arg.event.extendedProps,
    })
  }, [])

  const closeDetails = useCallback(() => setSelected(null), [])

  return {
    events, allEvents, isLoading, error, failedSources,
    filters, setFilter, toggleType, resetFilters, isFiltered,
    typeOptions, vehiculeOptions, employeeOptions, clientOptions,
    selected, onEventClick, closeDetails,
    reload: loadEvents,
  }
}

export default useCalendar
