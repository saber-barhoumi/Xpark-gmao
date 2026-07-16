import api from '@/lib/axiosConfig';
import { Employee, EmployeeDto } from '../types/employee';

/** IAM.API (microservice) enveloppe la liste : { success, message, data: [...] }.
 *  Le monolithe renvoyait le tableau nu — on accepte les deux formes. */
const unwrap = (payload: any): Employee[] =>
    Array.isArray(payload) ? payload : (payload?.data ?? [])

export const employeeService = {
    getAll: async (params?: { post?: string; statut?: string }): Promise<Employee[]> => {
        const response = await api.get('/employees', { params });
        return unwrap(response.data);
    },

    /** Retourne uniquement les employés actifs — pour les dropdowns de formulaires */
    getActifs: async (post?: string): Promise<Employee[]> => {
        const response = await api.get('/employees', { params: { statut: 'ACTIF', post } });
        return unwrap(response.data);
    },

    getById: async (id: number): Promise<Employee> => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },

    create: async (data: EmployeeDto): Promise<Employee> => {
        const response = await api.post('/employees', data);
        return response.data;
    },

    update: async (id: number, data: EmployeeDto): Promise<void> => {
        await api.put(`/employees/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/employees/${id}`);
    }
};

export default employeeService;
