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
  contenu:       string;
  isMine:        boolean;
  dateEnvoi:     string;
  currentUserId: string;
  onCallback?:   (callType: 'audio' | 'video') => void;
}

const fmtHeure = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const formatDuration = (s: number): string => {
  if (s < 60) return `${s} seconde${s > 1 ? 's' : ''}`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m} min ${sec} sec` : `${m} minute${m > 1 ? 's' : ''}`;
};

export const CallBubble: React.FC<CallBubbleProps> = ({ contenu, isMine, dateEnvoi, onCallback }) => {
  let data: CallData | null = null;
  try { data = JSON.parse(contenu); } catch { return null; }
  if (!data) return null;

  const isVideo = data.callType === 'video';
  const isMissed = data.status === 'Missed' || data.status === 'Cancelled';
  const isClickable = !isMine && data.status !== 'Completed';

  const getStatusText = (): string => {
    switch (data!.status) {
      case 'Missed':
      case 'Cancelled': return isMine ? 'Appel annulé' : 'Appel manqué — Cliquez pour rappeler';
      case 'Declined':  return isMine ? 'Appel refusé' : 'Vous avez refusé';
      case 'Completed': return formatDuration(data!.durationSeconds);
      default: return '';
    }
  };

  const iconName = data.status === 'Completed'
    ? (isVideo ? 'tabler:video' : 'tabler:phone-call')
    : (isVideo ? 'tabler:video-off' : 'tabler:phone-off');

  const statusMod = data.status === 'Completed'
    ? (isMine ? '--mine' : '--completed')
    : (isMissed && !isMine ? '--missed' : (isMine ? '--mine' : ''));

  const iconCircleMod = isMine ? '--mine' : (isMissed ? '--missed' : '');
  const iconMod       = isMine ? '--mine' : (isMissed ? '--missed' : '');

  return (
    <li className={`call-bubble${isMine ? ' call-bubble--mine' : ''}`}>
      <div
        className={`call-bubble__card${isMine ? ' call-bubble__card--mine' : ''}${isClickable ? ' call-bubble__card--clickable' : ''}`}
        onClick={() => isClickable && onCallback?.(data!.callType)}
      >
        {/* Icon circle */}
        <div className={`call-bubble__icon-circle${iconCircleMod ? ` call-bubble__icon-circle${iconCircleMod}` : ''}`}>
          <IconifyIcon
            icon={iconName}
            className={`call-bubble__icon${iconMod ? ` call-bubble__icon${iconMod}` : ''}`}
          />
        </div>

        {/* Texts */}
        <div className="call-bubble__texts">
          <div className={`call-bubble__label${isMine ? ' call-bubble__label--mine' : ''}`}>
            {data.label}
          </div>
          <div className={`call-bubble__status${statusMod ? ` call-bubble__status${statusMod}` : ''}`}>
            {getStatusText()}
          </div>
        </div>

        {/* Time */}
        <div className={`call-bubble__time${isMine ? ' call-bubble__time--mine' : ''}`}>
          {fmtHeure(dateEnvoi)}
        </div>
      </div>
    </li>
  );
};

export default CallBubble;
