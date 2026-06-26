import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import BrandsListingCard from './components/BrandsListingCard'
import OrdersChart from './components/OrdersChart'
import SellingProductsCard from './components/SellingProductsCard'
import Stat from './components/Stat'
import Statistics from './components/Statistics'
import TotalRevenue from './components/TotalRevenue'
import UserCard from './components/UserCard'
import { SectionErrorBoundary } from '@/components/ErrorBoundary'

const DashboardPage = () => {
  return (
    <>
      <PageBreadcrumb title='Dashboard' />
      
      <SectionErrorBoundary sectionName="Statistiques Rapides">
        <Stat />
      </SectionErrorBoundary>

      <Row>
        <Col xxl={4} xl={6}>
          <SectionErrorBoundary sectionName="Graphique des Commandes">
            <OrdersChart />
          </SectionErrorBoundary>
        </Col>
        <Col xxl={4} xl={6}>
          <SectionErrorBoundary sectionName="Statistiques d'Usage">
            <Statistics />
          </SectionErrorBoundary>
        </Col>
        <Col xxl={4} xl={12}>
          <SectionErrorBoundary sectionName="Revenu Total">
            <TotalRevenue />
          </SectionErrorBoundary>
        </Col>
      </Row>

      <SectionErrorBoundary sectionName="Gestion Utilisateurs">
        <UserCard />
      </SectionErrorBoundary>

      <Row>
        <Col xxl={6}>
          <SectionErrorBoundary sectionName="Liste des Marques">
            <BrandsListingCard />
          </SectionErrorBoundary>
        </Col>
        <Col xxl={6}>
          <SectionErrorBoundary sectionName="Produits les Plus Vendus">
            <SellingProductsCard />
          </SectionErrorBoundary>
        </Col>
      </Row>
    </>
  )
}

export default DashboardPage