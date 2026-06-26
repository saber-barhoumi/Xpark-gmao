import React from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

interface ReplyPreviewProps {
  nom:     string;
  contenu: string;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  nom, contenu, onCancel
}) => (
  <div style={{
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    padding:        '8px 14px',
    background:     'var(--bs-light, #f8f9fa)',
    borderTop:      '1px solid var(--bs-border-color, #dee2e6)',
    borderLeft:     '3px solid var(--bs-primary, #0d6efd)',
    margin:         '0 12px',
    borderRadius:   '6px 6px 0 0',
  }}>
    {/* Icône réponse */}
    <IconifyIcon
      icon="tabler:arrow-back-up"
      style={{ fontSize: 16, color: 'var(--bs-primary)', flexShrink: 0 }}
    />

    {/* Texte citation */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize:     11,
        fontWeight:   600,
        color:        'var(--bs-primary)',
        marginBottom: 1,
      }}>
        {nom}
      </div>
      <div style={{
        fontSize:     12,
        color:        'var(--bs-secondary-color, #6c757d)',
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        maxWidth:     400,
      }}>
        {contenu}
      </div>
    </div>

    {/* Bouton annuler la réponse */}
    <button
      onClick={onCancel}
      style={{
        background: 'none',
        border:     'none',
        cursor:     'pointer',
        padding:    4,
        display:    'flex',
        color:      'var(--bs-secondary-color)',
        flexShrink: 0,
      }}
      title="Annuler la réponse"
    >
      <IconifyIcon icon="tabler:x" style={{ fontSize: 16 }} />
    </button>
  </div>
);
