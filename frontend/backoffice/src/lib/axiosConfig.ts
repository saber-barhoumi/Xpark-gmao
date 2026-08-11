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

// ─── RENOUVELLEMENT DU JETON : UNE SEULE TENTATIVE À LA FOIS ────────────────
//
// POURQUOI CE VERROU EST NÉCESSAIRE
// Le jeton d'accès vaut soixante minutes. Passé ce délai, une page qui charge
// plusieurs blocs déclenche plusieurs requêtes qui échouent EN MÊME TEMPS.
// Sans verrou, chacune lançait son propre renouvellement.
//
// Or le serveur remplace le jeton de renouvellement à chaque usage
// (AuthService.RefreshTokenAsync : `user.RefreshToken = GenerateRefreshToken()`).
// Le premier appel réussit et invalide l'ancien ; les suivants présentent ce
// jeton devenu caduc, échouent, et leur gestion d'erreur vidait le stockage
// local puis renvoyait vers la page de connexion — alors que la session
// venait précisément d'être renouvelée avec succès.
//
// D'où ce mécanisme : le premier échec lance le renouvellement, les autres
// attendent la même promesse et rejouent leur requête avec le jeton obtenu.
let renouvellementEnCours: Promise<string> | null = null;

const renouvelerJeton = (): Promise<string> => {
  if (renouvellementEnCours) return renouvellementEnCours;

  const refreshToken = localStorage.getItem('xpark_refresh_token');
  if (!refreshToken) return Promise.reject(new Error('Aucun jeton de renouvellement'));

  renouvellementEnCours = axios
    .post(`${API_URL}/auth/refresh-token/`, { refreshToken })
    .then((res) => {
      const auth = res.data?.data ?? res.data;
      if (!auth?.token) throw new Error('Réponse de renouvellement inexploitable');
      localStorage.setItem('xpark_token', auth.token);
      if (auth.refreshToken) localStorage.setItem('xpark_refresh_token', auth.refreshToken);
      return auth.token as string;
    })
    .finally(() => {
      // Libéré dans tous les cas : sans cela, un échec passager
      // interdirait définitivement toute nouvelle tentative.
      renouvellementEnCours = null;
    });

  return renouvellementEnCours;
};

const terminerSession = () => {
  localStorage.removeItem('xpark_token');
  localStorage.removeItem('xpark_refresh_token');
  localStorage.removeItem('xpark_user');
  if (!window.location.pathname.includes('/auth/login')) {
    sessionStorage.setItem('redirectUrl', window.location.pathname);
    window.location.href = '/auth/login';
  }
};

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
      const refreshToken = localStorage.getItem('xpark_refresh_token');
      const isAuthCall = (config?.url ?? '').includes('/auth/');

      // Une seule reprise par requête : sans ce drapeau, un jeton renouvelé
      // mais toujours refusé ferait boucler la requête indéfiniment.
      if (refreshToken && !isAuthCall && !config._retriedRefresh) {
        return renouvelerJeton()
          .then((jeton) => {
            config._retriedRefresh = true;
            config.headers.Authorization = `Bearer ${jeton}`;
            return api(config);
          })
          .catch(() => {
            terminerSession();
            return Promise.reject(error);
          });
      }

      // Aucun renouvellement possible : la session est bel et bien close.
      terminerSession();
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
