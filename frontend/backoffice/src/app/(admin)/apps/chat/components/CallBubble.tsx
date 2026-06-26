import React from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

interface CallData {
  callType:        'audio' | 'video';
  status:          'Missed' | 'Declined' | 'Completed' | 'Cancelled';
  durationSeconds: number;
  callerId:        string | number;
  label:           string;
}

interface CallBubbleProps {
  contenu:       string;           // JSON stringifié
  isMine:        boolean;          // true = j'ai initié l'appel
  dateEnvoi:     string;
  currentUserId: string;
  onCallback?:   (callType: 'audio' | 'video') => void;
}

const fmtHeure = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
};

const formatDuration = (s: number): string => {
  if (s < 60) return `${s} seconde${s > 1 ? 's' : ''}`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m} min ${sec} sec` : `${m} minute${m > 1 ? 's' : ''}`;
};

export const CallBubble: React.FC<CallBubbleProps> = ({
  contenu, isMine, dateEnvoi, onCallback,
}) => {
  let data: CallData | null = null;
  try { data = JSON.parse(contenu); } catch { return null; }
  if (!data) return null;

  const isVideo = data.callType === 'video';

  // ── Texte selon statut + point de vue ──
  const getStatusText = (): string => {
    switch (data!.status) {
      case 'Missed':
      case 'Cancelled':
        return isMine
          ? 'Appel annulé'
          : 'Appel manqué — Cliquez pour rappeler';
      case 'Declined':
        return isMine ? 'Appel refusé' : 'Vous avez refusé';
      case 'Completed':
        return formatDuration(data!.durationSeconds);
      default:
        return '';
    }
  };

  // ── Icône selon type + statut ──
  const getIconName = (): string => {
    if (data!.status === 'Completed') {
      return isVideo ? 'tabler:video' : 'tabler:phone-call';
    }
    return isVideo ? 'tabler:video-off' : 'tabler:phone-off';
  };

  // ── Couleur du texte statut ──
  const getStatusColor = (): string => {
    if (data!.status === 'Completed') {
      return isMine ? 'rgba(255,255,255,.75)' : '#198754';
    }
    // Manqué, annulé ou refusé
    if (!isMine && (data!.status === 'Missed' || data!.status === 'Cancelled')) return '#dc3545'; // rouge chez l'appelé
    return isMine ? 'rgba(255,255,255,.65)' : '#6c757d';
  };

  const isClickable = !isMine && data.status !== 'Completed';

  return (
    <li style={{
      display:        'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      marginBottom:   8,
      padding:        '2px 12px',
      listStyle:      'none',
    }}>
      <div
        onClick={() => isClickable && onCallback?.(data!.callType)}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          12,
          padding:      '12px 16px',
          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background:   isMine ? '#0d6efd' : '#f0f2f5',
          color:        isMine ? '#fff' : '#212529',
          boxShadow:    '0 1px 3px rgba(0,0,0,.1)',
          cursor:       isClickable ? 'pointer' : 'default',
          minWidth:     220,
          maxWidth:     300,
          transition:   'filter .15s',
          userSelect:   'none',
        }}
        onMouseEnter={e => {
          if (isClickable) e.currentTarget.style.filter = 'brightness(.93)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.filter = 'none';
        }}
      >
        {/* Cercle icône */}
        <div style={{
          width:          44,
          height:         44,
          borderRadius:   '50%',
          flexShrink:     0,
          background:     isMine
            ? 'rgba(255,255,255,.18)'
            : (data.status === 'Missed' || data.status === 'Cancelled') && !isMine
              ? 'rgba(220,53,69,.12)'
              : 'rgba(13,110,253,.1)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <IconifyIcon
            icon={getIconName()}
            style={{
              fontSize: 22,
              color: isMine
                ? '#fff'
                : (data.status === 'Missed' || data.status === 'Cancelled') && !isMine
                  ? '#dc3545'
                  : '#0d6efd',
            }}
          />
        </div>

        {/* Textes */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight:   600,
            fontSize:     14,
            marginBottom: 3,
            color:        isMine ? '#fff' : '#212529',
          }}>
            {data.label}
          </div>
          <div style={{
            fontSize:   12,
            color:      getStatusColor(),
            fontWeight: (data.status === 'Missed' || data.status === 'Cancelled') && !isMine ? 700 : 400,
          }}>
            {getStatusText()}
          </div>
        </div>

        {/* Heure */}
        <div style={{
          fontSize:   10,
          color:      isMine ? 'rgba(255,255,255,.55)' : '#adb5bd',
          alignSelf:  'flex-end',
          flexShrink: 0,
          marginLeft: 4,
        }}>
          {fmtHeure(dateEnvoi)}
        </div>
      </div>
    </li>
  );
};

export default CallBubble;
