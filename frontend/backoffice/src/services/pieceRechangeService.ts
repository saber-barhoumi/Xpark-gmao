import api from '@/lib/axiosConfig';

export interface PieceRechange {
    idPiece: number;
    reference: string;
    designation: string;
    categorie: string;
    stockActuel: number;
    stockMinimum: number;
    stockMaximum: number;
    prixUnitaire: number;
    fournisseur?: string;
    emplacement?: string;
    imageUrl?: string;
    estEnRupture: boolean;
    dateCreation: string;
    dateDernierApprovisionnement?: string;
}

export interface CreatePieceRechangeDto {
    reference: string;
    designation: string;
    categorie: string;
    stockActuel: number;
    stockMinimum: number;
    stockMaximum: number;
    prixUnitaire: number;
    fournisseur?: string;
    imageUrl?: string;
}

export interface UpdatePieceRechangeDto {
    designation?: string;
    stockMinimum?: number;
    stockMaximum?: number;
    prixUnitaire?: number;
    fournisseur?: string;
    emplacement?: string;
    imageUrl?: string;
}

export const CATEGORIES_PIECE = ['MOTEUR', 'TRANSMISSION', 'FREINAGE', 'SUSPENSION', 'ELECTRICITE', 'CARROSSERIE', 'PNEUMATIQUE', 'FILTRATION', 'ECLAIRAGE', 'AUTRE'];

export const pieceRechangeService = {
    getAll: async (params?: { categorie?: string; page?: number; pageSize?: number }) => {
        const response = await api.get('/piecesrechange', { params });
        return response.data; // { total, page, pageSize, items }
    },

    getById: async (id: number) => {
        const response = await api.get(`/piecesrechange/${id}`);
        return response.data;
    },

    create: async (data: CreatePieceRechangeDto): Promise<PieceRechange> => {
        const response = await api.post('/piecesrechange', data);
        return response.data;
    },

    update: async (id: number, data: UpdatePieceRechangeDto): Promise<void> => {
        await api.put(`/piecesrechange/${id}`, data);
    },

    ajusterStock: async (id: number, quantite: number): Promise<{ stockActuel: number }> => {
        const response = await api.post(`/piecesrechange/${id}/stock`, { quantite });
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/piecesrechange/${id}`);
    },

    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/piecesrechange/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.imageUrl;
    },
};

export default pieceRechangeService;
