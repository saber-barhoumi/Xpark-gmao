import api from '@/lib/axiosConfig';
import { Mission, CreateMissionDto, CloseMissionDto, StatutMission } from '../types/mission';

export const missionService = {
    getAll: async (statut?: StatutMission): Promise<Mission[]> => {
        const response = await api.get('/missions', { params: { statut } });
        return response.data;
    },

    getById: async (id: number): Promise<Mission> => {
        const response = await api.get(`/missions/${id}`);
        return response.data;
    },

    create: async (data: CreateMissionDto): Promise<Mission> => {
        const response = await api.post('/missions', data);
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
