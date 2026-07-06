import api from '@/lib/axiosConfig';
import { getRoleFromToken, isTokenValid, decodeToken } from '../utils/jwtHelper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authApi = api;

// Les intercepteurs sont désormais gérés globalement dans src/lib/axiosConfig.ts

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    confirmPassword: string;
    telephone: string;
    role?: string;
}

export interface RegisterDto {
    email: string;
    nom: string;
    prenom: string;
    motDePasse: string;
}

export interface AuthResultDto {
    success: boolean;
    message: string;
    newStatut?: number;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    email: string;
    role: string;
    statut: string;
    nom: string;
    prenom: string;
    idUtilisateur: number;
    expiration: string;
    photoUrl?: string;
    requiresEmailConfirmation?: boolean;
    requiresAdminApproval?: boolean;
    isReRegistration?: boolean;
    message?: string;
    // ─── MFA challenge (étape 2 du login) ───
    requiresMfa?: boolean;
    mfaMethods?: string[];
    mfaToken?: string;
}

export interface MfaSettings {
    authenticatorEnabled: boolean;
    emailOtpEnabled: boolean;
    defaultMethod: string;
    mfaRequired: boolean;
}

export interface AuthenticatorSetup {
    secret: string;
    otpAuthUri: string;
    qrCodeDataUri: string;
}

export interface LoginHistoryEntry {
    loggedInAt: string;
    loginMethod: string;
    mfaMethod?: string;
    ipAddress?: string;
    userAgent?: string;
    isSuccessful: boolean;
    failureReason?: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface CreatePasswordRequest {
    email: string;
    token: string;
    password: string;
    confirmPassword: string;
}

export interface LoginPinRequest {
    email: string;
    pin: string;
}

export interface UnlockSessionRequest {
    userId: number;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UpdateProfileRequest {
    nom?: string;
    prenom?: string;
    telephone?: string;
}

export interface UserProfile {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    role: string;
    actif: boolean;
    emailConfirmed: boolean;
    hasPin: boolean;
    dateCreation: string;
}

// ─── SERVICE ────────────────────────────────────────────────────────────────

export const authService = {
    /** Connexion avec email + mot de passe */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        try {
            const response = await authApi.post<any>('/auth/login', data);
            // Unwrap ApiResponse<T> envelope: { success, data: AuthResponse, ... }
            const authData: AuthResponse = response.data?.data ?? response.data;
            // Ne pas créer de session tant que le 2e facteur n'est pas vérifié
            if (authData.token && !authData.requiresMfa) {
                authService.saveSession(authData);
            }
            return authData;
        } catch (error: any) {
            throw error;
        }
    },

    // ─── MFA (vérification en deux étapes) ──────────────────────────────────

    /** Étape 2 du login : échange (jeton MFA + code) contre les vrais jetons */
    verifyMfa: async (mfaToken: string, method: string, code: string): Promise<AuthResponse> => {
        const response = await authApi.post<any>('/auth/mfa/verify', { mfaToken, method, code });
        const authData: AuthResponse = response.data?.data ?? response.data;
        authService.saveSession(authData);
        return authData;
    },

    /** Renvoyer le code OTP email pendant le challenge MFA */
    resendMfaEmail: async (mfaToken: string): Promise<void> => {
        await authApi.post('/auth/mfa/email/resend', { mfaToken });
    },

    /** Paramètres MFA de l'utilisateur connecté */
    getMfaSettings: async (): Promise<MfaSettings> => {
        const response = await authApi.get<any>('/auth/mfa/settings');
        return response.data?.data ?? response.data;
    },

    /** Démarre le setup Authenticator (secret + QR code) */
    setupAuthenticator: async (): Promise<AuthenticatorSetup> => {
        const response = await authApi.post<any>('/auth/mfa/authenticator/setup');
        return response.data?.data ?? response.data;
    },

    /** Confirme le setup avec le premier code TOTP → active le MFA */
    confirmAuthenticator: async (code: string): Promise<MfaSettings> => {
        const response = await authApi.post<any>('/auth/mfa/authenticator/confirm', { code });
        return response.data?.data ?? response.data;
    },

    disableAuthenticator: async (): Promise<MfaSettings> => {
        const response = await authApi.post<any>('/auth/mfa/authenticator/disable');
        return response.data?.data ?? response.data;
    },

    toggleEmailOtp: async (): Promise<MfaSettings> => {
        const response = await authApi.post<any>('/auth/mfa/email/toggle');
        return response.data?.data ?? response.data;
    },

    /** Historique des connexions (FICHE LoginHistory) */
    getLoginHistory: async (limit = 20): Promise<LoginHistoryEntry[]> => {
        const response = await authApi.get<any>(`/auth/security/login-history?limit=${limit}`);
        return response.data?.data ?? response.data;
    },

