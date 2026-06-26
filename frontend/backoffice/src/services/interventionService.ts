import api from '@/lib/axiosConfig';

export interface Intervention {
    idIntervention: number;
    dateIntervention: string;
    dateFinIntervention?: string;
    description: string;
    cout: number;
    coutMainOeuvre?: number;
    coutPieces?: number;
    kilometrageIntervention: number;
    dureeMinutes?: number;
    typePeriodicite?: string;
    statut: string; // EN_ATTENTE | PLANIFIEE | EN_COURS | TERMINEE | ANNULEE
    typeIntervention: string; // PREVENTIVE | CURATIVE | ...
    vehiculeId: number;
    vehiculeImmatriculation: string;
    technicienId?: number;
    ordreTravailId?: number;
    observations?: string;
    prestataire?: string;
    nombrePieces: number;
}

export interface CreateInterventionDto {
    dateIntervention: string;
    description: string;
    typeIntervention: string;
    cout: number;
    vehiculeId: number;
    technicienId?: number;
    ordreTravailId?: number;
    kilometrageIntervention?: number;
    dureeMinutes?: number;
    prestataire?: string;
}

export interface UpdateInterventionDto {
    dateIntervention?: string;
    description?: string;
    cout?: number;
    coutMainOeuvre?: number;
    kilometrageIntervention?: number;
    dureeMinutes?: number;
    typePeriodicite?: string;
    statut?: string;
    technicienId?: number;
    ordreTravailId?: number;
    observations?: string;
}

export const interventionService = {
    getAll: async (params?: { statut?: string; type?: string; vehiculeId?: number; page?: number; pageSize?: number }) => {
        const response = await api.get('/interventions', { params });
        return response.data; // { total, page, pageSize, items }
    },

    getById: async (id: number) => {
        const response = await api.get(`/interventions/${id}`);
        return response.data;
    },

    create: async (data: CreateInterventionDto): Promise<Intervention> => {
        const response = await api.post('/interventions', data);
        return response.data;
    },

    update: async (id: number, data: UpdateInterventionDto): Promise<void> => {
        await api.put(`/interventions/${id}`, data);
    },

    updateStatut: async (id: number, statut: string): Promise<void> => {
        await api.patch(`/interventions/${id}/statut`, { statut });
    },

    addPiece: async (id: number, pieceId: number, quantite: number): Promise<void> => {
        await api.post(`/interventions/${id}/pieces`, { pieceId, quantite });
    },

    removePiece: async (id: number, pieceId: number): Promise<void> => {
        await api.delete(`/interventions/${id}/pieces/${pieceId}`);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/interventions/${id}`);
    },
};

export default interventionService;
