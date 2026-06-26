import React from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { ContextMenuState } from '../hooks/useContextMenu';

export type MessageAction = 'reply' | 'copy' | 'delete' | 'forward' | 'pin';

interface MenuItem {
  action:  MessageAction;
  label:   string;
  icon:    string;
  danger?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { action: 'reply',   label: 'Répondre',   icon: 'tabler:arrow-back-up' },
  { action: 'copy',    label: 'Copier',     icon: 'tabler:copy' },
  { action: 'pin',     label: 'Épingler',   icon: 'tabler:pin' },
  { action: 'forward', label: 'Transférer', icon: 'tabler:arrow-forward-up' },
  { action: 'delete',  label: 'Supprimer',  icon: 'tabler:trash', danger: true },
];

interface Props {
  menu:     ContextMenuState;
  isMine:   boolean;           // Pour masquer "Supprimer" si pas le sien
  onAction: (action: MessageAction, messageId: number) => void;
  onClose:  () => void;
}

export const MessageContextMenu: React.FC<Props> = ({
  menu, isMine, onAction, onClose
}) => {
  if (!menu.visible || !menu.messageId) return null;

  return (
    <>
      {/* Overlay invisible pour capturer les clics extérieurs */}
      <div
        style={{
          position: 'fixed', inset: 0,
          zIndex: 9998,
        }}
        onMouseDown={onClose}
      />

      {/* Menu flottant */}
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          position:    'fixed',
          top:         menu.y,
          left:        menu.x,
          zIndex:      9999,
          minWidth:    176,
          background:  'var(--bs-body-bg, #fff)',
          border:      '1px solid var(--bs-border-color, #dee2e6)',
          borderRadius: 10,
          boxShadow:   '0 8px 24px rgba(0,0,0,.12)',
          overflow:    'hidden',
          animation:   'ctxFadeIn .12s ease',
        }}
      >
        {MENU_ITEMS
          // Masquer "Supprimer" pour les messages des autres
          .filter(item => !(item.action === 'delete' && !isMine))
          .map((item, i, arr) => (
            <React.Fragment key={item.action}>
              {/* Séparateur avant Supprimer */}
              {item.action === 'delete' && (
                <div style={{
                  height: 1,
                  background: 'var(--bs-border-color, #dee2e6)',
                  margin: '2px 0'
                }} />
              )}

              <button
                onClick={() => {
                  onAction(item.action, menu.messageId!);
                  onClose();
                }}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            10,
                  width:          '100%',
                  padding:        '9px 14px',
                  border:         'none',
                  background:     'transparent',
                  cursor:         'pointer',
                  fontSize:       13,
                  color:          item.danger
                                    ? 'var(--bs-danger, #dc3545)'
                                    : 'var(--bs-body-color, #212529)',
                  textAlign:      'left',
                  transition:     'background .1s',
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background =
                    item.danger ? '#fff5f5' : 'var(--bs-light, #f8f9fa)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <IconifyIcon
                  icon={item.icon}
                  style={{
                    fontSize: 16,
                    color: item.danger ? 'var(--bs-danger)' : 'var(--bs-secondary)',
                    flexShrink: 0,
                  }}
                />
                {item.label}
              </button>
            </React.Fragment>
          ))}
      </div>

      {/* Animation CSS injectée une seule fois */}
      <style>{`
        @keyframes ctxFadeIn {
          from { opacity: 0; transform: scale(.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
      `}</style>
    </>
  );
};
