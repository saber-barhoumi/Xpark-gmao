import { CalendarEventCategory } from '@/services/calendarService'

// Légende des couleurs pour la sidebar du calendrier
export const calendarCategories: {
  label:    string
  value:    CalendarEventCategory
  icon:     string
  description: string
}[] = [
  {
    label:       'Intervention urgente',
    value:       'bg-warning',
    icon:        'tabler:alert-triangle',
    description: 'Interventions prioritaires',
  },
  {
    label:       'Intervention terminée',
    value:       'bg-success',
    icon:        'tabler:circle-check',
    description: 'Clôturées avec succès',
  },
  {
    label:       'Mission / Déplacement',
    value:       'bg-info',
    icon:        'tabler:car',
    description: 'Missions terrain',
  },
  {
    label:       'Ordre de travail',
    value:       'bg-primary',
    icon:        'tabler:clipboard-list',
    description: 'OTs planifiés',
  },
  {
    label:       'Maintenance préventive',
    value:       'bg-danger',
    icon:        'tabler:tool',
    description: 'Maintenances planifiées',
  },
]

// Événements externes "drag & drop" vers le calendrier
export const externalDragEvents = [
  { title: 'Nouvelle intervention',   className: 'bg-warning', icon: 'tabler:alert-triangle' },
  { title: 'Maintenance préventive',  className: 'bg-danger',  icon: 'tabler:tool' },
  { title: 'Mission terrain',         className: 'bg-info',    icon: 'tabler:car' },
  { title: 'Ordre de travail',        className: 'bg-primary', icon: 'tabler:clipboard-list' },
]
