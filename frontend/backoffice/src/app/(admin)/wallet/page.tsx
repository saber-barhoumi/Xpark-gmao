import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Count from './components/Count'
import Profile from './components/Profile'
import Progress from './components/Progress'
import Reminders from './components/Reminders'
import State from './components/State'
import State2 from './components/State2'
import State3 from './components/State3'
import Team from './components/Team'

const WalletPage = () => {
  return (
    <>
      <PageBreadcrumb title='Wallet' />
      <State />
      <State2 />
      <State3 />
      <Count />
      <Row>
        <Col xl={3} md={6}>
          <Team />
        </Col>
        <Col xl={3} md={6}>
          <Profile />
        </Col>
        <Col xl={3} md={6}>
          <Progress />
        </Col>
        <Col xl={3} md={6}>
          <Reminders />
        </Col>
      </Row>
    </>

  )
}

export default WalletPage