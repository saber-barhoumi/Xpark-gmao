import api from '@/lib/axiosConfig';
import { Mission, CreateMissionDto, CloseMissionDto, AssignMissionDto, StatutMission } from '../types/mission';

export const missionService = {
    getAll: async (statut?: StatutMission): Promise<Mission[]> => {
        const response = await api.get('/missions', { params: { statut } });
        return response.data;
    },

    getById: async (id: number): Promise<Mission> => {
        const response = await api.get(`/missions/${id}`);
        return response.data;
    },

    /** Missions du chauffeur connecté uniquement (self-service, app back-office). */
    getMyDriverMissions: async (statut?: StatutMission): Promise<Mission[]> => {
        const response = await api.get('/missions/driver', { params: { statut } });
        return response.data;
    },

    create: async (data: CreateMissionDto): Promise<Mission> => {
        const response = await api.post('/missions', data);
        return response.data;
    },

    /** Applique une affectation générée par OptimisateurFlotteIA (mission EN_ATTENTE → EN_COURS) */
    assign: async (id: number, data: AssignMissionDto): Promise<Mission> => {
        const response = await api.put(`/missions/${id}/assign`, data);
        return response.data;
    },

    close: async (id: number, data: CloseMissionDto): Promise<Mission> => {
        const response = await api.put(`/missions/${id}/close`, data);
        return response.data;
    },

    cancel: async (id: number): Promise<void> => {
        await api.put(`/missions/${id}/cancel`);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/missions/${id}`);
    }
};

export default missionService;
