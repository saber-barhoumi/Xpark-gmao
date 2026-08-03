import * as signalR from '@microsoft/signalr';
import { trace } from '@/helpers/journal';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnecting = false;    // Guard anti-double connect
  private isStopping   = false;    // Guard anti-stop pendant connect

  private buildConnection(token: string): signalR.HubConnection {
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = API_URL.replace(/\/api\/?$/, '');

    return new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/chatHub`, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets
          | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }

  async connect(token: string): Promise<void> {
    // Already connected → nothing to do
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    // A connection is already in progress → wait
    if (this.isConnecting) return;

    // stop() was called in the meantime (StrictMode) → abandon
    if (this.isStopping) return;

    this.isConnecting = true;

    try {
      // Clean up old connection first
      if (this.connection) {
        await this.connection.stop().catch(() => {});
        this.connection = null;
      }

      this.connection = this.buildConnection(token);

      // Reconnection handlers
      this.connection.onreconnecting(() => {
        trace('[SignalR] Reconnecting...');
      });

      this.connection.onreconnected(() => {
        trace('[SignalR] Reconnected ✓');
        this.setupEventHandlers();
      });

      this.connection.onclose(() => {
        trace('[SignalR] Connection closed');
      });

      await this.connection.start();
      trace('[SignalR] Connected ✓');
      this.setupEventHandlers();
    } catch (err) {
      // Ignore if stop() was called while connecting
      if (this.isStopping) {
        trace('[SignalR] Connection cancelled (component unmounted)');
        return;
      }
      console.error('[SignalR] Connection error:', err);
      throw err;
    } finally {
      this.isConnecting = false;
      this.isStopping   = false;
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    this.connection.on('ReceiveMessage', (message) => {
      this.emit('ReceiveMessage', message);
    });

    this.connection.on('UserConnected', (userId) => {
      this.emit('UserConnected', userId);
    });

    this.connection.on('UserDisconnected', (userId) => {
      this.emit('UserDisconnected', userId);
    });

    this.connection.on('UserTyping', (data) => {
      this.emit('UserTyping', data);
    });

    this.connection.on('MessagesRead', (data) => {
      this.emit('MessagesRead', data);
    });

    this.connection.on('ReactionAdded', (reaction) => {
      this.emit('ReactionAdded', reaction);
    });

    // WebRTC call events
    this.connection.on('IncomingCall', (callerId: number, callType: string, offer: string) => {
      this.emit('IncomingCall', callerId, callType, offer);
    });

    this.connection.on('CallAnswered', (answer: string) => {
      this.emit('CallAnswered', answer);
    });

    this.connection.on('IceCandidate', (candidate: string) => {
      this.emit('IceCandidate', candidate);
    });

    this.connection.on('CallEnded', () => {
      this.emit('CallEnded');
    });
  }

  // Send message
  async sendMessage(conversationId: number, contenu: string, typeMessage: string = 'TEXTE', reponseAMessageId?: number) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }
    await this.connection.invoke('SendMessage', conversationId, contenu, typeMessage, reponseAMessageId || null);
  }

  // Typing indicator
  async typing(conversationId: number, isTyping: boolean) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('Typing', conversationId, isTyping);
  }

  // Mark as read
  async markAsRead(conversationId: number) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('MarkAsRead', conversationId);
  }

  // Add reaction
  async addReaction(messageId: number, emoji: string) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('AddReaction', messageId, emoji);
  }

  // Join conversation
  async joinConversation(conversationId: number) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR: Cannot join conversation, not connected');
      return;
    }
    await this.connection.invoke('JoinConversation', conversationId);
  }

  // Leave conversation
  async leaveConversation(conversationId: number) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveConversation', conversationId);
  }

  // Listen to events
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Stop listening
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Emit event
  private emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(...args));
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  get state(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  async disconnect(): Promise<void> {
    this.isStopping = true;
    if (this.connection) {
      await this.connection.stop().catch(() => {});
      this.connection = null;
    }
    this.isStopping = false;
  }
}

// Singleton — single instance for the whole app
export default new SignalRService();
