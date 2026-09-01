import FallbackLoading from '@/components/FallbackLoading'
import Footer from '@/components/layout/Footer'
// import HorizontalNavBar from '@/components/layout/HorizontalNav/page'
import { getHorizontalMenuItems } from '@/helpers/Manu'
import { ChildrenType } from '@/types/component-props'
import { lazy, Suspense } from 'react'
import authService from '@/services/authService'


const HorizontalNavBar = lazy(() => import('@/components/layout/HorizontalNav/page'))
const TopBar = lazy(() => import('@/components/layout/TopBar/index'))

const HorizontalLayout = ({ children }: ChildrenType) => {
  const menuItems = getHorizontalMenuItems(authService.getCurrentUser()?.role)
  return (
    <>
      <div className="wrapper">
        <Suspense fallback={<FallbackLoading />}>
          <TopBar  />
        </Suspense>

        <Suspense fallback={<FallbackLoading />}>
          <HorizontalNavBar menuItems={menuItems} />
        </Suspense>

        <div className="page-content">
          <div className="page-container">{children}</div>
          <Footer />
        </div>
      </div>
    </>
  )
}

export default HorizontalLayout
