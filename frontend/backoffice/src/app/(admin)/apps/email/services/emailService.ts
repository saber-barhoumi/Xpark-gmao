// src/app/(admin)/apps/email/services/emailService.ts

import api from '@/lib/axiosConfig';
import { PagedEmails, EmailDetail, EmailBoite, EnvoyerEmailDto } from '../types/email.types';

const BASE = '/email';

const emailService = {
  getBoites: (): Promise<EmailBoite[]> =>
    api.get(`${BASE}/boites`).then(r => r.data),

  getEmails: (
    boite: string,
    page  = 1,
    limit = 20,
    search = ''
  ): Promise<PagedEmails> =>
    api.get(`${BASE}/${boite}`, { params: { page, limit, search } })
      .then(r => r.data),

  getEmailDetail: (boite: string, uid: string): Promise<EmailDetail> =>
    api.get(`${BASE}/${boite}/${uid}`).then(r => r.data),

  marquerLu: (boite: string, uid: string, lu: boolean) =>
    api.put(`${BASE}/${boite}/${uid}/lu`, null, { params: { lu } }),

  etoiler: (boite: string, uid: string, etoile: boolean) =>
    api.put(`${BASE}/${boite}/${uid}/etoile`, null, { params: { etoile } }),

  supprimerEmail: (boite: string, uid: string) =>
    api.delete(`${BASE}/${boite}/${uid}`),

  envoyerEmail: (dto: EnvoyerEmailDto) =>
    api.post(`${BASE}/envoyer`, dto).then(r => r.data),

  repondreEmail: (dto: EnvoyerEmailDto, messageIdOriginal?: string) =>
    api.post(`${BASE}/repondre`, dto, { params: { messageIdOriginal } }).then(r => r.data),
};

export default emailService;
