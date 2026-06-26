import { jwtDecode } from 'jwt-decode';

export interface CustomJwtPayload {
    nameid: string; // IdUtilisateur
    email: string;
    role: string;
    unique_name: string; // Nom Complet
    jti: string;
    role_level: string;
    statut: string;
    email_verified: string;
    account_approved: string;
    role_signature: string;
    exp: number;
    iss: string;
    aud: string;
}

/**
 * Decode safely a JWT token and returns typed payload
 */
export const decodeToken = (token: string): CustomJwtPayload | null => {
    try {
        return jwtDecode<CustomJwtPayload>(token);
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
};

/**
 * Gets the exact Role string assigned in the token
 */
export const getRoleFromToken = (token: string | null): string | null => {
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded ? decoded.role : null;
};

/**
 * Gets the mathematical role level for hierarchical comparison
 */
export const getRoleLevel = (token: string | null): number => {
    if (!token) return 0;
    const decoded = decodeToken(token);
    if (!decoded || !decoded.role_level) return 0;
    return parseInt(decoded.role_level, 10);
};

/**
 * Ensure mathematical hierarchy
 * e.g., if token has role_level 5 (ADMIN), it passes requireLevel 3 (TECHNICIAN)
 */
export const hasMinimumRoleLevel = (token: string | null, requireLevel: number): boolean => {
    const currentLevel = getRoleLevel(token);
    return currentLevel >= requireLevel;
};

/**
 * Verifies if a token exists and hasn't mathematically expired
 */
export const isTokenValid = (token: string | null): boolean => {
    if (!token || token === 'undefined' || token === 'null') return false;
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) return false;

    // exp is in seconds, convert to MS
    const expirationTimeMs = decoded.exp * 1000;
    const nowMs = Date.now();

    return expirationTimeMs > nowMs;
};
