import api from '@/lib/axiosConfig';

export interface OrdreTravail {
    idOrdreTravail: number;
    reference: string;
    dateCreation: string;
    dateDebut?: string;
    dateFin?: string;
    description: string;
    observations?: string;
    statut: string; // PLANIFIE | EN_COURS | TERMINE | ANNULE
    priorite: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENT';
    coutReel?: number;
    coutEstime?: number;
    vehiculeId: number;
    vehiculeImmatriculation: string;
    vehiculeMarque: string;
    vehiculeModele: string;
    technicienId?: number;
    technicienNom?: string;
    technicienPrenom?: string;
    nombreInterventions: number;
}

export interface CreateOrdreTravailDto {
    reference?: string;
    description: string;
    observations?: string;
    vehiculeId: number;
    technicienId?: number;
    dateDebut?: string;
    dateFin?: string;
    priorite?: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENT';
}

export interface UpdateOrdreTravailDto {
    description?: string;
    observations?: string;
    technicienId?: number;
    dateDebut?: string;
    dateFin?: string;
    coutReel?: number;
    statut?: string;
    priorite?: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENT';
}

export const ordreTravailService = {
    getAll: async (params?: { statut?: string; page?: number; pageSize?: number }) => {
        const response = await api.get('/ordres-travail', { params });
        return response.data; // { total, page, pageSize, items }
    },

    getById: async (id: number) => {
        const response = await api.get(`/ordres-travail/${id}`);
        return response.data;
    },

    create: async (data: CreateOrdreTravailDto): Promise<OrdreTravail> => {
        const response = await api.post('/ordres-travail', data);
        return response.data;
    },

    update: async (id: number, data: UpdateOrdreTravailDto): Promise<void> => {
        await api.put(`/ordres-travail/${id}`, data);
    },

    updateStatut: async (id: number, statut: string): Promise<void> => {
        await api.put(`/ordres-travail/${id}`, { statut });
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/ordres-travail/${id}`);
    },
};

export default ordreTravailService;
