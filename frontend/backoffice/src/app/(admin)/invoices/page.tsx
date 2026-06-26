
import { Col, Row } from 'react-bootstrap'
import InvoicesCard from './components/InvoicesCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'

const InvoicesPage = () => {
  return (
    <>
      <PageBreadcrumb title='View Invoices' />
      <Row>
        <Col xs={12}>
          <InvoicesCard />
        </Col>
      </Row>
    </>

  )
}

export default InvoicesPage