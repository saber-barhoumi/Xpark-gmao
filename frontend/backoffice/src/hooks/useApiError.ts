import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';

/**
 * 🎣 USE API ERROR — XPARK GMAO
 * Hook pour gérer les erreurs locales (formulaires, tableaux) avec messages FR personnalisés.
 * Affiche automatiquement un popup Swal2 pour les erreurs API.
 */

interface ApiError {
  status:   number;
  message:  string;
  field?:   string; // Pour les erreurs de validation
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof AxiosError) {
      const status  = err.response?.status ?? 0;
      const data    = err.response?.data;

      const message = data?.message
               ?? data?.title
               ?? data?.error
               ?? getDefaultMessage(status);

      setError({ status, message });

      // 🔥 Affichage Swal2 automatique pour toutes les erreurs API
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: message,
        confirmButtonColor: '#dc3545',
      });
    } else {
      const message = 'Une erreur inattendue est survenue.';
      setError({ status: 0, message });
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: message,
        confirmButtonColor: '#dc3545',
      });
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Execute une fonction asynchrone avec gestion d'état error/loading intégrée.
   * Affiche un popup Swal2 en cas d'erreur.
   */
  const execute = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return { error, isLoading, handleError, clearError, execute };
};

/**
 * Messages d'erreurs par défaut en français (XPARK standard)
 */
const getDefaultMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Données invalides. Veuillez vérifier vos informations.',
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Accès refusé. Vous n\'avez pas les droits nécessaires.',
    404: 'Ressource introuvable sur le serveur.',
    408: 'Le serveur met trop de temps à répondre. Réessayez.',
    409: 'Conflit : cette information existe déjà (doublon).',
    422: 'Erreur de validation. Veuillez corriger le formulaire.',
    429: 'Trop de requêtes. Veuillez patienter un instant.',
    500: 'Erreur serveur. Notre équipe technique est notifiée.',
    502: 'Le serveur est temporairement inaccessible.',
    503: 'Service en maintenance. Merci de revenir plus tard.',
  };
  return messages[status] ?? 'Une erreur réseau est survenue.';
};

export default useApiError;
