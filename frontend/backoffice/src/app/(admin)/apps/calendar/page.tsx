
import { Row } from 'react-bootstrap'
import CalendarPage from './components/CalendarPage'

import PageBreadcrumb from '@/components/PageBreadcrumb'


const Schedule = () => {
  return (
    <>
    <PageBreadcrumb title='Calender' />
      <Row>
        <CalendarPage />
      </Row>
    </>
  )
}

export default Schedule
