import api from '@/lib/axiosConfig';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface ChatUtilisateur {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  photo?: string;
  photoUrl?: string; // Support both naming conventions
}

export interface ConversationParticipant {
  idParticipant: number;
  conversationId: number;
  utilisateurId: number;
  utilisateur: ChatUtilisateur;
  dateAjout: string;
  estAdmin: boolean;
  estEpingle: boolean;
  derniereLecture?: string;
  notificationsActivees: boolean;
}

export interface MessageReaction {
  idReaction: number;
  messageId: number;
  utilisateurId: number;
  utilisateur?: ChatUtilisateur;
  typeReaction: string;
  dateReaction: string;
}

export interface ChatMessage {
  idMessage: number;
  contenu: string;
  dateEnvoi: string;
  typeMessage: string;
  expediteurId: number;
  expediteur?: ChatUtilisateur;     // Present in REST responses
  nomExpediteur?: string;           // Present in SignalR DTO
  conversationId: number;
  estLu: boolean;
  dateLecture?: string;
  estSupprime: boolean;
  estModifie: boolean;
  epingle?: boolean;
  cheminFichier?: string;
  nomFichier?: string;
  tailleFichier?: number;
  reponseAMessageId?: number;
  reactions: MessageReaction[];
}

export interface Conversation {
  idConversation: number;
  titre?: string;
  typeConversation: string;
  dateCreation: string;
  dernierMessageDate?: string;
  imageGroupe?: string;
  estArchivee: boolean;
  participants: ConversationParticipant[];
  messages: ChatMessage[];
}

export interface UserStatus {
  idStatut: number;
  utilisateurId: number;
  utilisateur?: ChatUtilisateur;
  statut: string;
  derniereActivite: string;
  messageCustom?: string;
}

// ─── SERVICE ────────────────────────────────────────────────────────────────

export const chatService = {
  // Conversations
  getUserConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getConversation: async (id: number): Promise<Conversation> => {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  },

  createPrivateConversation: async (otherUserId: number): Promise<Conversation> => {
    const response = await api.post('/chat/conversations/private', { otherUserId });
    return response.data;
  },

  createGroupConversation: async (titre: string, participantIds: number[]): Promise<Conversation> => {
    const response = await api.post('/chat/conversations/group', { titre, participantIds });
    return response.data;
  },

  // Messages
  getMessages: async (conversationId: number, skip = 0, take = 50): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { skip, take }
    });
    return response.data;
  },

  uploadFile: async (conversationId: number, file: File): Promise<ChatMessage> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/chat/conversations/${conversationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await api.delete(`/chat/messages/${messageId}`);
  },

  pinMessage: async (messageId: number): Promise<{ epingle: boolean }> => {
    const response = await api.put(`/chat/messages/${messageId}/epingler`);
    return response.data;
  },

  // Utilisateurs
  getOnlineUsers: async (): Promise<UserStatus[]> => {
    const response = await api.get('/chat/users/online');
    return response.data;
  },

  searchUsers: async (query: string = ''): Promise<ChatUtilisateur[]> => {
    const response = await api.get(`/chat/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default chatService;
