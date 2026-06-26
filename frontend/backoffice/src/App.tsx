import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import AppRouter from './routes/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MaintenanceGuard } from '@/components/MaintenanceGuard'

import '@/assets/scss/app.scss'
import '@/assets/scss/icons.scss'

/**
 * 🚀 APPLICATION ROOT — XPARK GMAO
 * Enveloppe l'application avec les guards de sécurité et de maintenance.
 */

function App() {
  return (
    <ErrorBoundary>
      <MaintenanceGuard>
        <AppProvidersWrapper>
          <AppRouter />
        </AppProvidersWrapper>
      </MaintenanceGuard>
    </ErrorBoundary>
  )
}

export default App
