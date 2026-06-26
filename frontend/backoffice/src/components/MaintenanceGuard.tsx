import React, { lazy, Suspense } from 'react';

/**
 * 🛠️ MAINTENANCE GUARD — XPARK GMAO
 * Bloque l'accès à toute l'application et redirige vers la page de maintenance
 * si le mode maintenance est activé dans les variables d'environnement.
 */

const MaintenancePage = lazy(() => import('@/app/(other)/maintenance/page'));

interface Props {
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<Props> = ({ children }) => {
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return (
      <Suspense fallback={<div className="vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-primary" role="status"></div></div>}>
        <MaintenancePage />
      </Suspense>
    );
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
