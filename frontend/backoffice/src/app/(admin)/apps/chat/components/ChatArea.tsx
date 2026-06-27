
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import EmojiPicker from '@emoji-mart/react';
import api from '@/lib/axiosConfig';
import data from '@emoji-mart/data';
import ConfirmModal from '@/components/ConfirmModal';
import { Card, CardHeader, Col, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap';

import { useLayoutContext } from '@/context/useLayoutContext';
import { useChatContext } from '@/context/useChatContext';
import { Conversation, ChatMessage } from '@/services/chatService';
import { getFirstTwoLetters } from '@/utils/change-casing';
import { getFileExtensionIcon } from '@/utils/get-icons';

import { useContextMenu } from '../hooks/useContextMenu';
import { MessageContextMenu, MessageAction } from './MessageContextMenu';
import { ReplyPreview } from './ReplyPreview';
import { ConversationInfoPanel } from './ConversationInfoPanel';
import { CallBubble } from './CallBubble';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallModal } from './CallModal';
import { useCallRingtone } from '../hooks/useCallRingtone';

// ── Helpers ────────────────────────────────────────────────────────────
const getInitiales = (nom: string) => {
  const parts = (nom ?? '').trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const fmtHeure = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// ── Composant bulle message ─────────────────────────────────────────────
interface BubbleProps {
  message:       ChatMessage;
  currentUserId: string;
  onContextMenu: (e: React.MouseEvent, id: number, isMine: boolean) => void;
  isHighlighted: boolean;
  messages:      ChatMessage[];
}

const normalizeId = (id: any): string =>
  String(id ?? '').toLowerCase().trim();

const MessageBubble: React.FC<BubbleProps> = ({
  message, currentUserId, onContextMenu, isHighlighted, messages
}) => {
  const isMine = normalizeId(message.expediteurId) === normalizeId(currentUserId);
  const nom = message.expediteur
    ? `${message.expediteur.prenom} ${message.expediteur.nom}`
    : message.nomExpediteur || 'Utilisateur';

  const init = getInitiales(nom);
  
  // Resolve reply
  const repliedMsg = message.reponseAMessageId 
    ? messages.find(m => String(m.idMessage) === String(message.reponseAMessageId)) 
    : null;

  const repliedName = repliedMsg 
    ? (normalizeId(repliedMsg.expediteurId) === normalizeId(currentUserId) ? 'Vous' : (repliedMsg.expediteur ? `${repliedMsg.expediteur.prenom} ${repliedMsg.expediteur.nom}` : repliedMsg.nomExpediteur || 'Utilisateur'))
    : '';

  if (message.estSupprime) {
    return (
      <li className={`d-flex mb-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
        <div style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #dee2e6', fontSize: 13, color: '#6c757d', fontStyle: 'italic' }}>
          🚫 Ce message a été supprimé
        </div>
      </li>
    );
  }

  return (
    <li
      id={`msg-${message.idMessage}`}
      style={{
        display:        'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom:   6,
        padding:        '2px 12px',
        transition:     'background .3s',
        background:     isHighlighted ? 'rgba(13,110,253,.08)' : 'transparent',
        borderRadius:   8,
      }}
    >
      {/* Avatar gauche (messages reçus) */}
      {!isMine && (
        <div style={{ marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: '#0d6efd22',
            color: '#0d6efd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {message.expediteur?.photo || message.expediteur?.photoUrl ? (
              <img 
                src={`${API_URL}${message.expediteur.photo || message.expediteur.photoUrl}`} 
                alt="avatar" 
                className="h-100 w-100 rounded-circle" 
                style={{ objectFit: 'cover' }} 
              />
            ) : (
              init
            )}
          </div>
        </div>
      )}

      {/* Colonne bulle + méta */}
      <div style={{
        maxWidth:   '68%',
        display:    'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
      }}>
        {/* Nom expéditeur (messages reçus seulement) */}
        {!isMine && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: '#6c757d',
            marginBottom: 3, paddingLeft: 4,
          }}>
            {nom}
          </span>
        )}

        {/* Bulle principale */}
        <div
          onContextMenu={e => onContextMenu(e, message.idMessage, isMine)}
          style={{
            padding:      '9px 14px',
            borderRadius: isMine
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            background:   isMine ? '#0d6efd' : '#f0f2f5',
            color:        isMine ? '#fff'    : '#212529',
            boxShadow:    '0 1px 2px rgba(0,0,0,.08)',
            cursor:       'context-menu',
            wordBreak:    'break-word',
            userSelect:   'text',
          }}
        >
          {/* Citation (répondre à) */}
          {repliedMsg && (
            <div style={{
              borderLeft:   `3px solid ${isMine ? 'rgba(255,255,255,.5)' : '#0d6efd'}`,
              paddingLeft:  8,
              marginBottom: 6,
              opacity:      0.85,
            }}>
              <div style={{
                fontSize:   10,
                fontWeight: 700,
                color:      isMine ? 'rgba(255,255,255,.8)' : '#0d6efd',
                marginBottom: 1,
              }}>
                {repliedName}
              </div>
              <div style={{
                fontSize:     12,
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                maxWidth:     220,
                color:        isMine ? 'rgba(255,255,255,.75)' : '#495057',
              }}>
                {repliedMsg.typeMessage === 'IMAGE' ? '📷 Photo' : 
                 repliedMsg.typeMessage === 'FICHIER' ? '📎 Fichier' : 
                 repliedMsg.contenu}
              </div>
            </div>
          )}

          {/* Contenu : Image */}
          {message.typeMessage === 'IMAGE' && message.cheminFichier && (
            <img
              src={`${API_URL}${message.cheminFichier}`}
              alt="image"
              style={{
                maxWidth: 200, maxHeight: 200,
                borderRadius: 8, display: 'block',
                marginBottom: 4
              }}
            />
          )}

          {/* Contenu : Fichier */}
          {message.typeMessage === 'FICHIER' && message.nomFichier && (
            <div className="d-flex align-items-center mb-1 bg-white bg-opacity-10 p-2 rounded" style={{ border: isMine ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.05)' }}>
              <IconifyIcon icon={getFileExtensionIcon(message.nomFichier)} className="fs-24 me-2" />
              <div className="flex-grow-1 overflow-hidden">
                <a href={`${API_URL}${message.cheminFichier}`} target="_blank" rel="noopener noreferrer" className={`text-truncate d-block ${isMine ? 'text-white' : 'text-primary'}`} style={{ fontSize: 13 }}>
                  {message.nomFichier}
                </a>
              </div>
            </div>
          )}

          {/* Contenu : Texte */}
          {(message.typeMessage === 'TEXTE' || !message.typeMessage) && (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {message.contenu}
            </p>
          )}
          
          {message.typeMessage === 'SYSTEME' && (
            <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', opacity: 0.8 }}>
              {message.contenu}
            </p>
          )}

        </div>

        {/* Heure + statut lu */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        3,
          marginTop:  3,
          paddingLeft: isMine ? 0 : 4,
          paddingRight: isMine ? 4 : 0,
        }}>
          <span style={{ fontSize: 10, color: '#adb5bd' }}>
            {fmtHeure(message.dateEnvoi)}
          </span>
          {isMine && (
            <span style={{
              fontSize: 12,
              color: message.estLu ? '#0d6efd' : '#adb5bd',
            }}>
              {message.estLu ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

// ── Composant séparateur de date ────────────────────────────────────────
const DateSeparator: React.FC<{ date: string }> = ({ date }) => (
  <li style={{
    display:        'flex',
    alignItems:     'center',
    gap:            12,
    padding:        '12px 16px',
    listStyle:      'none',
  }}>
    <div style={{ flex: 1, height: 1, background: '#dee2e6' }} />
    <span style={{
      fontSize:     11,
      color:        '#adb5bd',
      whiteSpace:   'nowrap',
      padding:      '3px 10px',
      background:   '#f8f9fa',
      borderRadius: 20,
      border:       '1px solid #dee2e6',
    }}>
      {fmtDate(date)}
    </span>
    <div style={{ flex: 1, height: 1, background: '#dee2e6' }} />
  </li>
);

// ── COMPOSANT PRINCIPAL ChatArea ────────────────────────────────────────
type ChatAreaProps = {
  conversation: Conversation;
  messages: ChatMessage[];
  onSendMessage: (content: string, type?: string, reponseAMessageId?: number) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  isUserTyping: boolean;
  isUserOnline: (userId: number) => boolean;
  onDeleteMessage?: (id: number) => void;
  onPinMessage?: (id: number) => void;
  conversationsList: Conversation[];
  currentUserId: string;
  refreshConversations?: () => void;
};

const ChatArea = ({
  conversation,
  messages,
  onSendMessage,
  onSendFile,
  onTyping,
  isUserTyping,
  currentUserId,
  isUserOnline,
  onDeleteMessage,
  onPinMessage,
  conversationsList,
  refreshConversations,
}: ChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo]       = useState<ChatMessage | null>(null);
  const [showInfo, setShowInfo]     = useState(false);

  // WebRTC calls
  const {
    callState, callType, duration: callDuration,
    localStream, remoteStream,
    incomingCall,
    isMuted, isCamOff,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera,
    setConversationId: setCallConvId,
  } = useWebRTC(currentUserId);

  // Auto-play ringtone based on call state
  useCallRingtone({ callState });

  // Set conversationId for call history
  useEffect(() => {
    setCallConvId(conversation.idConversation);
  }, [conversation.idConversation, setCallConvId]);

  // 30s timeout for unanswered calls
  useEffect(() => {
    if (callState !== 'calling') return;
    const timeout = setTimeout(() => {
      endCall('Missed', conversation.idConversation);
    }, 30_000);
    return () => clearTimeout(timeout);
  }, [callState, conversation.idConversation, endCall]);
  const [typingTimeout, setTypingTimeoutState] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simplebarRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { theme } = useLayoutContext();
  const { chatList, chatSetting } = useChatContext();

  // ── Menu contextuel ───────────────────────────────────────────────
  const { menu, openMenu, closeMenu } = useContextMenu();

  // ── Surbrillance ──────────────────────────────────────────────────
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Get display name
  const otherParticipant = conversation.typeConversation === 'PRIVEE'
    ? conversation.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))
    : null;

  const displayName = conversation.typeConversation === 'GROUPE'
    ? conversation.titre || 'Groupe'
    : otherParticipant?.utilisateur
      ? `${otherParticipant.utilisateur.prenom} ${otherParticipant.utilisateur.nom}`
      : 'Utilisateur';

  const isOnline = otherParticipant ? isUserOnline(otherParticipant.utilisateurId) : false;

  // ── Scroll intelligent ────────────────────────────────────────────
  const isNearBottomRef = useRef(true);
  const prevConvIdRef = useRef<number | null>(null);
  const prevMsgCountRef = useRef(0);

  // Attach scroll tracking to Simplebar's actual scroll element (not the wrapper div)
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    const timer = setTimeout(() => {
      const el = simplebarRef.current?.getScrollElement?.();
      if (!el) return;
      const handler = () => {
        isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
      };
      el.addEventListener('scroll', handler, { passive: true });
      removeListener = () => el.removeEventListener('scroll', handler);
    }, 200);
    return () => { clearTimeout(timer); removeListener?.(); };
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !isNearBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (conversation.idConversation !== prevConvIdRef.current) {
      prevConvIdRef.current = conversation.idConversation;
      isNearBottomRef.current = true;
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [conversation.idConversation, scrollToBottom]);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom]);

  const scrollToMessage = useCallback((id: number) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 1500);
  }, []);

  // ── Envoi message ─────────────────────────────────────────────────
  const handleSend = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    onSendMessage(trimmed, 'TEXTE', replyTo?.idMessage);
    setInputValue('');
    setReplyTo(null);
    onTyping(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    scrollToBottom(true);
  }, [inputValue, replyTo, onSendMessage, onTyping, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    
    onTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      onTyping(false);
    }, 3000);
    setTypingTimeoutState(timeout);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
      e.target.value = '';
      scrollToBottom(true);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setInputValue(prev => prev + emoji.native);
  };

  // ── Toast simple ───────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Modal Transférer ──────────────────────────────────────────────
  const [forwardModal, setForwardModal] = useState<number | null>(null); // messageId à transférer
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null); // messageId à supprimer

  // ── Actions menu contextuel ───────────────────────────────────────
  const handleAction = useCallback(async (action: MessageAction, messageId: number) => {
    const msg = messages.find(m => String(m.idMessage) === String(messageId));
    if (!msg) return;

    switch (action) {
      case 'reply':
        setReplyTo(msg);
        setTimeout(() => inputRef.current?.focus(), 50);
        break;
        
      case 'copy':
        try {
          await navigator.clipboard.writeText(msg.contenu);
          showToast('Message copié !');
        } catch {
          const el = document.createElement('textarea');
          el.value = msg.contenu;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          showToast('Message copié !');
        }
        break;

      case 'delete':
        setDeleteConfirm(messageId);
        break;

      case 'pin':
        if (onPinMessage) {
          onPinMessage(messageId);
          showToast(msg.epingle ? 'Message désépinglé' : 'Message épinglé 📌');
        }
        break;

      case 'forward':
        setForwardModal(messageId);
        break;
    }
  }, [messages, onDeleteMessage, onPinMessage, showToast]);

  const isMineMessage = (msgExpediteurId: any) => normalizeId(msgExpediteurId) === normalizeId(currentUserId);

  return (
    <Card className="chat-content rounded-0 shadow-none mb-0 h-100 d-flex flex-column">
      {/* Header */}
      <CardHeader className="py-2 px-3 border-bottom flex-shrink-0">
        <div className="d-flex align-items-center justify-content-between py-1">
          <div className="d-flex align-items-center gap-2">
            {chatList.open ? (
              <button onClick={chatList.toggle} className="btn btn-sm btn-icon btn-soft-primary d-none d-xl-flex me-2">
                <IconifyIcon icon='tabler:chevrons-left' className="fs-20" />
              </button>
            ) : (
              <button onClick={chatList.toggle} className="btn btn-sm btn-icon btn-soft-primary d-none d-xl-flex me-2">
                <IconifyIcon icon='tabler:chevrons-right' className="fs-20" />
              </button>
            )}
            <button onClick={chatSetting.toggle} className="btn btn-sm btn-icon btn-ghost-light text-dark d-xxl-none d-flex" type="button">
              <IconifyIcon icon='tabler:menu-2' className="fs-20" />
            </button>

            {conversation.typeConversation === 'GROUPE' ? (
              <div className="avatar-lg rounded-circle bg-warning text-white d-flex align-items-center justify-content-center">
                <IconifyIcon icon="tabler:users" className="fs-20" />
              </div>
            ) : (
              <div className="avatar-lg rounded-circle bg-info text-white d-flex align-items-center justify-content-center overflow-hidden">
                {(() => {
                  const other = conversation.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))?.utilisateur;
                  const photo = other?.photo || other?.photoUrl;
                  return photo ? (
                    <img 
                      src={`${API_URL}${photo}`} 
                      alt="avatar" 
                      className="h-100 w-100 rounded-circle" 
                      style={{ objectFit: 'cover' }} 
                    />
                  ) : (
                    <span className="fw-semibold">{getFirstTwoLetters(displayName)}</span>
                  );
                })()}
              </div>
            )}

            <div>
              <h5 className="my-0 lh-base">
                <span className="text-reset">{displayName}</span>
              </h5>
              <p className="mb-0 text-muted icons-center">
                {isUserTyping ? (
                  <span className="text-primary fw-semibold">
                    <IconifyIcon icon='tabler:pencil' className="me-1" />
                    en train d'écrire...
                  </span>
                ) : conversation.typeConversation === 'PRIVEE' ? (
                  <>
                    <IconifyIcon icon='tabler:circle-filled' className={`text-${isOnline ? 'success' : 'danger'} me-1`} />
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </>
                ) : (
                  <span>{conversation.participants.length} participants</span>
                )}
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-icon btn-ghost-light d-none d-xl-flex"
              title="Appel vocal"
              onClick={() => otherParticipant && startCall(otherParticipant.utilisateurId, 'audio', conversation.idConversation)}
              disabled={callState !== 'idle' || !otherParticipant}
            >
              <IconifyIcon icon='tabler:phone-call' className="fs-20" />
            </button>
            <button
              className="btn btn-sm btn-icon btn-ghost-light d-none d-xl-flex"
              title="Appel vidéo"
              onClick={() => otherParticipant && startCall(otherParticipant.utilisateurId, 'video', conversation.idConversation)}
              disabled={callState !== 'idle' || !otherParticipant}
            >
              <IconifyIcon icon='tabler:video' className="fs-20" />
            </button>
            <button
              className={`btn btn-sm btn-icon ${showInfo ? 'btn-primary' : 'btn-ghost-light'} d-xl-flex`}
              title="Infos"
              onClick={() => setShowInfo(v => !v)}
            >
              <IconifyIcon icon='tabler:info-circle' className="fs-20" />
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SimplebarReactClient ref={simplebarRef} style={{ height: '100%', padding: '8px 0' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {messages.map((msg, i) => {
              const showDate = i === 0 || !isSameDay(msg.dateEnvoi, messages[i - 1].dateEnvoi);

              return (
                <React.Fragment key={msg.idMessage}>
                  {showDate && <DateSeparator date={msg.dateEnvoi} />}
                  {msg.typeMessage === 'APPEL' ? (
                    <CallBubble
                      contenu={msg.contenu}
                      isMine={normalizeId(msg.expediteurId) === normalizeId(currentUserId)}
                      dateEnvoi={msg.dateEnvoi}
                      currentUserId={currentUserId}
                      onCallback={(callType) => {
                        if (otherParticipant) {
                          startCall(otherParticipant.utilisateurId, callType, conversation.idConversation);
                        }
                      }}
                    />
                  ) : (
                    <MessageBubble
                      message={msg}
                      currentUserId={currentUserId}
                      onContextMenu={openMenu}
                      isHighlighted={highlightedId === msg.idMessage}
                      messages={messages}
                    />
                  )}
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} style={{ height: 4 }} />
          </ul>
        </SimplebarReactClient>
      </div>

      {/* Barre de saisie */}
      <div className="p-3 border-top position-sticky bottom-0 w-100 mb-0 bg-white flex-shrink-0">
        {replyTo && (
          <ReplyPreview
            nom={replyTo.expediteur ? `${replyTo.expediteur.prenom} ${replyTo.expediteur.nom}` : replyTo.nomExpediteur || 'Utilisateur'}
            contenu={replyTo.typeMessage === 'IMAGE' ? '📷 Photo' : replyTo.typeMessage === 'FICHIER' ? '📎 Fichier' : replyTo.contenu}
            onCancel={() => setReplyTo(null)}
          />
        )}

        <form className="d-flex align-items-end gap-2 mt-2" name="chat-form" onSubmit={handleSend}>
          <Dropdown drop="up">
            <DropdownToggle type="button" className="btn btn-icon btn-soft-warning content-none flex-shrink-0 mb-1">
              <IconifyIcon icon="solar:smile-circle-outline" className="fs-20" />
            </DropdownToggle>
            <DropdownMenu className="p-0 rounded-4">
              <EmojiPicker data={data} theme={theme} onEmojiSelect={handleEmojiSelect} />
            </DropdownMenu>
          </Dropdown>
          
          <textarea
            ref={inputRef}
            className="form-control flex-grow-1"
            placeholder={replyTo ? `Répondre à ${replyTo.nomExpediteur || 'Utilisateur'}...` : "Votre message... (Entrée pour envoyer)"}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              resize: 'none',
              borderRadius: 22,
              padding: '10px 16px',
              maxHeight: 120,
              minHeight: 42
            }}
          />
          
          <div className="d-flex align-items-center gap-1 flex-shrink-0 mb-1">
            <button type="button" className="btn btn-icon btn-soft-primary" onClick={() => fileInputRef.current?.click()}>
              <IconifyIcon icon="tabler:paperclip" />
            </button>
            <button type="submit" className="btn btn-icon btn-primary text-white" disabled={!inputValue.trim()}>
              <IconifyIcon icon="tabler:send" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
            />
          </div>
        </form>
      </div>

      {/* Menu contextuel (clic droit) */}
      <MessageContextMenu
        menu={menu}
        isMine={menu.isMine}
        onAction={handleAction}
        onClose={closeMenu}
      />

      {/* Confirm delete message */}
      <ConfirmModal
        show={deleteConfirm !== null}
        title="Supprimer le message"
        message="Ce message sera définitivement supprimé pour tous les participants."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirm !== null && onDeleteMessage) onDeleteMessage(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Modal Transférer */}
      {forwardModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setForwardModal(null)}
        >
          <div
            style={{
              background: 'var(--bs-body-bg, #fff)',
              borderRadius: 12,
              padding: 24,
              width: 360,
              boxShadow: '0 16px 48px rgba(0,0,0,.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h6 style={{ marginBottom: 16, fontWeight: 600 }}>Transférer le message</h6>
            <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 16 }}>
              Sélectionnez une conversation :
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 16 }}>
              {(() => {
                const seenUserIds = new Set<string>();
                const seenConvIds = new Set<number>();

                return conversationsList
                  .filter(c => c.idConversation !== conversation.idConversation)
                  .filter(c => {
                    // Unique by idConversation
                    if (seenConvIds.has(c.idConversation)) return false;
                    seenConvIds.add(c.idConversation);

                    // Deduplicate private chats by other user ID
                    if (c.typeConversation === 'PRIVEE') {
                      const other = c.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))?.utilisateur;
                      if (!other) return true;
                      const uid = normalizeId(other.idUtilisateur);
                      if (seenUserIds.has(uid)) return false;
                      seenUserIds.add(uid);
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    const getTs = (c: any) => {
                      const d1 = c.dernierMessageDate ? new Date(c.dernierMessageDate).getTime() : 0;
                      const d2 = (c.messages?.length > 0) ? new Date(c.messages[c.messages.length - 1].dateEnvoi).getTime() : 0;
                      return Math.max(isNaN(d1) ? 0 : d1, isNaN(d2) ? 0 : d2, new Date(c.dateCreation).getTime() || 0);
                    };
                    return getTs(b) - getTs(a);
                  })
                  .map(conv => {
                    const isGroup = conv.typeConversation === 'GROUPE';
                    const other = isGroup ? null : conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))?.utilisateur;
                    const name = isGroup ? (conv.titre || 'Groupe') : (other ? `${other.prenom} ${other.nom}` : 'Conversation privée');
                    const initials = isGroup ? '👥' : getFirstTwoLetters(name);
                    
                    return (
                      <button
                        key={conv.idConversation}
                        onClick={async () => {
                          const msg = messages.find(m => String(m.idMessage) === String(forwardModal));
                          if (!msg) return;
                          try {
                            await api.post('/chat/messages/forward', {
                                messageId: forwardModal,
                                targetConvId: conv.idConversation,
                                contenu: msg.contenu,
                            });
                            showToast('Message transféré ✓');
                            setForwardModal(null);
                            if (refreshConversations) refreshConversations();
                          } catch {
                            showToast('Erreur lors du transfert', 'error');
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', textAlign: 'left',
                          padding: '10px 12px', background: 'transparent',
                          border: 'none', borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
                          fontSize: 14, color: 'var(--bs-body-color)',
                          cursor: 'pointer', transition: 'background .1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bs-light, #f8f9fa)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: isGroup ? '#ffc107' : '#0dcaf0',
                          color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: isGroup ? 16 : 12, fontWeight: 700,
                          overflow: 'hidden'
                        }}>
                          {(() => {
                            if (isGroup) return initials;
                            const photo = other?.photo || other?.photoUrl;
                            return photo ? (
                              <img 
                                src={`${API_URL}${photo}`} 
                                alt="avatar" 
                                className="h-100 w-100 rounded-circle" 
                                style={{ objectFit: 'cover' }} 
                              />
                            ) : (
                              initials
                            );
                          })()}
                        </div>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name}
                        </span>
                      </button>
                    )
                  });
              })()}
              {conversationsList.length <= 1 && (
                <div style={{ fontSize: 13, color: '#adb5bd', textAlign: 'center', padding: '10px 0' }}>Aucune autre conversation disponible.</div>
              )}
            </div>
            <button
              onClick={() => setForwardModal(null)}
              style={{
                marginTop: 12, width: '100%', padding: '8px 0', background: 'transparent',
                border: '1px solid #dee2e6', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, color: '#6c757d',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Toast visuel */}
      {toast && (
        <div style={{
          position:     'fixed',
          bottom:       24,
          left:         '50%',
          transform:    'translateX(-50%)',
          zIndex:       10001,
          padding:      '10px 20px',
          borderRadius: 8,
          background:   toast.type === 'error' ? '#dc3545' : '#198754',
          color:        '#fff',
          fontSize:     13,
          fontWeight:   500,
          boxShadow:    '0 4px 12px rgba(0,0,0,.15)',
          animation:    'ctxFadeIn .2s ease',
          whiteSpace:   'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Info Panel */}
      <ConversationInfoPanel
        open={showInfo}
        onClose={() => setShowInfo(false)}
        conversation={conversation}
        messages={messages}
        currentUserId={currentUserId}
        isUserOnline={isUserOnline}
      />

      {/* Call Modal */}
      {callState !== 'idle' && (
        <CallModal
          callState={callState}
          callType={callType}
          localStream={localStream}
          remoteStream={remoteStream}
          calleeName={displayName}
          isMuted={isMuted}
          isCamOff={isCamOff}
          onAccept={acceptCall}
          onDecline={() => declineCall(conversation.idConversation)}
          onHangup={() => endCall(
            callState === 'calling' ? 'Cancelled' : 'Completed',
            conversation.idConversation
          )}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
        />
      )}
    </Card>
  );
};

export default ChatArea;