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

/** Une catégorie de données métier rattachée à un compte. */
export interface UserDependency {
    libelle: string;
    nombre: number;
}

export interface UserDependencies {
    userId: number;
    aDesDonneesMetier: boolean;
    totalReferences: number;
    details: UserDependency[];
}

/** Résultat d'une suppression : archivage ou suppression définitive. */
export interface DeleteOrArchiveResult {
    userId: number;
    archive: boolean;
    message: string;
    details: UserDependency[];
}

/** Ligne du module Archives. */
export interface ArchivedUser {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
    role: string;
    dateCreation: string;
    dateArchivage?: string | null;
    totalReferences: number;
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

    /**
     * Suppression intelligente : le compte est ARCHIVÉ s'il porte un historique
     * métier, supprimé définitivement sinon. Le résultat indique lequel des deux
     * a eu lieu, pour l'annoncer clairement à l'utilisateur.
     */
    deleteUser: async (userId: number): Promise<DeleteOrArchiveResult> => {
        const res = await api.delete<any>(`/user-management/${userId}`);
        return res.data?.data ?? res.data;
    },

    /** Données métier rattachées à un compte (avant suppression). */
    getDependencies: async (userId: number): Promise<UserDependencies> => {
        const res = await api.get<any>(`/user-management/${userId}/dependencies`);
        return res.data?.data ?? res.data;
    },

    /** Comptes archivés (module Archives). */
    getArchived: async (): Promise<ArchivedUser[]> => {
        const res = await api.get<any>('/user-management/archives');
        return res.data?.data ?? res.data ?? [];
    },

    /** Restaure un compte archivé (il repasse en SUSPENDU, à réactiver). */
    restoreArchived: async (userId: number): Promise<void> => {
        await api.post(`/user-management/archives/${userId}/restore`);
    },

    /** Purge définitive d'un archivé — refusée (409) s'il porte de l'historique. */
    purgeArchived: async (userId: number): Promise<void> => {
        await api.delete(`/user-management/archives/${userId}`);
    },

    /** Confirme manuellement l'email (quand le SMTP n'a pas délivré le code) */
    confirmEmailManually: async (userId: number): Promise<void> => {
        await api.post(`/user-management/${userId}/confirm-email`);
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
