import React, { useState } from 'react';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import { Conversation, ChatMessage } from '@/services/chatService';
import { getFirstTwoLetters } from '@/utils/change-casing';
import { getFileExtensionIcon } from '@/utils/get-icons';

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/api\/?$/, '');

interface InfoPanelProps {
  open:          boolean;
  onClose:       () => void;
  conversation:  Conversation;
  messages:      ChatMessage[];
  currentUserId: string;
  isUserOnline:  (id: number) => boolean;
}

const normalizeId = (id: any) => String(id ?? '').trim();

// ── Sub-components ──
const Section: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div style={{ padding: '12px 0 0' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 16px 8px',
      fontSize: 12, fontWeight: 600,
      color: '#6c757d', textTransform: 'uppercase', letterSpacing: '.5px',
    }}>
      <IconifyIcon icon={icon} style={{ fontSize: 15 }} />
      {title}
    </div>
    {children}
  </div>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <p style={{ fontSize: 13, color: '#adb5bd', padding: '0 16px 8px', margin: 0 }}>
    {label}
  </p>
);

export const ConversationInfoPanel: React.FC<InfoPanelProps> = ({
  open, onClose, conversation, messages, currentUserId, isUserOnline,
}) => {
  const [muteNotifs, setMuteNotifs] = useState(false);
  const isGroup = conversation.typeConversation === 'GROUPE';

  const otherParticipant = isGroup
    ? null
    : conversation.participants.find(
        p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId)
      );

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
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1040,
            background: 'rgba(0,0,0,.2)',
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, height: '100%',
        width: 320,
        background: 'var(--bs-body-bg, #fff)',
        borderLeft: '1px solid var(--bs-border-color, #dee2e6)',
        zIndex: 1050,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '-8px 0 32px rgba(0,0,0,.08)' : 'none',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
        }}>
          <h6 style={{ margin: 0, fontWeight: 600 }}>Informations</h6>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6c757d' }}>
            <IconifyIcon icon="tabler:x" style={{ fontSize: 20 }} />
          </button>
        </div>

        <SimplebarReactClient style={{ flex: 1 }}>

          {/* Avatar + Name + Status */}
          <div style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: isGroup ? '#ffc107' : '#0dcaf0',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700,
              margin: '0 auto 12px',
              overflow: 'hidden'
            }}>
              {(() => {
                if (isGroup) return <IconifyIcon icon="tabler:users" style={{ fontSize: 32 }} />;
                const photo = otherParticipant?.utilisateur?.photo || otherParticipant?.utilisateur?.photoUrl;
                return photo ? (
                  <img 
                    src={`${API_URL}${photo}`} 
                    alt="avatar" 
                    className="h-100 w-100 rounded-circle" 
                    style={{ objectFit: 'cover' }} 
                  />
                ) : (
                  getFirstTwoLetters(displayName)
                );
              })()}
            </div>
            <h5 style={{ margin: '0 0 4px', fontWeight: 600 }}>{displayName}</h5>
            {!isGroup && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: isOnline ? '#198754' : '#6c757d',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isOnline ? '#198754' : '#dee2e6',
                  display: 'inline-block',
                }} />
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            )}
            {isGroup && (
              <span style={{ fontSize: 12, color: '#6c757d' }}>
                {conversation.participants.length} participants
              </span>
            )}
          </div>

          <hr style={{ margin: '0 16px', borderColor: 'var(--bs-border-color)' }} />

          {/* Shared Media */}
          <Section icon="tabler:photo" title={`Médias (${sharedImages.length})`}>
            {sharedImages.length === 0 ? (
              <EmptyState label="Aucun média partagé" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, padding: '0 16px 8px' }}>
                {sharedImages.slice(0, 9).map(m => (
                  <a key={m.idMessage} href={`${API_URL}${m.cheminFichier}`} target="_blank" rel="noopener noreferrer">
                    <img
                      src={`${API_URL}${m.cheminFichier}`}
                      alt=""
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6 }}
                    />
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
              <div style={{ padding: '0 16px 8px' }}>
                {sharedFiles.slice(0, 5).map(m => (
                  <a
                    key={m.idMessage}
                    href={`${API_URL}${m.cheminFichier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 0',
                      borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
                      textDecoration: 'none', color: 'inherit', fontSize: 13,
                    }}
                  >
                    <IconifyIcon icon={getFileExtensionIcon(m.nomFichier!)} style={{ fontSize: 22, flexShrink: 0, color: '#0d6efd' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.nomFichier}
                    </span>
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
              <div style={{ padding: '0 16px 8px' }}>
                {pinnedMsgs.map(m => (
                  <div key={m.idMessage} style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: 'var(--bs-light, #f8f9fa)',
                    marginBottom: 6, fontSize: 13,
                    borderLeft: '3px solid #0d6efd',
                  }}>
                    <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 2 }}>
                      {m.nomExpediteur || 'Utilisateur'}
                    </div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.contenu}
                    </div>
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
                <div style={{ padding: '0 16px 8px' }}>
                  {conversation.participants.map(p => {
                    const name = p.utilisateur
                      ? `${p.utilisateur.prenom} ${p.utilisateur.nom}`
                      : `Utilisateur #${p.utilisateurId}`;
                    const online = isUserOnline(p.utilisateurId);
                    return (
                      <div key={p.utilisateurId} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '6px 0',
                        borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
                      }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: '#0dcaf0', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                            overflow: 'hidden'
                          }}>
                            {(() => {
                              const photo = p.utilisateur?.photo || p.utilisateur?.photoUrl;
                              return photo ? (
                                <img 
                                  src={`${API_URL}${photo}`} 
                                  alt="avatar" 
                                  className="h-100 w-100 rounded-circle" 
                                  style={{ objectFit: 'cover' }} 
                                />
                              ) : (
                                getFirstTwoLetters(name)
                              )
                            })()}
                          </div>
                          <span style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 9, height: 9, borderRadius: '50%',
                            background: online ? '#198754' : '#dee2e6',
                            border: '2px solid white',
                          }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
                          <div style={{ fontSize: 11, color: '#6c757d' }}>
                            {online ? 'En ligne' : 'Hors ligne'}
                          </div>
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
          <div style={{ padding: '8px 16px 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <IconifyIcon icon={muteNotifs ? 'tabler:bell-off' : 'tabler:bell'} style={{ fontSize: 18, color: '#6c757d' }} />
                Réduire les notifications
              </div>
              <div
                onClick={() => setMuteNotifs(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: muteNotifs ? '#0d6efd' : '#dee2e6',
                  position: 'relative', transition: 'background .2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 2, left: muteNotifs ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>

            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '10px 0',
              background: 'none', border: 'none',
              fontSize: 14, color: '#dc3545', cursor: 'pointer',
            }}>
              <IconifyIcon icon="tabler:ban" style={{ fontSize: 18 }} />
              Bloquer / Signaler
            </button>
          </div>
        </SimplebarReactClient>
      </div>
    </>
  );
};
