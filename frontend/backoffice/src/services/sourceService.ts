import api from '@/lib/axiosConfig'

export type TypeSource =
    | 'STATION_EXTERNE'
    | 'DAC_INTERNE'
    | 'CARTE_CARBURANT'
    | 'CITERE_MOBILE'
    | 'STOCKAGE_PRIVE'

export interface Source {
    idSource: number
    nomSource: string
    typeSource: TypeSource
    adresse?: string
    ville?: string
    longitude?: number
    latitude?: number
    prixMoyen?: number
    remiseFiotte?: number
    codeCarte?: string
    actif: boolean
    dateCreation: string
    nombreConsommations: number
}

export interface CreateSourceDto {
    nomSource: string
    typeSource: TypeSource
    adresse?: string
    ville?: string
    longitude?: number
    latitude?: number
    prixMoyen?: number
    remiseFiotte?: number
    codeCarte?: string
}

export const sourceService = {
    getAll: (): Promise<Source[]> => api.get('/sources').then(r => r.data),
    getActives: (): Promise<Source[]> => api.get('/sources/actives').then(r => r.data),
    getById: (id: number): Promise<Source> => api.get(`/sources/${id}`).then(r => r.data),
    getByType: (type: TypeSource): Promise<Source[]> => api.get(`/sources/type/${type}`).then(r => r.data),
    create: (data: CreateSourceDto): Promise<Source> => api.post('/sources', data).then(r => r.data),
    update: (id: number, data: Partial<CreateSourceDto> & { actif?: boolean }): Promise<Source> =>
        api.put(`/sources/${id}`, data).then(r => r.data),
    delete: (id: number): Promise<void> => api.delete(`/sources/${id}`).then(r => r.data),
}

export default sourceService
