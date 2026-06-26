// src/app/(admin)/apps/email/types/email.types.ts

export interface EmailListItem {
  id:              string;
  de:              string;
  deNom:           string;
  sujet:           string;
  apercu:          string;
  lu:              boolean;
  etoile:          boolean;
  aPieceJointe:    boolean;
  nbPiecesJointes: number;
  dateUtc:         string;
  boite:           string;
}

export interface EmailDetail extends EmailListItem {
  a:             string;
  cc:            string[];
  corps:         string;    // HTML
  piecesJointes: PieceJointe[];
}

export interface PieceJointe {
  nom:     string;
  type:    string;
  taille:  number;
  contenu: string;   // Base64
}

export interface EmailBoite {
  nom:    string;
  nonLus: number;
  total:  number;
  icone:  string;
}

export interface PagedEmails {
  emails:     EmailListItem[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  nonLus:     number;
}

export interface EnvoyerEmailDto {
  a:      string[];
  cc:     string[];
  sujet:  string;
  corps:  string;
}
