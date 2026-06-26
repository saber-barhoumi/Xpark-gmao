import { APP_ROUTES, PUBLIC_ROUTES } from '@/routes/index'
import { Route, Routes, Navigate, type RouteProps } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import { useLayoutContext } from '@/context/useLayoutContext'
import HorizontalLayout from '@/layouts/HorizontalLayout'
import OtherLayout from '@/layouts/OtherLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { lazy } from 'react'

const Error404 = lazy(() => import('@/app/(other)/errors/error-404/page'))

/**
 * 🗺️ APP ROUTER — XPARK GMAO
 * Définit la structure de routage globale, applique les layouts et les protections.
 */

const AppRouter = (props: RouteProps) => {
  const { orientation } = useLayoutContext()

  return (
    <Routes>
      {/* 🟢 ROUTES PUBLIQUES (Login, Register, Erreurs spécifiques) */}
      {PUBLIC_ROUTES.map((route, idx) => (
        <Route 
            key={idx + route.name} 
            path={route.path} 
            element={<OtherLayout {...props}>{route.element}</OtherLayout>} 
        />
      ))}

      {/* 🔒 ROUTES PROTÉGÉES (Admin, Gestion, Maintenance) */}
      {(APP_ROUTES || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={route.allowedRoles}>
                {orientation == 'vertical' ? (
                <AdminLayout {...props}>{route.element}</AdminLayout>
                ) : (
                <HorizontalLayout {...props}>{route.element}</HorizontalLayout>
                )}
            </ProtectedRoute>
          }
        />
      ))}

      {/* 🔴 CATCH-ALL 404 — XPARK GMAO (Zéro écran vide) */}
      <Route path="*" element={<OtherLayout {...props}><Error404 /></OtherLayout>} />
    </Routes>
  )
}

export default AppRouter
