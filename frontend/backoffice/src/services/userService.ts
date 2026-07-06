import api from '@/lib/axiosConfig';

export interface PendingUser {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    role: string;
    dateCreation: string;
}

/** Compte complet (UserProfileDto de IAM.API) */
export interface AccountUser {
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
    photo?: string | null;
    statut: string;   // EN_ATTENTE | ACTIF | SUSPENDU | DESACTIVE
}

export interface UpdateAccountDto {
    nom?: string;
    prenom?: string;
    telephone?: string;
}

export const userService = {
    /** Tous les comptes de la base (ADMIN / ADMINISTRATEUR / GESTIONNAIRE) */
    getAllUsers: async (): Promise<AccountUser[]> => {
        const response = await api.get<any>('/user-management');
        return response.data?.data ?? response.data;
    },

    /** Met à jour nom / prénom / téléphone d'un compte */
    updateUser: async (userId: number, data: UpdateAccountDto): Promise<AccountUser> => {
        const response = await api.put<any>(`/user-management/${userId}`, data);
        return response.data?.data ?? response.data;
    },

    /** Suppression définitive (409 si le compte est lié à des données métier) */
    deleteUser: async (userId: number): Promise<void> => {
        await api.delete(`/user-management/${userId}`);
    },

    suspendUser: async (userId: number): Promise<void> => {
        await api.post(`/user-management/${userId}/suspend`);
    },

    activateUser: async (userId: number): Promise<void> => {
        await api.post(`/user-management/${userId}/activate`);
    },

    getPendingUsers: async (): Promise<PendingUser[]> => {
        const response = await api.get<{ total: number, users: PendingUser[] }>('/user-management/pending');
        return response.data.users;
    },

    approveUser: async (userId: number, role: string): Promise<void> => {
        await api.post(`/user-management/${userId}/approve`, { role });
    },

    rejectUser: async (userId: number, reason: string): Promise<void> => {
        await api.post(`/user-management/${userId}/reject`, { raison: reason });
    },

    changeUserRole: async (userId: number, newRole: string): Promise<void> => {
        await api.post(`/user-management/${userId}/role`, { newRole });
    }
};

export default userService;
