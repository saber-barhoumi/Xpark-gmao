import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '@/services/authService';

/**
 * 🔒 PROTECTED ROUTE — XPARK GMAO
 * Gère l'authentification et le contrôle d'accès par rôle (RBAC). 
 * Redirige vers /auth/login si non connecté ou /errors/error-403 si rôle insuffisant.
 */

interface Props {
  children:      React.ReactNode;
  allowedRoles?: string[]; // Si vide, toute personne connectée peut accéder
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  // 1. NON AUTHENTIFIÉ → Redirection Connexion
  if (!isAuthenticated) {
    // Sauvegarder l'url souhaitée pour y revenir après authentification
    sessionStorage.setItem('redirectUrl', location.pathname + location.search);
    return <Navigate to="/auth/login" replace />;
  }

  // 2. RÔLE INSUFFISANT → Page 403 (Accès Refusé)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toUpperCase();
    const isAuthorized = allowedRoles.some(role => role.toUpperCase() === userRole);

    if (!isAuthorized) {
      console.warn(`[ProtectedRoute] Accès refusé pour le rôle ${userRole}. Rôles autorisés : ${allowedRoles}`);
      return <Navigate to="/errors/error-403" replace />;
    }
  }

  // 3. TOUT EST OK → Afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute;
