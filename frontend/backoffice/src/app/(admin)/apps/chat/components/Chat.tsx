
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { useChatContext } from '@/context/useChatContext'
import { Conversation, ChatUtilisateur } from '@/services/chatService'
import { getFirstTwoLetters } from '@/utils/change-casing'

import { useState, useEffect } from 'react'
import { CardBody, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal } from 'react-bootstrap'

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// ── Palette Messenger ────────────────────────────────────────────
const COLOR = {
  accent:       '#0d6efd',
  accentSoft:   '#e8f0fe',
  hover:        '#f0f2f5',
  active:       '#dbeafe',
  activeBorder: '#0d6efd',
  text:         '#050505',
  subText:      '#65676b',
  badge:        '#0d6efd',
  border:       '#e4e6eb',
  online:       '#31a24c',
  offline:      '#ccd0d5',
  avatarBg:     '#0d6efd22',
  avatarColor:  '#0d6efd',
  groupBg:      '#ffc10722',
  groupColor:   '#ffc107',
}

type ChatProps = {
  conversations: Conversation[]
  activeConversation: Conversation | null
  onSelectConversation: (conv: Conversation) => void
  isUserOnline: (userId: number) => boolean
  currentUserId: string
  searchUsers: (query: string) => void
  searchResults: ChatUtilisateur[]
  onStartChat: (userId: number) => void
}

