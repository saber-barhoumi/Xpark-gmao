
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import EmojiPicker from '@emoji-mart/react';
import api from '@/lib/axiosConfig';
import data from '@emoji-mart/data';
import ConfirmModal from '@/components/ConfirmModal';
import { Card, CardHeader, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap';

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

// ── Helpers ────────────────────────────────────────────────────────────────
const getInitiales = (nom: string) => {
  const parts = (nom ?? '').trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const fmtHeure = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const normalizeId = (id: any): string => String(id ?? '').toLowerCase().trim();

// ── Message bubble ─────────────────────────────────────────────────────────
interface BubbleProps {
  message: ChatMessage;
  currentUserId: string;
  onContextMenu: (e: React.MouseEvent, id: number, isMine: boolean) => void;
  isHighlighted: boolean;
  messages: ChatMessage[];
}

const MessageBubble: React.FC<BubbleProps> = ({ message, currentUserId, onContextMenu, isHighlighted, messages }) => {
  const isMine = normalizeId(message.expediteurId) === normalizeId(currentUserId);
  const nom = message.expediteur
    ? `${message.expediteur.prenom} ${message.expediteur.nom}`
    : message.nomExpediteur || 'Utilisateur';

  const repliedMsg = message.reponseAMessageId
    ? messages.find(m => String(m.idMessage) === String(message.reponseAMessageId))
    : null;

  const repliedName = repliedMsg
    ? (normalizeId(repliedMsg.expediteurId) === normalizeId(currentUserId)
        ? 'Vous'
        : (repliedMsg.expediteur ? `${repliedMsg.expediteur.prenom} ${repliedMsg.expediteur.nom}` : repliedMsg.nomExpediteur || 'Utilisateur'))
    : '';

  if (message.estSupprime) {
    return (
      <li className={`d-flex mb-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
        <div className="chat-msg-deleted">🚫 Ce message a été supprimé</div>
      </li>
    );
  }

  return (
    <li
      id={`msg-${message.idMessage}`}
      className={`chat-msg${isMine ? ' chat-msg--mine' : ''}${isHighlighted ? ' chat-msg--hl' : ''}`}
    >
      {/* Avatar (received messages only) */}
      {!isMine && (
        <div className="chat-msg__avatar-wrap">
          <div className="chat-msg__avatar-circle">
            {message.expediteur?.photo || message.expediteur?.photoUrl ? (
              <img
                src={`${API_URL}${message.expediteur.photo || message.expediteur.photoUrl}`}
                alt="avatar"
                className="h-100 w-100 rounded-circle"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              getInitiales(nom)
            )}
          </div>
        </div>
      )}

      {/* Column: sender name + bubble + meta */}
      <div className="chat-msg__col">
        {!isMine && <span className="chat-msg__sender-name">{nom}</span>}

        {/* Bubble */}
        <div
          onContextMenu={e => onContextMenu(e, message.idMessage, isMine)}
          className={`chat-msg__bubble${isMine ? ' chat-msg__bubble--mine' : ''}`}
        >
          {/* Reply quote */}
          {repliedMsg && (
            <div className={`chat-msg__reply chat-msg__reply--${isMine ? 'mine' : 'their'}`}>
              <div className={`chat-msg__reply-name chat-msg__reply-name--${isMine ? 'mine' : 'their'}`}>
                {repliedName}
              </div>
              <div className={`chat-msg__reply-text chat-msg__reply-text--${isMine ? 'mine' : 'their'}`}>
                {repliedMsg.typeMessage === 'IMAGE'   ? '📷 Photo'  :
                 repliedMsg.typeMessage === 'FICHIER' ? '📎 Fichier' :
                 repliedMsg.contenu}
              </div>
            </div>
          )}

          {/* Image */}
          {message.typeMessage === 'IMAGE' && message.cheminFichier && (
            <img src={`${API_URL}${message.cheminFichier}`} alt="image" className="chat-msg__image"  onError={(e) => { e.currentTarget.style.display = 'none' }} />
          )}

          {/* File */}
          {message.typeMessage === 'FICHIER' && message.nomFichier && (
            <div
              className="d-flex align-items-center mb-1 bg-white bg-opacity-10 p-2 rounded"
              style={{ border: isMine ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.05)' }}
            >
              <IconifyIcon icon={getFileExtensionIcon(message.nomFichier)} className="fs-24 me-2" />
              <div className="flex-grow-1 overflow-hidden">
                <a
                  href={`${API_URL}${message.cheminFichier}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`text-truncate d-block ${isMine ? 'text-white' : 'text-primary'}`}
                  style={{ fontSize: 13 }}
                >
                  {message.nomFichier}
                </a>
              </div>
            </div>
          )}

          {/* Text */}
          {(message.typeMessage === 'TEXTE' || !message.typeMessage) && (
            <p className="chat-msg__text">{message.contenu}</p>
          )}

          {message.typeMessage === 'SYSTEME' && (
            <p className="chat-msg__text-sys">{message.contenu}</p>
          )}
        </div>

        {/* Time + read receipt */}
        <div className={`chat-msg__meta${isMine ? ' chat-msg__meta--mine' : ''}`}>
          <span className="chat-msg__time">{fmtHeure(message.dateEnvoi)}</span>
          {isMine && (
            <span className="chat-msg__read" style={{ color: message.estLu ? '#0d6efd' : '#adb5bd' }}>
              {message.estLu ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

// ── Date separator ─────────────────────────────────────────────────────────
const DateSeparator: React.FC<{ date: string }> = ({ date }) => (
  <li className="chat-date-sep">
    <div className="chat-date-sep__line" />
    <span className="chat-date-sep__label">{fmtDate(date)}</span>
    <div className="chat-date-sep__line" />
  </li>
);

// ── ChatArea ───────────────────────────────────────────────────────────────
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
  conversation, messages, onSendMessage, onSendFile, onTyping,
  isUserTyping, currentUserId, isUserOnline, onDeleteMessage, onPinMessage,
  conversationsList, refreshConversations,
}: ChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo]       = useState<ChatMessage | null>(null);
  const [showInfo, setShowInfo]     = useState(false);

  const {
    callState, callType,
    localStream, remoteStream,
    incomingCall, isMuted, isCamOff,
    startCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera,
    setConversationId: setCallConvId,
  } = useWebRTC(currentUserId);

  useCallRingtone({ callState });

  useEffect(() => { setCallConvId(conversation.idConversation); }, [conversation.idConversation, setCallConvId]);

  useEffect(() => {
    if (callState !== 'calling') return;
    const t = setTimeout(() => endCall('Missed', conversation.idConversation), 30_000);
    return () => clearTimeout(t);
  }, [callState, conversation.idConversation, endCall]);

  const [typingTimeout, setTypingTimeoutState] = useState<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simplebarRef = useRef<any>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);

  const { theme } = useLayoutContext();
  const { chatList, chatSetting } = useChatContext();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const otherParticipant = conversation.typeConversation === 'PRIVEE'
    ? conversation.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))
    : null;

  const displayName = conversation.typeConversation === 'GROUPE'
    ? conversation.titre || 'Groupe'
    : otherParticipant?.utilisateur
      ? `${otherParticipant.utilisateur.prenom} ${otherParticipant.utilisateur.nom}`
      : 'Utilisateur';

  const isOnline = otherParticipant ? isUserOnline(otherParticipant.utilisateurId) : false;

  // ── Intelligent scroll ────────────────────────────────────────────────────
  const isNearBottomRef   = useRef(true);
  const prevConvIdRef     = useRef<number | null>(null);
  const prevMsgCountRef   = useRef(0);

  useEffect(() => {
    let remove: (() => void) | undefined;
    const t = setTimeout(() => {
      const el = simplebarRef.current?.getScrollElement?.();
      if (!el) return;
      const handler = () => {
        isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
      };
      el.addEventListener('scroll', handler, { passive: true });
      remove = () => el.removeEventListener('scroll', handler);
    }, 200);
    return () => { clearTimeout(t); remove?.(); };
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

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, 'TEXTE', replyTo?.idMessage);
    setInputValue(''); setReplyTo(null); onTyping(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    scrollToBottom(true);
  }, [inputValue, replyTo, onSendMessage, onTyping, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    onTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeoutState(setTimeout(() => onTyping(false), 3000));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onSendFile(file); e.target.value = ''; scrollToBottom(true); }
  };

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const [forwardModal, setForwardModal]   = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleAction = useCallback(async (action: MessageAction, messageId: number) => {
    const msg = messages.find(m => String(m.idMessage) === String(messageId));
    if (!msg) return;
    switch (action) {
      case 'reply':
        setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(msg.contenu); showToast('Message copié !');
        } catch {
          const el = document.createElement('textarea');
          el.value = msg.contenu; document.body.appendChild(el); el.select();
          document.execCommand('copy'); document.body.removeChild(el);
          showToast('Message copié !');
        }
        break;
      case 'delete':
        setDeleteConfirm(messageId); break;
      case 'pin':
        if (onPinMessage) { onPinMessage(messageId); showToast(msg.epingle ? 'Message désépinglé' : 'Message épinglé 📌'); }
        break;
      case 'forward':
        setForwardModal(messageId); break;
    }
  }, [messages, onPinMessage, showToast]);

  return (
    <Card className="chat-content rounded-0 shadow-none mb-0 d-flex flex-column" style={{ minHeight: 0 }}>
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
                    <img src={`${API_URL}${photo}`} alt="avatar" className="h-100 w-100 rounded-circle" style={{ objectFit: 'cover' }}  onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <span className="fw-semibold">{getFirstTwoLetters(displayName)}</span>
                  );
                })()}
              </div>
            )}

            <div>
              <h5 className="my-0 lh-base"><span className="text-reset">{displayName}</span></h5>
              <p className="mb-0 text-muted icons-center">
                {isUserTyping ? (
                  <span className="text-primary fw-semibold">
                    <IconifyIcon icon='tabler:pencil' className="me-1" />en train d'écrire...
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
            <button className="btn btn-sm btn-icon btn-ghost-light d-none d-xl-flex" title="Appel vocal"
              onClick={() => otherParticipant && startCall(otherParticipant.utilisateurId, 'audio', conversation.idConversation)}
              disabled={callState !== 'idle' || !otherParticipant}>
              <IconifyIcon icon='tabler:phone-call' className="fs-20" />
            </button>
            <button className="btn btn-sm btn-icon btn-ghost-light d-none d-xl-flex" title="Appel vidéo"
              onClick={() => otherParticipant && startCall(otherParticipant.utilisateurId, 'video', conversation.idConversation)}
              disabled={callState !== 'idle' || !otherParticipant}>
              <IconifyIcon icon='tabler:video' className="fs-20" />
            </button>
            <button className={`btn btn-sm btn-icon ${showInfo ? 'btn-primary' : 'btn-ghost-light'} d-xl-flex`} title="Infos"
              onClick={() => setShowInfo(v => !v)}>
              <IconifyIcon icon='tabler:info-circle' className="fs-20" />
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <div className="chat-messages-wrap">
        <SimplebarReactClient ref={simplebarRef} style={{ height: '100%', padding: '8px 0' }}>
          <ul className="chat-msg-list">
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
                      onCallback={ct => otherParticipant && startCall(otherParticipant.utilisateurId, ct, conversation.idConversation)}
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
            <div ref={bottomRef} className="chat-bottom-anchor" />
          </ul>
        </SimplebarReactClient>
      </div>

      {/* Compose bar */}
      <div className="chat-compose p-3 position-sticky bottom-0 w-100 mb-0">
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
              <EmojiPicker data={data} theme={theme} onEmojiSelect={(e: any) => setInputValue(p => p + e.native)} />
            </DropdownMenu>
          </Dropdown>

          <textarea
            ref={inputRef}
            className="form-control flex-grow-1 chat-compose__textarea"
            placeholder={replyTo ? `Répondre à ${replyTo.nomExpediteur || 'Utilisateur'}...` : 'Votre message... (Entrée pour envoyer)'}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <div className="d-flex align-items-center gap-1 flex-shrink-0 mb-1">
            <button type="button" className="btn btn-icon btn-soft-primary" onClick={() => fileInputRef.current?.click()}>
              <IconifyIcon icon="tabler:paperclip" />
            </button>
            <button type="submit" className="btn btn-icon btn-primary text-white" disabled={!inputValue.trim()}>
              <IconifyIcon icon="tabler:send" />
            </button>
            <input ref={fileInputRef} type="file" className="d-none" onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />
          </div>
        </form>
      </div>

      {/* Message context menu */}
      <MessageContextMenu menu={menu} isMine={menu.isMine} onAction={handleAction} onClose={closeMenu} />

      {/* Confirm delete */}
      <ConfirmModal
        show={deleteConfirm !== null}
        title="Supprimer le message"
        message="Ce message sera définitivement supprimé pour tous les participants."
        confirmLabel="Supprimer" variant="danger"
        onConfirm={() => { if (deleteConfirm !== null && onDeleteMessage) onDeleteMessage(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Forward modal */}
      {forwardModal && (
        <div className="chat-forward-overlay" onClick={() => setForwardModal(null)}>
          <div className="chat-forward-modal" onClick={e => e.stopPropagation()}>
            <h6 className="chat-forward-modal__title">Transférer le message</h6>
            <p className="chat-forward-modal__desc">Sélectionnez une conversation :</p>
            <div className="chat-forward-modal__list">
              {(() => {
                const seenUserIds = new Set<string>();
                const seenConvIds = new Set<number>();
                return conversationsList
                  .filter(c => c.idConversation !== conversation.idConversation)
                  .filter(c => {
                    if (seenConvIds.has(c.idConversation)) return false;
                    seenConvIds.add(c.idConversation);
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
                    const ts = (c: any) => {
                      const d1 = c.dernierMessageDate ? new Date(c.dernierMessageDate).getTime() : 0;
                      const d2 = c.messages?.length ? new Date(c.messages[c.messages.length - 1].dateEnvoi).getTime() : 0;
                      return Math.max(isNaN(d1) ? 0 : d1, isNaN(d2) ? 0 : d2, new Date(c.dateCreation).getTime() || 0);
                    };
                    return ts(b) - ts(a);
                  })
                  .map(conv => {
                    const isGroup  = conv.typeConversation === 'GROUPE';
                    const other    = isGroup ? null : conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))?.utilisateur;
                    const name     = isGroup ? (conv.titre || 'Groupe') : (other ? `${other.prenom} ${other.nom}` : 'Conversation privée');
                    const initials = isGroup ? '👥' : getFirstTwoLetters(name);
                    const photo    = other?.photo || other?.photoUrl;
                    return (
                      <button
                        key={conv.idConversation}
                        className="chat-forward-modal__item"
                        onClick={async () => {
                          const msg = messages.find(m => String(m.idMessage) === String(forwardModal));
                          if (!msg) return;
                          try {
                            await api.post('/chat/messages/forward', { messageId: forwardModal, targetConvId: conv.idConversation, contenu: msg.contenu });
                            showToast('Message transféré ✓'); setForwardModal(null);
                            refreshConversations?.();
                          } catch { showToast('Erreur lors du transfert', 'error'); }
                        }}
                      >
                        <div className={`chat-forward-modal__avatar chat-forward-modal__avatar--${isGroup ? 'group' : 'private'}`}>
                          {photo ? <img src={`${API_URL}${photo}`} alt="avatar" className="h-100 w-100 rounded-circle" style={{ objectFit: 'cover' }}  onError={(e) => { e.currentTarget.style.display = 'none' }} /> : initials}
                        </div>
                        <span className="chat-forward-modal__name">{name}</span>
                      </button>
                    );
                  });
              })()}
              {conversationsList.length <= 1 && (
                <div className="chat-forward-modal__empty">Aucune autre conversation disponible.</div>
              )}
            </div>
            <button className="chat-forward-modal__cancel" onClick={() => setForwardModal(null)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`chat-toast chat-toast--${toast.type === 'error' ? 'err' : 'ok'}`}>
          {toast.msg}
        </div>
      )}

      {/* Info panel */}
      <ConversationInfoPanel
        open={showInfo}
        onClose={() => setShowInfo(false)}
        conversation={conversation}
        messages={messages}
        currentUserId={currentUserId}
        isUserOnline={isUserOnline}
      />

      {/* Call modal */}
      {callState !== 'idle' && (
        <CallModal
          callState={callState} callType={callType}
          localStream={localStream} remoteStream={remoteStream}
          calleeName={displayName}
          isMuted={isMuted} isCamOff={isCamOff}
          onAccept={acceptCall}
          onDecline={() => declineCall(conversation.idConversation)}
          onHangup={() => endCall(callState === 'calling' ? 'Cancelled' : 'Completed', conversation.idConversation)}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
        />
      )}
    </Card>
  );
};

export default ChatArea;