    /** Inscription d'un nouvel utilisateur */
    register: async (data: RegisterDto): Promise<AuthResultDto> => {
        const response = await authApi.post<AuthResultDto>('/auth/register', data);
        return response.data;
    },

    /** Déconnexion */
    logout: async (): Promise<void> => {
        try {
            await authApi.post('/auth/logout');
        } finally {
            authService.clearSession();
            window.location.href = '/auth/login';
        }
    },

    /** Demande de réinitialisation de mot de passe */
    recoverPassword: async (email: string): Promise<void> => {
        await authApi.post('/auth/recover-password', { email });
    },

    /** Réinitialiser le mot de passe avec le token reçu par email */
    resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
        await authApi.post('/auth/reset-password', data);
    },

    /** Créer un mot de passe (lien première connexion par email) */
    createPassword: async (data: CreatePasswordRequest): Promise<void> => {
        await authApi.post('/auth/create-password', data);
    },

    /** Confirmer l'email via token */
    confirmEmail: async (email: string, token: string): Promise<void> => {
        await authApi.post(`/auth/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
    },

    /** Renvoyer l'email de confirmation */
    resendConfirmation: async (email: string): Promise<void> => {
        await authApi.post('/auth/resend-confirmation', { email });
    },

    /** Connexion avec code PIN */
    loginWithPin: async (data: LoginPinRequest): Promise<AuthResponse> => {
        const response = await authApi.post<any>('/auth/login-pin', data);
        const authData: AuthResponse = response.data?.data ?? response.data;
        authService.saveSession(authData);
        return authData;
    },

    /** Définir un code PIN */
    setPin: async (pin: string): Promise<void> => {
        await authApi.post('/auth/set-pin', { pin });
    },

    /** Verrouiller la session courante */
    lockScreen: async (): Promise<void> => {
        await authApi.post('/auth/lock-screen');
    },

    /** Déverrouiller la session */
    unlockScreen: async (data: UnlockSessionRequest): Promise<AuthResponse> => {
        const response = await authApi.post<any>('/auth/unlock-screen', data);
        const authData: AuthResponse = response.data?.data ?? response.data;
        authService.saveSession(authData);
        return authData;
    },

    /** Changer le mot de passe */
    changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        await authApi.post('/auth/change-password', data);
    },

    /** Obtenir le profil de l'utilisateur connecté */
    getProfile: async (): Promise<UserProfile> => {
        const response = await authApi.get<UserProfile>('/auth/profile');
        return response.data;
    },

    /** Mettre à jour le profil */
    updateProfile: async (data: UpdateProfileRequest): Promise<void> => {
        await authApi.put('/auth/profile', data);
    },

    /** Valider un token (reset password ou confirmation email) */
    validateToken: async (token: string): Promise<boolean> => {
        const response = await authApi.post<{ valid: boolean }>('/auth/validate-token', { token });
        return response.data.valid;
    },

    // ─── HELPERS ────────────────────────────────────────────────────────────
    saveSession: (data: AuthResponse): void => {
        localStorage.setItem('xpark_token', data.token);
        if (data.refreshToken) localStorage.setItem('xpark_refresh_token', data.refreshToken);

        // CRITIQUE : Ne jamais faire confiance au rôle renvoyé en clair s'il diffère du token
        const secureRole = getRoleFromToken(data.token) || data.role;
        const secureData = { ...data, role: secureRole };

        localStorage.setItem('xpark_user', JSON.stringify(secureData));
    },

    clearSession: (): void => {
        localStorage.removeItem('xpark_token');
        localStorage.removeItem('xpark_refresh_token');
        localStorage.removeItem('xpark_user');
    },

    getCurrentUser: (): AuthResponse | null => {
        const userStr = localStorage.getItem('xpark_user');
        const token = localStorage.getItem('xpark_token');

        if (!userStr || !token || !isTokenValid(token)) {
            authService.clearSession();
            return null;
        }

        const user = JSON.parse(userStr);

        // NORMALISATION : S'assurer que 'id' et 'idUtilisateur' pointent vers le même ID
        if (user.idUtilisateur && !user.id) user.id = user.idUtilisateur;
        if (user.id && !user.idUtilisateur) user.idUtilisateur = user.id;

        // CRITIQUE : Toujours écraser le rôle par celui du token
        const decoded = decodeToken(token);
        if (decoded) {
            user.role = decoded.role || user.role;
            // Fallback pour le nom d'affichage si l'API ne l'a pas serialisé correctement
            if (!user.prenom && !user.nom && decoded.unique_name) {
                const parts = decoded.unique_name.split(' ');
                user.prenom = parts[0] || '';
                user.nom = parts.slice(1).join(' ') || '';
            }
        }
        return user;
    },

    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('xpark_token');
        return isTokenValid(token);
    },

    getToken: (): string | null => {
        return localStorage.getItem('xpark_token');
    },
};

export default authService;