const Chat = ({
  conversations,
  activeConversation,
  onSelectConversation,
  isUserOnline,
  currentUserId,
  searchUsers,
  searchResults,
  onStartChat
}: ChatProps) => {
  const { chatSetting } = useChatContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  useEffect(() => {
    if (showNewContactModal) {
      const timer = setTimeout(() => searchUsers(contactSearch), 300)
      return () => clearTimeout(timer)
    }
  }, [contactSearch, showNewContactModal, searchUsers])

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm, searchUsers])

  const normalizeId = (id: any): string => String(id ?? '').toLowerCase().trim()

  const getDisplayName = (conv: Conversation): string => {
    if (conv.typeConversation === 'GROUPE') return conv.titre || 'Groupe'
    const other = conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))
    return other?.utilisateur ? `${other.utilisateur.prenom} ${other.utilisateur.nom}` : 'Utilisateur'
  }

  const getOtherUserId = (conv: Conversation): number => {
    const other = conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))
    return other?.utilisateurId || 0
  }

  const formatTime = (dateStr?: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Maintenant'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const getLastMessage = (conv: Conversation): string => {
    if (!conv.messages?.length) return 'Aucun message'
    const last = conv.messages[conv.messages.length - 1]
    if (last.estSupprime) return 'Message supprimé'
    if (last.typeMessage === 'IMAGE') return '📷 Image'
    if (last.typeMessage === 'FICHIER') return '📎 Fichier'
    if (last.typeMessage === 'APPEL') {
      try { const d = JSON.parse(last.contenu); return `${d.icon || '📞'} ${d.label || 'Appel'}` } catch { return '📞 Appel' }
    }
    return last.contenu
  }

  const getUnreadCount = (conv: Conversation): number => {
    if (!conv.messages) return 0
    return conv.messages.filter(m => !m.estLu && normalizeId(m.expediteurId) !== normalizeId(currentUserId)).length
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    return getDisplayName(conv).toLowerCase().includes(searchTerm.toLowerCase())
  })

  const uniqueConversations: Conversation[] = []
  const seenUserIds = new Set<number>()
  for (const conv of filteredConversations) {
    if (conv.typeConversation === 'PRIVEE') {
      const otherId = getOtherUserId(conv)
      if (seenUserIds.has(otherId)) continue
      seenUserIds.add(otherId)
    }
    uniqueConversations.push(conv)
  }

  uniqueConversations.sort((a, b) => {
    const ts = (c: Conversation) => {
      const d1 = c.dernierMessageDate ? new Date(c.dernierMessageDate).getTime() : 0
      const d2 = c.messages?.length ? new Date(c.messages[c.messages.length - 1].dateEnvoi).getTime() : 0
      const d3 = c.dateCreation ? new Date(c.dateCreation).getTime() : 0
      return Math.max(isNaN(d1) ? 0 : d1, isNaN(d2) ? 0 : d2, isNaN(d3) ? 0 : d3)
    }
    return ts(b) - ts(a)
  })

  const finalSearchResults = searchResults.filter(u =>
    normalizeId(u.idUtilisateur) !== normalizeId(currentUserId) &&
    !conversations.some(c =>
      c.typeConversation === 'PRIVEE' &&
      c.participants.some(p => normalizeId(p.utilisateurId) === normalizeId(u.idUtilisateur))
    )
  )

  const pinnedConversations = uniqueConversations.filter(conv =>
    conv.participants.some(p => normalizeId(p.utilisateurId) === normalizeId(currentUserId) && p.estEpingle)
  )
  const otherConversations = uniqueConversations.filter(conv =>
    !conv.participants.some(p => normalizeId(p.utilisateurId) === normalizeId(currentUserId) && p.estEpingle)
  )

  const currentUser = conversations.length > 0
    ? conversations[0].participants.find(p => normalizeId(p.utilisateurId) === normalizeId(currentUserId))?.utilisateur
    : null

  return (
    <div className="chat-user-list border-end" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header current user ───────────────────────────────── */}
      <CardBody className="py-2 px-3 border-bottom flex-shrink-0">
        <div className="d-flex align-items-center gap-2 py-1">
          {/* Avatar courant */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: COLOR.avatarBg, color: COLOR.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, overflow: 'hidden',
            }}>
              {currentUser?.photo || currentUser?.photoUrl ? (
                <img src={`${API_URL}${currentUser.photo || currentUser.photoUrl}`} alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{currentUser ? getFirstTwoLetters(`${currentUser.prenom} ${currentUser.nom}`) : 'ME'}</span>
              )}
            </div>
            <span style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: '50%',
              background: COLOR.online, border: '2px solid #fff',
            }} />
          </div>

          <div className="flex-grow-1 overflow-hidden">
            <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: 14, color: COLOR.text }}>
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Moi'}
            </p>
            <p className="mb-0" style={{ fontSize: 12, color: COLOR.online }}>En ligne</p>
          </div>

          <Dropdown className="lh-1" align="end">
            <DropdownToggle as="span" style={{ cursor: 'pointer', padding: 6 }} data-bs-toggle="dropdown" aria-expanded="false">
              <IconifyIcon width={20} height={20} icon="solar:settings-outline" className="text-muted" />
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem onClick={() => { setShowNewContactModal(true); setContactSearch(''); searchUsers(''); }}>
                <IconifyIcon icon="tabler:user-plus" className="me-1 fs-17 align-middle" />
                <span className="align-middle">Nouveau Contact</span>
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon="tabler:users-plus" className="me-1 fs-17 align-middle" />
                <span className="align-middle">Nouveau Groupe</span>
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon="tabler:star" className="me-1 fs-17 align-middle" />
                <span className="align-middle">Favoris</span>
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon="tabler:archive" className="me-1 fs-17 align-middle" />
                <span className="align-middle">Archivés</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <button
            onClick={chatSetting.toggle}
            type="button"
            className="flex-grow-0 btn btn-sm btn-icon btn-soft-danger d-xl-none"
          >
            <IconifyIcon icon="tabler:x" className="fs-20" />
          </button>
        </div>
      </CardBody>

      {/* ── Search bar ───────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <IconifyIcon
            icon="tabler:search"
            style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: COLOR.subText, fontSize: 16, pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              borderRadius: 20, border: 'none',
              background: COLOR.hover, fontSize: 14,
              color: COLOR.text, outline: 'none',
            }}
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      <SimplebarReactClient style={{ flex: 1, overflowY: 'auto' }}>

        {/* Search results (new contacts) */}
        {searchTerm && finalSearchResults.length > 0 && (
          <>
            <SectionLabel icon="tabler:users-search" label="Contacts trouvés" />
            {finalSearchResults.map(user => (
              <ContactSearchItem
                key={user.idUtilisateur}
                user={user}
                isOnline={isUserOnline(user.idUtilisateur)}
                onStart={() => { onStartChat(user.idUtilisateur); setSearchTerm('') }}
              />
            ))}
          </>
        )}

        {/* Pinned */}
        {pinnedConversations.length > 0 && (
          <>
            <SectionLabel icon="solar:pin-bold-duotone" label="Épinglés" />
            {pinnedConversations.map(conv => (
              <ConvItem
                key={conv.idConversation}
                conv={conv}
                isActive={activeConversation?.idConversation === conv.idConversation}
                displayName={getDisplayName(conv)}
                lastMessage={getLastMessage(conv)}
                unreadCount={getUnreadCount(conv)}
                isOnline={conv.typeConversation === 'PRIVEE' ? isUserOnline(getOtherUserId(conv)) : false}
                time={formatTime(conv.messages?.[conv.messages.length - 1]?.dateEnvoi || conv.dernierMessageDate || conv.dateCreation)}
                lastMsgIsMine={conv.messages?.length ? normalizeId(conv.messages[conv.messages.length - 1].expediteurId) === normalizeId(currentUserId) : false}
                lastMsgIsRead={conv.messages?.[conv.messages.length - 1]?.estLu ?? false}
                currentUserId={currentUserId}
                onSelect={() => onSelectConversation(conv)}
              />
            ))}
          </>
        )}

        {/* All conversations */}
        {otherConversations.length > 0 && (
          <>
            <SectionLabel icon="solar:chat-line-bold-duotone" label="Conversations" />
            {otherConversations.map(conv => (
              <ConvItem
                key={conv.idConversation}
                conv={conv}
                isActive={activeConversation?.idConversation === conv.idConversation}
                displayName={getDisplayName(conv)}
                lastMessage={getLastMessage(conv)}
                unreadCount={getUnreadCount(conv)}
                isOnline={conv.typeConversation === 'PRIVEE' ? isUserOnline(getOtherUserId(conv)) : false}
                time={formatTime(conv.messages?.[conv.messages.length - 1]?.dateEnvoi || conv.dernierMessageDate || conv.dateCreation)}
                lastMsgIsMine={conv.messages?.length ? normalizeId(conv.messages[conv.messages.length - 1].expediteurId) === normalizeId(currentUserId) : false}
                lastMsgIsRead={conv.messages?.[conv.messages.length - 1]?.estLu ?? false}
                currentUserId={currentUserId}
                onSelect={() => onSelectConversation(conv)}
              />
            ))}
          </>
        )}

        {otherConversations.length === 0 && pinnedConversations.length === 0 && !searchTerm && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: COLOR.subText }}>
            <IconifyIcon icon="tabler:message-off" style={{ fontSize: 40, display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Aucune conversation</p>
          </div>
        )}
      </SimplebarReactClient>

      {/* Modal Nouveau Contact */}
      <NewContactModal
        show={showNewContactModal}
        onHide={() => setShowNewContactModal(false)}
        searchResults={searchResults}
        currentUserId={currentUserId}
        isUserOnline={isUserOnline}
        contactSearch={contactSearch}
        setContactSearch={setContactSearch}
        onStartChat={onStartChat}
      />
    </div>
  )
}

