import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import frLocale from '@fullcalendar/core/locales/fr'

import type { EventClickArg, EventInput } from '@fullcalendar/core/index.js'

interface CalendarProps {
  events:       EventInput[]
  onEventClick: (arg: EventClickArg) => void
}

/**
 * Vue calendrier — LECTURE SEULE.
 * Les événements sont des projections d'objets métier (missions, interventions,
 * échéances…) : les déplacer ici ne voudrait rien dire tant que la règle métier
 * correspondante vit dans son module. On clique pour consulter, puis on ouvre
 * le module pour agir.
 */
const Calendar = ({ events, onEventClick }: CalendarProps) => {
  return (
    <div className="mt-4 mt-lg-0">
      <div id="calendar">
        <FullCalendar
          initialView="dayGridMonth"
          plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin, bootstrapPlugin]}
          themeSystem="bootstrap"
          locale={frLocale}
          bootstrapFontAwesome={false}
          handleWindowResize={true}
          slotDuration="00:15:00"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
          }}
          dayMaxEventRows={3}
          editable={false}
          selectable={false}
          droppable={false}
          events={events}
          eventClick={onEventClick}
          noEventsText="Aucun événement sur cette période"
        />
      </div>
    </div>
  )
}

export default Calendar
