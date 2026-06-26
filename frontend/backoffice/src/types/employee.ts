export enum PostEmployee {
    CHAUFFEUR = 'CHAUFFEUR',
    TECHNICIEN = 'TECHNICIEN',
    ADMINISTRATEUR = 'ADMINISTRATEUR',
    DIRECTEUR = 'DIRECTEUR',
    RESPONSABLE_MAINTENANCE = 'RESPONSABLE_MAINTENANCE'
}

export enum ServiceEmployee {
    TRANSPORT = 'TRANSPORT',
    MAINTENANCE = 'MAINTENANCE',
    ADMINISTRATION = 'ADMINISTRATION',
    DIRECTION = 'DIRECTION'
}

export enum StatutEmployee {
    DISPONIBLE = 'DISPONIBLE',
    EN_MISSION = 'EN_MISSION',
    EN_CONGE = 'EN_CONGE',
    INACTIF = 'INACTIF'
}

export enum SpecialtyTechnician {
    MECANIQUE = 'MECANIQUE',
    ELECTRICITE = 'ELECTRICITE',
    PNEUMATIQUE = 'PNEUMATIQUE',
    HYDRAULIQUE = 'HYDRAULIQUE'
}

export enum LevelTechnician {
    JUNIOR = 'JUNIOR',
    SENIOR = 'SENIOR',
    EXPERT = 'EXPERT'
}

export enum CategoriePermis {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E'
}

export interface Employee {
    idEmployee: number;
    name: string;
    prenom: string;
    numeroMatricule: string;
    post: PostEmployee;
    service: ServiceEmployee;
    statut: StatutEmployee;
    telephone: string;
    dateEmbauche: string;
    activ: boolean;

    // Additional fields for Drivers
    numeroPermis?: string;
    categoriePermis?: CategoriePermis;
    dateExpirationPermis?: string;

    // Additional fields for Technicians
    specialty?: SpecialtyTechnician;
    level?: LevelTechnician;
}

export interface EmployeeDto {
    name: string;
    prenom: string;
    numeroMatricule: string;
    post: string;
    service: string;
    statut: string;
    telephone: string;
    dateEmbauche: string;

    // Specialized fields
    numeroPermis?: string;
    categoriePermis?: string;
    dateExpirationPermis?: string;
    specialty?: string;
    level?: string;
}
