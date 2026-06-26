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

export const userService = {
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
