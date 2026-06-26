import api from '@/lib/axiosConfig';
import { 
  EquipementListItem, 
  EquipementDetail, 
  CreateEquipement, 
  UpdateEquipement, 
  FilterEquipements, 
  KpiEquipements, 
  VerificationMission,
  CheckOutRequest,
  CheckInRequest,
  Mouvement,
  Inspection,
  NoteEquipement,
  NoteCreateRequest,
  NoteUpdateRequest,
  ContratFournisseur,
  ContratCreateRequest,
  ContratUpdateRequest
} from '../types/equipment';

export const equipmentService = {
    getAll: async (filters: FilterEquipements): Promise<{ data: EquipementListItem[], total: number, totalPages: number }> => {
        const response = await api.get('/equipements', { params: filters });
        return response.data;
    },

    getById: async (id: number): Promise<EquipementDetail> => {
        const response = await api.get(`/equipements/${id}`);
        return response.data;
    },

    create: async (data: CreateEquipement): Promise<EquipementDetail> => {
        const response = await api.post('/equipements', data);
        return response.data;
    },

    update: async (id: number, data: UpdateEquipement): Promise<EquipementDetail> => {
        const response = await api.put(`/equipements/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/equipements/${id}`);
    },

    verifierAvantMission: async (vehiculeId: number): Promise<VerificationMission> => {
        const response = await api.get(`/equipements/vehicule/${vehiculeId}/verification-mission`);
        return response.data;
    },

    checkOut: async (data: CheckOutRequest): Promise<Mouvement> => {
        const response = await api.post('/equipements/checkout', data);
        return response.data;
    },

    checkIn: async (data: CheckInRequest): Promise<Mouvement> => {
        const response = await api.post('/equipements/checkin', data);
        return response.data;
    },

    creerInspection: async (id: number, data: any): Promise<Inspection> => {
        const response = await api.post(`/equipements/${id}/inspections`, data);
        return response.data;
    },

    getKpis: async (): Promise<KpiEquipements> => {
        const response = await api.get('/equipements/kpis');
        return response.data;
    },

    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/equipements/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.imageUrl;
    },

    // --- NOTES ---
    addNote: async (data: NoteCreateRequest): Promise<NoteEquipement> => {
        const response = await api.post('/equipements/notes', data);
        return response.data;
    },
    updateNote: async (noteId: number, data: NoteUpdateRequest): Promise<NoteEquipement> => {
        const response = await api.put(`/equipements/notes/${noteId}`, data);
        return response.data;
    },
    deleteNote: async (noteId: number): Promise<void> => {
        await api.delete(`/equipements/notes/${noteId}`);
    },

    // --- CONTRATS ---
    addContrat: async (data: ContratCreateRequest): Promise<ContratFournisseur> => {
        const response = await api.post('/equipements/contrats', data);
        return response.data;
    },
    updateContrat: async (contratId: number, data: ContratUpdateRequest): Promise<ContratFournisseur> => {
        const response = await api.put(`/equipements/contrats/${contratId}`, data);
        return response.data;
    },
    deleteContrat: async (contratId: number): Promise<void> => {
        await api.delete(`/equipements/contrats/${contratId}`);
    }
};

export default equipmentService;
