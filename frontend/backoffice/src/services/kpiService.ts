import api from '@/lib/axiosConfig';

export interface KPI {
  idKPI: number;
  nom: string;
  valeur: number;
  unite: string;
  objectif?: number;
  tendance: 'HAUSSE' | 'BAISSE' | 'STABLE';
  categorie: string;
  icone: string;
  couleur: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  description: string;
  codeKPI: string;
  dateCalcul: string;
  donneesJson?: string;
  pourcentageObjectif: number;
  objectifAtteint: boolean;
}

export const kpiService = {
  calculerTous: async (): Promise<KPI[]> => {
    const response = await api.post('/kpi/calculer-tous');
    return response.data.kpis;
  },

  getParCategorie: async (categorie: string): Promise<KPI[]> => {
    const response = await api.get(`/kpi/categorie/${categorie}`);
    return response.data;
  },

  getDernier: async (codeKPI: string): Promise<KPI> => {
    const response = await api.get(`/kpi/${codeKPI}`);
    return response.data;
  },
};

export default kpiService;
