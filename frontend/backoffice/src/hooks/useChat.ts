import { useState, useEffect, useCallback, useRef } from 'react';
import chatService, { Conversation, ChatMessage, UserStatus, ChatUtilisateur } from '@/services/chatService';
import signalRService from '@/services/signalRService';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [searchResults, setSearchResults] = useState<ChatUtilisateur[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const activeConvRef = useRef<Conversation | null>(null);

  // ── Refs for StrictMode safety ──
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Helper to get current user ID from JWT
  const getCurrentUserId = useCallback((): number => {
    const token = localStorage.getItem('xpark_token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(payload.nameid || payload.sub || '0');
    } catch {
      return 0;
    }
  }, []);

  // ── SignalR connection (StrictMode safe) ──
  useEffect(() => {
    // StrictMode guard: ignore second mount if already connecting
    if (connectingRef.current) return;
    connectingRef.current = true;
    mountedRef.current = true;

    const token = localStorage.getItem('xpark_token');
    if (token) {
      signalRService.connect(token)
        .then(() => {
          if (!mountedRef.current) return;
          setConnected(true);
          loadConversations();
          loadOnlineUsers();
        })
        .catch(err => {
          if (!mountedRef.current) return;
          console.error('[useChat] SignalR connection failed:', err);
        });
    }

    return () => {
      mountedRef.current = false;
      connectingRef.current = false;
      // Do NOT call disconnect() here — connection is shared (singleton)
      // Just unsubscribe from events in the next effect
    };
  }, []);

  // ── Listen to SignalR events ──
  useEffect(() => {
    if (!connected) return;

    const handleReceiveMessage = (message: ChatMessage) => {
      if (!mountedRef.current) return;
      const currentConv = activeConvRef.current;
      if (currentConv && message.conversationId === currentConv.idConversation) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.idMessage === message.idMessage)) return prev;
          return [...prev, message];
        });
        signalRService.markAsRead(message.conversationId);
      }
      loadConversations();
    };

    const handleUserTyping = ({ userId, conversationId, isTyping }: { userId: number; conversationId: number; isTyping: boolean }) => {
      if (!mountedRef.current) return;
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(conversationId)) {
          newMap.set(conversationId, new Set());
        }
        const users = new Set(newMap.get(conversationId)!);
        if (isTyping) {
          users.add(userId);
        } else {
          users.delete(userId);
        }
        newMap.set(conversationId, users);
        return newMap;
      });
    };

    const handleMessagesRead = () => {
      if (!mountedRef.current) return;
      loadConversations();
    };

    const handleUserConnected = () => {
      if (!mountedRef.current) return;
      loadOnlineUsers();
    };
    const handleUserDisconnected = () => {
      if (!mountedRef.current) return;
      loadOnlineUsers();
    };

    const handleMessageSupprime = (payload: { messageId: number }) => {
      if (!mountedRef.current) return;
      setMessages(prev => prev.map(m => 
        m.idMessage === payload.messageId ? { ...m, estSupprime: true } : m
      ));
    };

    const handleMessageEpingle = (payload: { messageId: number, epingle: boolean }) => {
      if (!mountedRef.current) return;
      setMessages(prev => prev.map(m => 
        m.idMessage === payload.messageId ? { ...m, epingle: payload.epingle } : m
      ));
    };

    signalRService.on('ReceiveMessage', handleReceiveMessage);
    signalRService.on('UserTyping', handleUserTyping);
    signalRService.on('MessagesRead', handleMessagesRead);
    signalRService.on('UserConnected', handleUserConnected);
    signalRService.on('UserDisconnected', handleUserDisconnected);
    signalRService.on('MessageSupprime', handleMessageSupprime);
    signalRService.on('MessageEpingle', handleMessageEpingle);

    return () => {
      signalRService.off('ReceiveMessage', handleReceiveMessage);
      signalRService.off('UserTyping', handleUserTyping);
      signalRService.off('MessagesRead', handleMessagesRead);
      signalRService.off('UserConnected', handleUserConnected);
      signalRService.off('UserDisconnected', handleUserDisconnected);
      signalRService.off('MessageSupprime', handleMessageSupprime);
      signalRService.off('MessageEpingle', handleMessageEpingle);
    };
  }, [connected]);

  const loadConversations = async () => {
    try {
      const data = await chatService.getUserConversations();
      if (mountedRef.current) setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await chatService.getMessages(conversationId);
      if (mountedRef.current) {
        setMessages(data.reverse());
        signalRService.markAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const users = await chatService.getOnlineUsers();
      if (mountedRef.current) setOnlineUsers(users);
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
    loadMessages(conversation.idConversation);
    signalRService.joinConversation(conversation.idConversation);
  }, []);

  const sendMessage = async (contenu: string, typeMessage: string = 'TEXTE', reponseAMessageId?: number) => {
    if (!activeConversation) return;

    try {
      await signalRService.sendMessage(activeConversation.idConversation, contenu, typeMessage, reponseAMessageId);
      // Refresh conversation list so sidebar shows the new last message
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendFile = async (file: File) => {
    if (!activeConversation) return;

    try {
      const message = await chatService.uploadFile(activeConversation.idConversation, file);
      if (mountedRef.current) {
        setMessages(prev => [...prev, message]);
        loadConversations();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const typing = (isTyping: boolean) => {
    if (!activeConversation) return;
    signalRService.typing(activeConversation.idConversation, isTyping);
  };

  const createPrivateChat = async (userId: number) => {
    try {
      const conversation = await chatService.createPrivateConversation(userId);
      await loadConversations();
      selectConversation(conversation);
    } catch (error: any) {
      console.error('Error creating private chat:', error.response?.data || error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const isUserTyping = (conversationId: number): boolean => {
    const users = typingUsers.get(conversationId);
    return users ? users.size > 0 : false;
  };

  const searchUsers = async (query: string) => {
    try {
      const results = await chatService.searchUsers(query);
      if (mountedRef.current) setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.some(u => u.utilisateurId === userId && u.statut === 'ENLIGNE');
  };

  const deleteMessage = async (messageId: number) => {
    try {
      await chatService.deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const pinMessage = async (messageId: number) => {
    try {
      await chatService.pinMessage(messageId);
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  return {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    searchResults,
    loading,
    connected,
    selectConversation,
    sendMessage,
    sendFile,
    typing,
    createPrivateChat,
    searchUsers,
    isUserTyping,
    isUserOnline,
    getCurrentUserId,
    deleteMessage,
    pinMessage,
    refreshConversations: loadConversations,
  };
}
