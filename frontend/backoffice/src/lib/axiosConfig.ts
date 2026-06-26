import axios from 'axios';

/**
 * 🚀 AXIOS CONFIGURATION GLOBALE — XPARK GMAO
 * Centralise tous les appels API et gère les erreurs de session / serveur.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes
  headers: { 'Content-Type': 'application/json' },
});

// ─── INTERCEPTEUR REQUÊTE : Injection du Token JWT + Trailing Slash ──────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('xpark_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure trailing slash so nginx doesn't issue a 301 (which converts POST→GET)
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?') && !/\.[a-zA-Z]{2,5}$/.test(config.url)) {
      config.url = config.url + '/';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── INTERCEPTEUR RÉPONSE : Mapping Erreurs → Pages Dédiées ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Cas spécial : Pas de réponse du serveur (Réseau coupé ou Serveur Down)
    if (!error.response) {
      const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
      if (isMaintenance) {
        window.location.href = '/maintenance';
      } else {
        window.location.href = '/errors/service-unavailable';
      }
      return Promise.reject(error);
    }

    const { status, config, data } = error.response;

    // 2. Gestion des erreurs par Code HTTP
    const ERROR_MAPPING: Record<number, string> = {
      400: '/errors/error-400',
      401: '/auth/login',         // Redirigé dynamiquement ci-dessous
      403: '/errors/error-403',
      404: '/errors/error-404',
      500: '/errors/error-500',
      502: '/errors/service-unavailable',
      503: '/errors/service-unavailable',
    };

    // --- CAS CRITIQUE : 401 Session Expirée ---
    if (status === 401) {
      // Sauvegarder l'URL actuelle pour y revenir après le login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/auth/login')) {
        sessionStorage.setItem('redirectUrl', currentPath);
      }

      localStorage.removeItem('xpark_token');
      localStorage.removeItem('xpark_user');

      // NE rediriger que si nous ne sommes pas déjà sur la page de login
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }

      return Promise.reject(error);
    }

    // --- CAS GÉNÉRAUX : Redirection vers pages d'erreurs dédiées ---
    const route = ERROR_MAPPING[status];
    if (route) {
      // Stocker le log technique en session pour le débogage (finition parfaite XPARK)
      sessionStorage.setItem('lastError', JSON.stringify({
        status,
        message: data?.message || error.message,
        url: config?.url || '',
        timestamp: new Date().toISOString(),
      }));

      // Ne rediriger vers les pages d'erreurs globales QUE pour les erreurs fatales (500, 502, 503)
      // Les erreurs 400, 404, 409 sont souvent gérées localement par useApiError.
      if (status >= 500) {
        window.location.href = route;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Export des méthodes raccourcies
export const { get, post, put, patch, delete: del } = api;