// ── Section label (non-sticky — prevents scroll jump inside Simplebar) ──
const SectionLabel = ({ icon, label }: { icon: string; label: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 14px 4px',
  }}>
    <IconifyIcon icon={icon} style={{ fontSize: 14, color: COLOR.subText }} />
    <span style={{ fontSize: 11, fontWeight: 600, color: COLOR.subText, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </span>
  </div>
)

// ── Single conversation item ──────────────────────────────────────
interface ConvItemProps {
  conv: Conversation
  isActive: boolean
  displayName: string
  lastMessage: string
  unreadCount: number
  isOnline: boolean
  time: string
  lastMsgIsMine: boolean
  lastMsgIsRead: boolean
  currentUserId: string
  onSelect: () => void
}

const ConvItem = ({
  conv, isActive, displayName, lastMessage, unreadCount,
  isOnline, time, lastMsgIsMine, lastMsgIsRead, currentUserId, onSelect
}: ConvItemProps) => {
  const [hovered, setHovered] = useState(false)
  const isGroup = conv.typeConversation === 'GROUPE'

  const normalizeId = (id: any): string => String(id ?? '').toLowerCase().trim()
  const otherPart = !isGroup
    ? conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))?.utilisateur
    : null
  const photo = otherPart?.photo || otherPart?.photoUrl

  const bg = isActive ? COLOR.active : hovered ? COLOR.hover : 'transparent'
  const borderLeft = isActive ? `3px solid ${COLOR.activeBorder}` : '3px solid transparent'

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px 8px 11px',
        cursor: 'pointer',
        background: bg,
        borderLeft,
        transition: 'background 0.12s',
        userSelect: 'none',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: isGroup ? COLOR.groupBg : COLOR.avatarBg,
          color: isGroup ? COLOR.groupColor : COLOR.avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, overflow: 'hidden',
        }}>
          {isGroup ? (
            <IconifyIcon icon="tabler:users" style={{ fontSize: 20 }} />
          ) : photo ? (
            <img src={`${API_URL}${photo}`} alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ textTransform: 'uppercase' }}>{getFirstTwoLetters(displayName)}</span>
          )}
        </div>
        {/* Online dot */}
        {!isGroup && (
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: '50%',
            background: isOnline ? COLOR.online : COLOR.offline,
            border: '2px solid #fff',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{
            fontWeight: unreadCount > 0 ? 700 : 500,
            fontSize: 14, color: COLOR.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '70%',
          }}>
            {displayName}
          </span>
          <span style={{ fontSize: 11, color: COLOR.subText, whiteSpace: 'nowrap', marginLeft: 4 }}>
            {time}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Read checkmarks for own messages */}
          {lastMsgIsMine && unreadCount === 0 && (
            <IconifyIcon
              icon={lastMsgIsRead ? 'tabler:checks' : 'tabler:check'}
              style={{ fontSize: 13, color: lastMsgIsRead ? COLOR.accent : COLOR.subText, flexShrink: 0 }}
            />
          )}
          <span style={{
            fontSize: 12, color: unreadCount > 0 ? COLOR.text : COLOR.subText,
            fontWeight: unreadCount > 0 ? 600 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {lastMessage}
          </span>
          {unreadCount > 0 && (
            <span style={{
              background: COLOR.badge, color: '#fff',
              borderRadius: 10, fontSize: 11, fontWeight: 700,
              padding: '1px 6px', flexShrink: 0, minWidth: 18, textAlign: 'center',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contact search result row ─────────────────────────────────────
const ContactSearchItem = ({
  user, isOnline, onStart,
}: { user: ChatUtilisateur; isOnline: boolean; onStart: () => void }) => {
  const [hovered, setHovered] = useState(false)
  const photo = user.photo || user.photoUrl

  return (
    <div
      onClick={onStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', cursor: 'pointer',
        background: hovered ? COLOR.hover : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: COLOR.avatarBg, color: COLOR.avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, overflow: 'hidden',
        }}>
          {photo ? (
            <img src={`${API_URL}${photo}`} alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ textTransform: 'uppercase' }}>{getFirstTwoLetters(`${user.prenom} ${user.nom}`)}</span>
          )}
        </div>
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: isOnline ? COLOR.online : COLOR.offline,
          border: '2px solid #fff',
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: COLOR.text }}>
          {user.prenom} {user.nom}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: COLOR.subText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </p>
      </div>
    </div>
  )
}

// ── Modal Nouveau Contact ─────────────────────────────────────────
const NewContactModal = ({
  show, onHide, searchResults, currentUserId, isUserOnline,
  contactSearch, setContactSearch, onStartChat,
}: {
  show: boolean; onHide: () => void
  searchResults: ChatUtilisateur[]; currentUserId: string
  isUserOnline: (userId: number) => boolean
  contactSearch: string; setContactSearch: (v: string) => void
  onStartChat: (userId: number) => void
}) => {
  const normalizeId = (id: any): string => String(id ?? '').toLowerCase().trim()
  const filtered = searchResults.filter(u => normalizeId(u.idUtilisateur) !== normalizeId(currentUserId))

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>
          <IconifyIcon icon="tabler:user-plus" className="me-2" style={{ color: COLOR.accent }} />
          Nouveau message
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '12px 20px 20px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <IconifyIcon icon="tabler:search" style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: COLOR.subText, fontSize: 16, pointerEvents: 'none',
          }} />
          <input
            autoFocus
            type="text"
            value={contactSearch}
            onChange={e => setContactSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              borderRadius: 20, border: `1px solid ${COLOR.border}`,
              fontSize: 14, color: COLOR.text, outline: 'none',
              background: COLOR.hover,
            }}
          />
        </div>

        <SimplebarReactClient style={{ maxHeight: 400 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: COLOR.subText }}>
              <IconifyIcon icon="tabler:users-minus" style={{ fontSize: 36, display: 'block', margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            filtered.map(user => {
              const online = isUserOnline(user.idUtilisateur)
              const photo = user.photo || user.photoUrl
              return (
                <div
                  key={user.idUtilisateur}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 8px',
                    borderBottom: `1px solid ${COLOR.border}`,
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: COLOR.avatarBg, color: COLOR.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, overflow: 'hidden',
                    }}>
                      {photo ? (
                        <img src={`${API_URL}${photo}`} alt="avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ textTransform: 'uppercase' }}>{getFirstTwoLetters(`${user.prenom} ${user.nom}`)}</span>
                      )}
                    </div>
                    <span style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: '50%',
                      background: online ? COLOR.online : COLOR.offline,
                      border: '2px solid #fff',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: COLOR.text }}>
                      {user.prenom} {user.nom}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: COLOR.subText, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => { onStartChat(user.idUtilisateur); onHide() }}
                    style={{
                      padding: '6px 14px', borderRadius: 20,
                      border: 'none', background: COLOR.accent,
                      color: '#fff', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    Démarrer
                  </button>
                </div>
              )
            })
          )}
        </SimplebarReactClient>
      </Modal.Body>
    </Modal>
  )
}

export default Chat
