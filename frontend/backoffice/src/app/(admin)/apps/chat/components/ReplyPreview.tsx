import React from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

interface ReplyPreviewProps {
  nom:      string;
  contenu:  string;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ nom, contenu, onCancel }) => (
  <div className="reply-preview">
    <IconifyIcon icon="tabler:arrow-back-up" className="reply-preview__icon" />
    <div className="reply-preview__body">
      <div className="reply-preview__name">{nom}</div>
      <div className="reply-preview__text">{contenu}</div>
    </div>
    <button className="reply-preview__cancel" onClick={onCancel} title="Annuler la réponse">
      <IconifyIcon icon="tabler:x" style={{ fontSize: 16 }} />
    </button>
  </div>
);
