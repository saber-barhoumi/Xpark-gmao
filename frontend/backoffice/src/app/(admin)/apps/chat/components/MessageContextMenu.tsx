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
  isMine:   boolean;
  onAction: (action: MessageAction, messageId: number) => void;
  onClose:  () => void;
}

export const MessageContextMenu: React.FC<Props> = ({ menu, isMine, onAction, onClose }) => {
  if (!menu.visible || !menu.messageId) return null;

  return (
    <>
      <div className="msg-ctx-overlay" onMouseDown={onClose} />

      <div
        className="msg-ctx-menu"
        onMouseDown={e => e.stopPropagation()}
        style={{ top: menu.y, left: menu.x }}
      >
        {MENU_ITEMS
          .filter(item => !(item.action === 'delete' && !isMine))
          .map(item => (
            <React.Fragment key={item.action}>
              {item.action === 'delete' && <div className="msg-ctx-menu__sep" />}
              <button
                className={`msg-ctx-menu__item${item.danger ? ' msg-ctx-menu__item--danger' : ''}`}
                onClick={() => { onAction(item.action, menu.messageId!); onClose(); }}
              >
                <IconifyIcon icon={item.icon} className="msg-ctx-menu__icon" />
                {item.label}
              </button>
            </React.Fragment>
          ))}
      </div>
    </>
  );
};
