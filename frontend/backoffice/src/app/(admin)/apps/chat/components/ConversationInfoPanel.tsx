import React, { useState } from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import { Conversation, ChatMessage } from '@/services/chatService';
import { getFirstTwoLetters } from '@/utils/change-casing';
import { getFileExtensionIcon } from '@/utils/get-icons';

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

interface InfoPanelProps {
  open:          boolean;
  onClose:       () => void;
  conversation:  Conversation;
  messages:      ChatMessage[];
  currentUserId: string;
  isUserOnline:  (id: number) => boolean;
}

const normalizeId = (id: any) => String(id ?? '').trim();

const Section: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="info-panel__section">
    <div className="info-panel__section-header">
      <IconifyIcon icon={icon} style={{ fontSize: 15 }} />
      {title}
    </div>
    {children}
  </div>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <p className="info-panel__empty">{label}</p>
);

export const ConversationInfoPanel: React.FC<InfoPanelProps> = ({
  open, onClose, conversation, messages, currentUserId, isUserOnline,
}) => {
  const [muteNotifs, setMuteNotifs] = useState(false);
  const isGroup = conversation.typeConversation === 'GROUPE';

  const otherParticipant = isGroup
    ? null
    : conversation.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId));

  const displayName = isGroup
    ? conversation.titre || 'Groupe'
    : otherParticipant?.utilisateur
      ? `${otherParticipant.utilisateur.prenom} ${otherParticipant.utilisateur.nom}`
      : 'Utilisateur';

  const isOnline = otherParticipant ? isUserOnline(otherParticipant.utilisateurId) : false;

  const sharedImages = messages.filter(m => m.typeMessage === 'IMAGE' && m.cheminFichier);
  const sharedFiles  = messages.filter(m => m.typeMessage === 'FICHIER' && m.nomFichier);
  const pinnedMsgs   = messages.filter(m => (m as any).epingle === true);

  return (
    <>
      {open && <div className="info-panel__overlay" onClick={onClose} />}

      <div className={`info-panel${open ? ' info-panel--open' : ''}`}>

        {/* Header */}
        <div className="info-panel__header">
          <h6 className="info-panel__title">Informations</h6>
          <button className="info-panel__close-btn" onClick={onClose}>
            <IconifyIcon icon="tabler:x" style={{ fontSize: 20 }} />
          </button>
        </div>

        <SimplebarReactClient style={{ flex: 1 }}>

          {/* Avatar + Name */}
          <div className="info-panel__hero">
            <div className={`info-panel__avatar info-panel__avatar--${isGroup ? 'group' : 'private'}`}>
              {(() => {
                if (isGroup) return <IconifyIcon icon="tabler:users" style={{ fontSize: 32 }} />;
                const photo = otherParticipant?.utilisateur?.photo || otherParticipant?.utilisateur?.photoUrl;
                return photo
                  ? <img src={`${API_URL}${photo}`} alt="avatar" className="h-100 w-100 rounded-circle" style={{ objectFit: 'cover' }}  onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  : getFirstTwoLetters(displayName);
              })()}
            </div>
            <h5 className="info-panel__name">{displayName}</h5>
            {!isGroup && (
              <span className={`info-panel__status info-panel__status--${isOnline ? 'online' : 'offline'}`}>
                <span className={`info-panel__status-dot${isOnline ? ' info-panel__status-dot--on' : ''}`} />
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            )}
            {isGroup && (
              <span className="info-panel__group-count">{conversation.participants.length} participants</span>
            )}
          </div>

          <hr style={{ margin: '0 16px', borderColor: 'var(--bs-border-color)' }} />

          {/* Shared Media */}
          <Section icon="tabler:photo" title={`Médias (${sharedImages.length})`}>
            {sharedImages.length === 0 ? (
              <EmptyState label="Aucun média partagé" />
            ) : (
              <div className="info-panel__media-grid">
                {sharedImages.slice(0, 9).map(m => (
                  <a key={m.idMessage} href={`${API_URL}${m.cheminFichier}`} target="_blank" rel="noopener noreferrer">
                    <img src={`${API_URL}${m.cheminFichier}`} alt="" className="info-panel__media-img"  onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </a>
                ))}
              </div>
            )}
          </Section>

          <hr style={{ margin: '0 16px', borderColor: 'var(--bs-border-color)' }} />

          {/* Shared Files */}
          <Section icon="tabler:file" title={`Fichiers (${sharedFiles.length})`}>
            {sharedFiles.length === 0 ? (
              <EmptyState label="Aucun fichier partagé" />
            ) : (
              <div className="info-panel__files">
                {sharedFiles.slice(0, 5).map(m => (
                  <a
                    key={m.idMessage}
                    href={`${API_URL}${m.cheminFichier}`}
                    target="_blank" rel="noopener noreferrer"
                    className="info-panel__file-item"
                  >
                    <IconifyIcon icon={getFileExtensionIcon(m.nomFichier!)} className="info-panel__file-icon" />
                    <span className="info-panel__file-name">{m.nomFichier}</span>
                  </a>
                ))}
              </div>
            )}
          </Section>

          <hr style={{ margin: '0 16px', borderColor: 'var(--bs-border-color)' }} />

          {/* Pinned Messages */}
          <Section icon="tabler:pin" title={`Épinglés (${pinnedMsgs.length})`}>
            {pinnedMsgs.length === 0 ? (
              <EmptyState label="Aucun message épinglé" />
            ) : (
              <div className="info-panel__pinned-list">
                {pinnedMsgs.map(m => (
                  <div key={m.idMessage} className="info-panel__pinned-item">
                    <div className="info-panel__pinned-author">{m.nomExpediteur || 'Utilisateur'}</div>
                    <div className="info-panel__pinned-text">{m.contenu}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Participants (groups only) */}
          {isGroup && (
            <>
              <hr style={{ margin: '0 16px', borderColor: 'var(--bs-border-color)' }} />
              <Section icon="tabler:users" title={`Participants (${conversation.participants.length})`}>
                <div className="info-panel__participants">
                  {conversation.participants.map(p => {
                    const name   = p.utilisateur ? `${p.utilisateur.prenom} ${p.utilisateur.nom}` : `Utilisateur #${p.utilisateurId}`;
                    const online = isUserOnline(p.utilisateurId);
                    const photo  = p.utilisateur?.photo || p.utilisateur?.photoUrl;
                    return (
                      <div key={p.utilisateurId} className="info-panel__participant">
                        <div className="info-panel__p-avatar-wrap">
                          <div className="info-panel__p-avatar">
                            {photo
                              ? <img src={`${API_URL}${photo}`} alt="avatar" className="h-100 w-100 rounded-circle" style={{ objectFit: 'cover' }}  onError={(e) => { e.currentTarget.style.display = 'none' }} />
                              : getFirstTwoLetters(name)}
                          </div>
                          <span className={`info-panel__p-online${online ? ' info-panel__p-online--on' : ''}`} />
                        </div>
                        <div>
                          <div className="info-panel__p-name">{name}</div>
                          <div className="info-panel__p-status">{online ? 'En ligne' : 'Hors ligne'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
          )}

          <hr style={{ margin: '0 16px', borderColor: 'var(--bs-border-color)' }} />

          {/* Actions */}
          <div className="info-panel__actions">
            <div className="info-panel__action-row">
              <div className="info-panel__action-label">
                <IconifyIcon icon={muteNotifs ? 'tabler:bell-off' : 'tabler:bell'} className="info-panel__action-icon" />
                Réduire les notifications
              </div>
              <div
                className={`info-panel__toggle${muteNotifs ? ' info-panel__toggle--on' : ''}`}
                onClick={() => setMuteNotifs(v => !v)}
              >
                <div className={`info-panel__toggle-thumb${muteNotifs ? ' info-panel__toggle-thumb--on' : ''}`} />
              </div>
            </div>

            <button className="info-panel__danger-btn">
              <IconifyIcon icon="tabler:ban" className="info-panel__action-icon" />
              Bloquer / Signaler
            </button>
          </div>

        </SimplebarReactClient>
      </div>
    </>
  );
};
