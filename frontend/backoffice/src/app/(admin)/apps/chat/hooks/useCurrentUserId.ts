import { useMemo } from 'react';

/**
 * Extrait l'userId depuis le JWT stocké en localStorage.
 * Normalise en string minuscule pour les comparaisons.
 */
export const useCurrentUserId = (): string => {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('xpark_token') ?? '';
      if (!token) return '';

      // Décoder le payload JWT (base64)
      const parts = token.split('.');
      if (parts.length < 2) return '';
      
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));

      // Chercher l'userId dans les claims courants
      const id =
        decoded['sub']               ??   // Standard JWT
        decoded['nameid']            ??   // .NET ClaimTypes.NameIdentifier
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
        decoded['userId']            ??
        decoded['id']                ??
        '';

      return String(id).toLowerCase().trim();
    } catch {
      return '';
    }
  }, []);
};
