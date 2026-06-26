export type TypeEquipement = 'Fixe' | 'Mobile' | 'Obligatoire';
export type EtatEquipement = 'Neuf' | 'Bon' | 'Use' | 'ARemplacer' | 'HorsService';
export type CategorieEquipement = 'Securite' | 'Mecanique' | 'Electronique' | 'Outillage' | 'Autre';
export type TypeMouvement = 'CheckOut' | 'CheckIn' | 'Transfert';
export type EtatApresRetour = 'Bon' | 'Use' | 'Endommage' | 'Perdu';

export interface EquipementListItem {
  id: number;
  nom: string;
  codeInventaire: string;
  type: TypeEquipement;
  categorie: CategorieEquipement;
  etat: EtatEquipement;
  marque?: string;
  modele?: string;
  nomVehicule?: string;
  immatriculationVehicule?: string;
  fournisseur?: string;
  imageUrl?: string;
  nombreUtilisations: number;
  heuresUtilisation: number;
  dateFinGarantie?: string;
  vehiculeId?: number;
  actif: boolean;
  dateCreation: string;
}

export interface EquipementDetail extends EquipementListItem {
  numeroSerie?: string;
  dateAchat?: string;
  prixAchat?: number;
  documentsUrls: string[];
  dureeVieTheoriqueEnMois: number;
  seuilUsureUtilisations?: number;
  seuilRemplacementUtilisations?: number;
  dateEstimationRemplacement?: string;
  notesGenerales?: string;
  mouvements: Mouvement[];
  inspections: Inspection[];
  notes: NoteEquipement[];
  contrats: ContratFournisseur[];
}

export interface NoteEquipement {
  id: number;
  nomAuteur: string;
  priorite: 'info' | 'warning' | 'danger' | 'success';
  contenu: string;
  tags: string[];
  piecesJointes: string[];
  isEpingle: boolean;
  dateCreation: string;
  dateModification: string;
}

export interface ContratFournisseur {
  id: number;
  type: string;
  nomFournisseur: string;
  numeroContrat?: string;
  contactFournisseur?: string;
  telephoneSAV?: string;
  dateDebutUtc: string;
  dateFinUtc: string;
  montantAnnuel?: number;
  documentUrl?: string;
  notes?: string;
  isActif: boolean;
  estExpire: boolean;
  joursRestants: number;
  dateCreation: string;
}

export interface Mouvement {
  id: number;
  type: TypeMouvement;
  missionId?: number;
  referenceMission?: string;
  nomUtilisateur?: string;
  dateDebutUtc: string;
  dateFinUtc?: string;
  etatApresRetour?: EtatApresRetour;
  coutReparation?: number;
  observations?: string;
}

export interface Inspection {
  id: number;
  nomTechnicien: string;
  etatConstate: EtatEquipement;
  scoreEtat: number;
  observations?: string;
  recommandeRemplacement: boolean;
  coutEstimeRemplacement?: number;
  dateCreation: string;
}

export interface CreateEquipement {
    id?: number;
    nom: string;
    codeInventaire: string;
    type: TypeEquipement;
    categorie: CategorieEquipement;
    etat: EtatEquipement;
    marque?: string;
    modele?: string;
    numeroSerie?: string;
    fournisseur?: string;
    imageUrl?: string;
    documentsUrls?: string[];
    dateAchat?: string;
    prixAchat?: number;
    dateFinGarantie?: string;
    dureeVieTheoriqueEnMois: number;
    seuilUsureUtilisations?: number;
    seuilRemplacementUtilisations?: number;
    vehiculeId?: number;
    notes?: string;
}

export interface UpdateEquipement extends Partial<CreateEquipement> {
  id: number;
}

export interface FilterEquipements {
  search?: string;
  type?: TypeEquipement;
  etat?: EtatEquipement;
  categorie?: CategorieEquipement;
  vehiculeId?: number;
  disponiblePool?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface KpiEquipements {
  tauxDisponibilite: number;
  coutRemplacementMoyenParCategorie: { categorie: CategorieEquipement; cout: number }[];
  dureeVieMoyenneVsTheorique: { categorie: CategorieEquipement; moyenne: number; theorique: number }[];
}

export interface VerificationMission {
  status: 'OK' | 'BLOCAGE';
  equipementsFixesOk: EquipementListItem[];
  equipementsObligatoiresOk: EquipementListItem[];
  problemes: {
    equipement: EquipementListItem;
    raison: string;
    bloquant: boolean;
  }[];
}

export interface CheckOutRequest {
  equipementId: number;
  missionId: number;
  userId: number;
  observations?: string;
}

export interface CheckInRequest {
  mouvementId: number;
  etatApresRetour: EtatApresRetour;
  observations?: string;
  coutReparation?: number;
  photosUrls?: string[];
}

export interface InspectionCreateRequest {
  etatConstate: EtatEquipement;
  scoreEtat: number;
  checklistJson?: string;
  observations?: string;
  photosJson?: string;
  recommandeRemplacement: boolean;
  coutEstimeRemplacement?: number;
}

export interface NoteCreateRequest {
  equipementId: number;
  priorite: 'info' | 'warning' | 'danger' | 'success';
  contenu: string;
  isEpingle: boolean;
  tags?: string[];
  piecesJointes?: string[];
}

export interface NoteUpdateRequest extends Partial<NoteCreateRequest> {
  id: number;
}

export interface ContratCreateRequest {
  equipementId: number;
  type: string;
  nomFournisseur: string;
  numeroContrat?: string;
  contactFournisseur?: string;
  telephoneSAV?: string;
  dateDebutUtc: string;
  dateFinUtc: string;
  montantAnnuel?: number;
  documentUrl?: string;
  notes?: string;
}

export interface ContratUpdateRequest extends Partial<ContratCreateRequest> {
  id: number;
}
