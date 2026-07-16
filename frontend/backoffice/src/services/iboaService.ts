// IntelligentBusinessOwnerAssistant (IBOA) — service de monitoring temps réel (port 5008)
// Comme les autres services IA (predictor :8000, optimizer :8001), IBOA est
// appelé directement (pas via le gateway nginx).

const IBOA_API = import.meta.env.VITE_IBOA_API_URL ?? 'http://localhost:5008';

export interface IboaHealth {
    status: string;
    service: string;
    rabbitmqConnected: boolean;
    whatsappMode: 'TWILIO' | 'SIMULATION';
    emailMode: 'SMTP' | 'SIMULATION';
}

export interface IboaEvent {
    eventId: string;
    timestamp: string;
    eventType: string;
    severity: string;
    sourceService: string;
    criticityScore: number;
    classification: 'CRITIQUE' | 'IMPORTANT' | 'NORMAL' | 'INFO';
    scoreBreakdown: string[];
    eventData: Record<string, unknown>;
}

export interface IboaAlert {
    alertId: string;
    eventId: string;
    eventType?: string;
    criticityScore: number;
    alertStatus: string;
    recipient: string;
    deliveryChannel: string;
    messageContent: string;
    sentAt: string | null;
    retryCount: number;
    failureReason: string | null;
    createdAt: string;
}

export interface IboaStats {
    eventsByClassification: Record<string, number>;
    alerts: { channel: string; status: string; count: number }[];
    topEventTypes: { eventType: string; count: number }[];
}

export interface IboaPreferences {
    ownerName: string;
    whatsappNumber: string;
    email: string;
    whatsappThreshold: number;
    emailThreshold: number;
    quietHoursStart: number;
    quietHoursEnd: number;
    maxAlertsPerDay: number;
    enabled: boolean;
}

const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${IBOA_API}${path}`);
    if (!res.ok) throw new Error(`IBOA ${path} → HTTP ${res.status}`);
    return res.json();
};

export const iboaService = {
    health: () => get<IboaHealth>('/health'),
    events: (limit = 50) => get<{ events: IboaEvent[] }>(`/events?limit=${limit}`),
    alerts: (limit = 50) => get<{ alerts: IboaAlert[] }>(`/alerts?limit=${limit}`),
    stats: () => get<IboaStats>('/stats'),
    preferences: () => get<IboaPreferences>('/preferences'),

    savePreferences: async (prefs: IboaPreferences): Promise<IboaPreferences> => {
        const res = await fetch(`${IBOA_API}/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefs),
        });
        if (!res.ok) throw new Error(`IBOA preferences → HTTP ${res.status}`);
        return res.json();
    },

    /** Injecte un événement de test dans le bus RabbitMQ (parcours complet) */
    sendTestEvent: async (eventType?: string): Promise<{ eventId: string }> => {
        const res = await fetch(`${IBOA_API}/test-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventType ? { eventType, severity: 'HIGH' } : {}),
        });
        if (!res.ok) throw new Error(`IBOA test-event → HTTP ${res.status}`);
        return res.json();
    },

    flushBatch: async (): Promise<{ flushed: number }> => {
        const res = await fetch(`${IBOA_API}/batch/flush`, { method: 'POST' });
        return res.json();
    },

    /** Suppression ciblée d'événements (sélection du dashboard) */
    deleteEvents: async (ids: string[]): Promise<{ count: number }> => {
        const res = await fetch(`${IBOA_API}/events/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error(`IBOA events/delete → HTTP ${res.status}`);
        return res.json();
    },

    /** Purge complète du flux d'événements */
    deleteAllEvents: async (): Promise<{ count: number }> => {
        const res = await fetch(`${IBOA_API}/events`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`IBOA DELETE events → HTTP ${res.status}`);
        return res.json();
    },

    /** Suppression ciblée d'alertes (sélection du dashboard) */
    deleteAlerts: async (ids: string[]): Promise<{ count: number }> => {
        const res = await fetch(`${IBOA_API}/alerts/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error(`IBOA alerts/delete → HTTP ${res.status}`);
        return res.json();
    },

    /** Purge complète de l'historique d'alertes */
    deleteAllAlerts: async (): Promise<{ count: number }> => {
        const res = await fetch(`${IBOA_API}/alerts`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`IBOA DELETE alerts → HTTP ${res.status}`);
        return res.json();
    },

    dailyPdfUrl: `${IBOA_API}/reports/daily.pdf`,
    dailyExcelUrl: `${IBOA_API}/reports/daily.xlsx`,
};

export default iboaService;
