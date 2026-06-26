import api from '@/lib/axiosConfig'
import { EventInput } from '@fullcalendar/core'

export type CalendarEventCategory =
  | 'bg-warning'    // Intervention urgente
  | 'bg-success'    // Intervention terminée
  | 'bg-info'       // Mission / Déplacement
  | 'bg-primary'    // Ordre de travail
  | 'bg-danger'     // Maintenance préventive
  | 'bg-secondary'  // Autre

export type TypeEvenement =
  | 'INTERVENTION'
  | 'ORDRE_TRAVAIL'
  | 'MISSION'
  | 'PREVENTIF'
  | 'AUTRE'

export interface CalendarEvent {
  id:             string
  title:          string
  category:       CalendarEventCategory
  start:          string
  end?:           string
  typeEvenement?: TypeEvenement
  refId?:         number
  description?:   string
}

// Convertir l'événement API → format FullCalendar
const toFullCalendarEvent = (e: CalendarEvent): EventInput => ({
  id:        e.id,
  title:     e.title,
  start:     e.start,
  end:       e.end,
  className: e.category,
  extendedProps: {
    typeEvenement: e.typeEvenement,
    refId:         e.refId,
    description:   e.description,
    category:      e.category,
  },
})

const calendarService = {
  async getEvents(start?: Date, end?: Date): Promise<EventInput[]> {
    const params: any = {}
    if (start) params.start = start.toISOString()
    if (end)   params.end = end.toISOString()

    const res = await api.get<CalendarEvent[]>('/calendar/events', { params })
    return res.data.map(toFullCalendarEvent)
  },

  async createEvent(payload: {
    title:          string
    category:       CalendarEventCategory
    start:          Date
    end?:           Date
    typeEvenement?: TypeEvenement
    description?:   string
  }): Promise<EventInput> {
    const res = await api.post<CalendarEvent>('/calendar/events', payload)
    return toFullCalendarEvent(res.data)
  },

  async updateEvent(id: string, payload: Partial<{
    title:    string
    category: CalendarEventCategory
    start:    Date | string
    end?:     Date | string
  }>): Promise<EventInput> {
    const res = await api.put<CalendarEvent>(`/calendar/events/${id}`, payload)
    return toFullCalendarEvent(res.data)
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/calendar/events/${id}`)
  },
}

export default calendarService
