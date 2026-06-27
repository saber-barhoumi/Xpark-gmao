import '@/assets/scss/pages/_chat.scss'

import ConfirmModal from '@/components/ConfirmModal'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { useChatContext } from '@/context/useChatContext'
import { Conversation, ChatUtilisateur } from '@/services/chatService'
import chatService from '@/services/chatService'
import { getFirstTwoLetters } from '@/utils/change-casing'

import { useState, useEffect, useRef } from 'react'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal } from 'react-bootstrap'

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

type FilterTab = 'all' | 'unread' | 'groups' | 'favorites' | 'archived'
type ConvAction = 'pin' | 'mute' | 'archive' | 'markUnread' | 'favorite' | 'delete'

type ChatProps = {
  conversations: Conversation[]
  activeConversation: Conversation | null
  onSelectConversation: (conv: Conversation) => void
  isUserOnline: (userId: number) => boolean
  currentUserId: string
  searchUsers: (query: string) => void
  searchResults: ChatUtilisateur[]
  onStartChat: (userId: number) => void
  refreshConversations?: () => void
}

const Chat = ({
  conversations,
  activeConversation,
  onSelectConversation,
  isUserOnline,
  currentUserId,
  searchUsers,
  searchResults,
  onStartChat,
  refreshConversations,
}: ChatProps) => {
  const { chatSetting } = useChatContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const [ctxMenu, setCtxMenu] = useState<{ conv: Conversation; x: number; y: number } | null>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)

  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([])
  const [loadingArchived, setLoadingArchived] = useState(false)

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupParticipants, setGroupParticipants] = useState<ChatUtilisateur[]>([])
  const [groupSearch, setGroupSearch] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean; title: string; message: string; onConfirm: () => void
  }>({ show: false, title: '', message: '', onConfirm: () => {} })

  const [localUnread, setLocalUnread] = useState<Set<number>>(new Set())

  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('chat_favorites')
      return stored ? new Set<number>(JSON.parse(stored)) : new Set<number>()
    } catch { return new Set<number>() }
  })

  useEffect(() => {
    if (showNewContactModal) {
      const t = setTimeout(() => searchUsers(contactSearch), 300)
      return () => clearTimeout(t)
    }
  }, [contactSearch, showNewContactModal, searchUsers])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm, searchUsers])

  useEffect(() => {
    if (showGroupModal) {
      const t = setTimeout(() => searchUsers(groupSearch), 300)
      return () => clearTimeout(t)
    }
  }, [groupSearch, showGroupModal, searchUsers])

  useEffect(() => {
    if (activeFilter !== 'archived') return
    setLoadingArchived(true)
    chatService.getArchivedConversations()
      .then(setArchivedConversations)
      .catch(console.error)
      .finally(() => setLoadingArchived(false))
  }, [activeFilter])

  useEffect(() => {
    if (!ctxMenu) return
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) setCtxMenu(null)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [ctxMenu])

  useEffect(() => {
    if (activeConversation) {
      setLocalUnread(prev => {
        if (!prev.has(activeConversation.idConversation)) return prev
        const next = new Set(prev)
        next.delete(activeConversation.idConversation)
        return next
      })
    }
  }, [activeConversation])

  const norm = (id: any): string => String(id ?? '').toLowerCase().trim()

  const getDisplayName = (conv: Conversation): string => {
    if (conv.typeConversation === 'GROUPE') return conv.titre || 'Groupe'
    const other = conv.participants.find(p => norm(p.utilisateurId) !== norm(currentUserId))
    return other?.utilisateur ? `${other.utilisateur.prenom} ${other.utilisateur.nom}` : 'Utilisateur'
  }

  const getOtherUserId = (conv: Conversation): number => {
    const other = conv.participants.find(p => norm(p.utilisateurId) !== norm(currentUserId))
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
    if (!conv.messages?.length) return ''
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
    return conv.messages.filter(m => !m.estLu && norm(m.expediteurId) !== norm(currentUserId)).length
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    return getDisplayName(conv).toLowerCase().includes(searchTerm.toLowerCase())
  })

  const uniqueConversations: Conversation[] = []
  const seenKeys = new Set<string>()
  for (const conv of filteredConversations) {
    const convKey = String(conv.idConversation)
    if (seenKeys.has(convKey)) continue
    if (conv.typeConversation === 'PRIVEE') {
      const participantKey = conv.participants.map(p => String(p.utilisateurId)).sort().join('-')
      if (participantKey && seenKeys.has(participantKey)) continue
      if (participantKey) seenKeys.add(participantKey)
    }
    seenKeys.add(convKey)
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

  const totalUnread = uniqueConversations.reduce((sum, c) => sum + getUnreadCount(c) + (localUnread.has(c.idConversation) ? 1 : 0), 0)
  const groupsCount = uniqueConversations.filter(c => c.typeConversation === 'GROUPE').length

  const filteredByTab = uniqueConversations.filter(conv => {
    switch (activeFilter) {
      case 'unread':    return getUnreadCount(conv) > 0 || localUnread.has(conv.idConversation)
      case 'groups':    return conv.typeConversation === 'GROUPE'
      case 'favorites': return favorites.has(conv.idConversation)
      default:          return true
    }
  })

  const finalSearchResults = searchResults.filter(u =>
    norm(u.idUtilisateur) !== norm(currentUserId) &&
    !conversations.some(c =>
      c.typeConversation === 'PRIVEE' &&
      c.participants.some(p => norm(p.utilisateurId) === norm(u.idUtilisateur))
    )
  )

  const pinnedConversations = filteredByTab.filter(conv =>
    conv.participants.some(p => norm(p.utilisateurId) === norm(currentUserId) && p.estEpingle)
  )
  const otherConversations = filteredByTab.filter(conv =>
    !conv.participants.some(p => norm(p.utilisateurId) === norm(currentUserId) && p.estEpingle)
  )

  const currentUser = conversations.length > 0
    ? conversations[0].participants.find(p => norm(p.utilisateurId) === norm(currentUserId))?.utilisateur
    : null

  const createGroup = async () => {
    if (!groupName.trim() || groupParticipants.length === 0) return
    setCreatingGroup(true)
    try {
      const conv = await chatService.createGroupConversation(groupName.trim(), groupParticipants.map(u => u.idUtilisateur))
      setShowGroupModal(false); setGroupName(''); setGroupParticipants([]); setGroupSearch('')
      refreshConversations?.()
      onSelectConversation(conv)
    } catch (err) { console.error('[Chat] createGroup error:', err) }
    finally { setCreatingGroup(false) }
  }

  const openCtxMenu = (e: React.MouseEvent, conv: Conversation) => {
    e.preventDefault(); e.stopPropagation()
    const menuW = 230, menuH = 320
    const x = e.clientX + menuW > window.innerWidth ? e.clientX - menuW : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? e.clientY - menuH : e.clientY
    setCtxMenu({ conv, x, y })
  }

  const handleConvAction = async (action: ConvAction, conv: Conversation) => {
    setCtxMenu(null)
    try {
      switch (action) {
        case 'pin':
          await chatService.togglePin(conv.idConversation); refreshConversations?.(); break
        case 'mute':
          await chatService.toggleMute(conv.idConversation); refreshConversations?.(); break
        case 'archive':
          await chatService.toggleArchive(conv.idConversation); refreshConversations?.()
          if (activeFilter === 'archived') setArchivedConversations(prev => prev.filter(c => c.idConversation !== conv.idConversation))
          break
        case 'delete':
          setConfirmModal({
            show: true, title: 'Supprimer la discussion',
            message: 'Cette action est irréversible. Tous les messages seront définitivement supprimés.',
            onConfirm: async () => {
              setConfirmModal(m => ({ ...m, show: false }))
              try {
                await chatService.deleteConversation(conv.idConversation); refreshConversations?.()
                if (activeFilter === 'archived') setArchivedConversations(prev => prev.filter(c => c.idConversation !== conv.idConversation))
              } catch (err) { console.error('[Chat] delete error:', err) }
            },
          })
          break
        case 'markUnread':
          setLocalUnread(prev => {
            const next = new Set(prev)
            if (next.has(conv.idConversation)) next.delete(conv.idConversation)
            else next.add(conv.idConversation)
            return next
          })
          break
        case 'favorite':
          setFavorites(prev => {
            const next = new Set(prev)
            if (next.has(conv.idConversation)) next.delete(conv.idConversation)
            else next.add(conv.idConversation)
            localStorage.setItem('chat_favorites', JSON.stringify([...next]))
            return next
          })
          break
      }
    } catch (err) { console.error('[Chat] action error:', err) }
  }

  return (
    <div className="chat-sidebar border-end">

      {/* ══ Row 1 — Profile header ══════════════════════════════ */}
      <div className="chat-sidebar__header">
        <div className="chat-sidebar__header-inner">

          {/* Avatar */}
          <div className="chat-sidebar__avatar-wrap">
            <div className="chat-sidebar__avatar">
              {currentUser?.photo || currentUser?.photoUrl ? (
                <img src={`${API_URL}${currentUser.photo || currentUser.photoUrl}`} alt="avatar" />
              ) : (
                <span>{currentUser ? getFirstTwoLetters(`${currentUser.prenom} ${currentUser.nom}`) : 'ME'}</span>
              )}
            </div>
            <span className="chat-sidebar__online-dot" />
          </div>

          {/* Name + status */}
          <div className="chat-sidebar__user-info">
            <p className="chat-sidebar__user-name">
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Moi'}
            </p>
            <p className="chat-sidebar__user-status">● En ligne</p>
          </div>

          {/* Actions */}
          <div className="chat-sidebar__header-actions">
            <button
              className="chat-sidebar__icon-btn"
              onClick={() => { setShowNewContactModal(true); setContactSearch(''); searchUsers(''); }}
              title="Nouveau message"
            >
              <IconifyIcon icon="tabler:edit" style={{ fontSize: 18 }} />
            </button>

            <Dropdown align="end">
              <DropdownToggle as="span" className="chat-sidebar__icon-btn" style={{ display: 'inline-flex' }}>
                <IconifyIcon icon="tabler:dots-vertical" style={{ fontSize: 18 }} />
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-end shadow-sm" style={{ minWidth: 200, borderRadius: 12 }}>
                <DropdownItem onClick={() => { setShowGroupModal(true); setGroupName(''); setGroupParticipants([]); setGroupSearch(''); searchUsers(''); }}>
                  <IconifyIcon icon="tabler:users-plus" className="me-2 fs-16 align-middle" />
                  Nouveau Groupe
                </DropdownItem>
                <DropdownItem onClick={() => setActiveFilter('favorites')}>
                  <IconifyIcon icon="tabler:star" className="me-2 fs-16 align-middle" />
                  Favoris
                </DropdownItem>
                <DropdownItem onClick={() => setActiveFilter('archived')}>
                  <IconifyIcon icon="tabler:archive" className="me-2 fs-16 align-middle" />
                  Archivés
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <button onClick={chatSetting.toggle} type="button" className="btn btn-sm btn-icon btn-soft-danger d-xl-none" style={{ width: 32, height: 32, borderRadius: '50%' }}>
              <IconifyIcon icon="tabler:x" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ══ Row 2 — Search ══════════════════════════════════════ */}
      <div className="chat-sidebar__search">
        <div className="chat-sidebar__search-wrapper">
          <IconifyIcon icon="tabler:search" className="chat-sidebar__search-icon" />
          <input
            type="text"
            className="chat-sidebar__search-input"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="chat-sidebar__search-clear" onClick={() => setSearchTerm('')}>
              <IconifyIcon icon="tabler:x" style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* ══ Row 3 — Filter tabs / Archived header ═══════════════ */}
      {activeFilter === 'archived' ? (
        <div className="chat-sidebar__archived-header">
          <button className="chat-sidebar__archived-back" onClick={() => setActiveFilter('all')}>
            <IconifyIcon icon="tabler:arrow-left" style={{ fontSize: 13 }} />
            Retour
          </button>
          <IconifyIcon icon="tabler:archive" style={{ fontSize: 15, color: '#b45309' }} />
          <span className="chat-sidebar__archived-label">Archivées</span>
          {archivedConversations.length > 0 && (
            <span className="chat-sidebar__archived-count">{archivedConversations.length}</span>
          )}
        </div>
      ) : (
        <div className="chat-sidebar__filters">
          {([
            { key: 'all',       label: 'Toutes',   badge: 0 },
            { key: 'unread',    label: 'Non lues', badge: totalUnread },
            { key: 'favorites', label: 'Favoris',  badge: 0 },
            { key: 'groups',    label: 'Groupes',  badge: groupsCount },
          ] as { key: FilterTab; label: string; badge: number }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`chat-sidebar__filter-tab${activeFilter === tab.key ? ' chat-sidebar__filter-tab--active' : ''}`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="chat-sidebar__filter-badge">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ══ Row 4 — Conversations list ══════════════════════════ */}
      <div className="chat-sidebar__list">
        <SimplebarReactClient style={{ minHeight: '100%' }}>

          {activeFilter === 'archived' ? (
            loadingArchived ? (
              <div className="chat-sidebar__empty"><p>Chargement...</p></div>
            ) : archivedConversations.length === 0 ? (
              <div className="chat-sidebar__empty">
                <IconifyIcon icon="tabler:archive-off" className="chat-sidebar__empty-icon" />
                <p>Aucune discussion archivée</p>
              </div>
            ) : (
              <>
                <SectionLabel icon="tabler:archive" label="Discussions archivées" />
                {archivedConversations.map(conv => (
                  <ConvItem
                    key={conv.idConversation}
                    conv={conv}
                    isActive={activeConversation?.idConversation === conv.idConversation}
                    displayName={getDisplayName(conv)}
                    lastMessage={getLastMessage(conv)}
                    unreadCount={0}
                    isOnline={false}
                    time={formatTime(conv.messages?.[conv.messages.length - 1]?.dateEnvoi || conv.dernierMessageDate || conv.dateCreation)}
                    lastMsgIsMine={false}
                    lastMsgIsRead={true}
                    currentUserId={currentUserId}
                    isMuted={false}
                    isFavorite={false}
                    onSelect={() => onSelectConversation(conv)}
                    onContextMenu={e => openCtxMenu(e, conv)}
                  />
                ))}
              </>
            )
          ) : (
            <>
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
                      unreadCount={getUnreadCount(conv) + (localUnread.has(conv.idConversation) ? 1 : 0)}
                      isOnline={conv.typeConversation === 'PRIVEE' ? isUserOnline(getOtherUserId(conv)) : false}
                      time={formatTime(conv.messages?.[conv.messages.length - 1]?.dateEnvoi || conv.dernierMessageDate || conv.dateCreation)}
                      lastMsgIsMine={conv.messages?.length ? norm(conv.messages[conv.messages.length - 1].expediteurId) === norm(currentUserId) : false}
                      lastMsgIsRead={conv.messages?.[conv.messages.length - 1]?.estLu ?? false}
                      currentUserId={currentUserId}
                      isMuted={conv.participants.some(p => norm(p.utilisateurId) === norm(currentUserId) && !p.notificationsActivees)}
                      isFavorite={favorites.has(conv.idConversation)}
                      onSelect={() => onSelectConversation(conv)}
                      onContextMenu={e => openCtxMenu(e, conv)}
                    />
                  ))}
                </>
              )}

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
                      unreadCount={getUnreadCount(conv) + (localUnread.has(conv.idConversation) ? 1 : 0)}
                      isOnline={conv.typeConversation === 'PRIVEE' ? isUserOnline(getOtherUserId(conv)) : false}
                      time={formatTime(conv.messages?.[conv.messages.length - 1]?.dateEnvoi || conv.dernierMessageDate || conv.dateCreation)}
                      lastMsgIsMine={conv.messages?.length ? norm(conv.messages[conv.messages.length - 1].expediteurId) === norm(currentUserId) : false}
                      lastMsgIsRead={conv.messages?.[conv.messages.length - 1]?.estLu ?? false}
                      currentUserId={currentUserId}
                      isMuted={conv.participants.some(p => norm(p.utilisateurId) === norm(currentUserId) && !p.notificationsActivees)}
                      isFavorite={favorites.has(conv.idConversation)}
                      onSelect={() => onSelectConversation(conv)}
                      onContextMenu={e => openCtxMenu(e, conv)}
                    />
                  ))}
                </>
              )}

              {filteredByTab.length === 0 && !searchTerm && (
                <div className="chat-sidebar__empty">
                  <IconifyIcon icon="tabler:message-off" className="chat-sidebar__empty-icon" />
                  <p>
                    {activeFilter === 'unread' ? 'Aucun message non lu' :
                     activeFilter === 'favorites' ? 'Aucun favori' :
                     activeFilter === 'groups' ? 'Aucun groupe' : 'Aucune conversation'}
                  </p>
                </div>
              )}
            </>
          )}
        </SimplebarReactClient>
      </div>

      {/* ── Context menu (right-click on conversation) ──────────── */}
      {ctxMenu && (
        <div ref={ctxMenuRef} className="chat-ctx-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }}>
          {(() => {
            const conv = ctxMenu.conv
            const myPart   = conv.participants.find(p => norm(p.utilisateurId) === norm(currentUserId))
            const isPinned = myPart?.estEpingle ?? false
            const isMuted  = !(myPart?.notificationsActivees ?? true)
            const isFav    = favorites.has(conv.idConversation)
            const hasUnread = localUnread.has(conv.idConversation)
            const isArchived = activeFilter === 'archived'

            const items = [
              ...(!isArchived ? [
                { icon: isPinned ? 'tabler:pin-off' : 'solar:pin-bold-duotone', label: isPinned ? 'Désépingler' : 'Épingler', action: 'pin' as ConvAction },
                { icon: isMuted  ? 'tabler:bell' : 'tabler:bell-off', label: isMuted ? 'Activer les notifications' : 'Mode silencieux', action: 'mute' as ConvAction },
                { icon: isFav    ? 'tabler:star-off' : 'tabler:star', label: isFav ? 'Retirer des favoris' : 'Ajouter aux favoris', action: 'favorite' as ConvAction },
                { icon: hasUnread ? 'tabler:message-check' : 'tabler:message-dots', label: hasUnread ? 'Marquer comme lue' : 'Marquer comme non lue', action: 'markUnread' as ConvAction },
                { divider: true },
                { icon: 'tabler:archive', label: 'Archiver la discussion', action: 'archive' as ConvAction, danger: false },
              ] : [
                { icon: 'tabler:archive-off', label: 'Désarchiver la discussion', action: 'archive' as ConvAction, danger: false },
              ]),
              { divider: true },
              { icon: 'tabler:trash', label: 'Supprimer la discussion', action: 'delete' as ConvAction, danger: true },
            ]

            return items.map((item, i) => {
              if ('divider' in item) return <div key={i} className="chat-ctx-menu__sep" />
              return (
                <CtxMenuItem
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  danger={item.danger}
                  onClick={() => handleConvAction(item.action, conv)}
                />
              )
            })
          })()}
        </div>
      )}

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

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(m => ({ ...m, show: false }))}
      />

      <NewGroupModal
        show={showGroupModal}
        onHide={() => setShowGroupModal(false)}
        groupName={groupName}
        setGroupName={setGroupName}
        groupSearch={groupSearch}
        setGroupSearch={setGroupSearch}
        searchResults={searchResults}
        currentUserId={currentUserId}
        isUserOnline={isUserOnline}
        groupParticipants={groupParticipants}
        setGroupParticipants={setGroupParticipants}
        onConfirm={createGroup}
        creating={creatingGroup}
      />
    </div>
  )
}

// ── Context menu item ──────────────────────────────────────────────────────
const CtxMenuItem = ({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) => (
  <div onClick={onClick} className={`chat-ctx-item${danger ? ' chat-ctx-item--danger' : ''}`}>
    <IconifyIcon icon={icon} className="chat-ctx-item__icon" />
    {label}
  </div>
)

// ── Section label ──────────────────────────────────────────────────────────
const SectionLabel = ({ icon, label }: { icon: string; label: string }) => (
  <div className="chat-section-label">
    <IconifyIcon icon={icon} className="chat-section-label__icon" />
    <span className="chat-section-label__text">{label}</span>
  </div>
)

// ── Single conversation row ────────────────────────────────────────────────
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
  isMuted: boolean
  isFavorite: boolean
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

const ConvItem = ({
  conv, isActive, displayName, lastMessage, unreadCount,
  isOnline, time, lastMsgIsMine, lastMsgIsRead,
  isMuted, isFavorite, onSelect, onContextMenu
}: ConvItemProps) => {
  const norm = (id: any): string => String(id ?? '').toLowerCase().trim()
  const isGroup = conv.typeConversation === 'GROUPE'
  const otherPart = !isGroup ? conv.participants.find(p => norm(p.utilisateurId) !== norm(conv.participants[0]?.utilisateurId))?.utilisateur : null
  const photo = otherPart?.photo || otherPart?.photoUrl

  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`chat-conv-item${isActive ? ' chat-conv-item--active' : ''}`}
    >
      {/* Avatar */}
      <div className="chat-conv-item__avatar-wrap">
        <div className={`chat-conv-item__avatar${isGroup ? ' chat-conv-item__avatar--group' : ''}`}>
          {isGroup ? (
            <IconifyIcon icon="tabler:users" style={{ fontSize: 20 }} />
          ) : photo ? (
            <img src={`${API_URL}${photo}`} alt="avatar" />
          ) : (
            <span>{getFirstTwoLetters(displayName)}</span>
          )}
        </div>
        {!isGroup && (
          <span className={`chat-conv-item__online-dot${isOnline ? ' chat-conv-item__online-dot--on' : ''}`} />
        )}
      </div>

      {/* Content */}
      <div className="chat-conv-item__content">
        <div className="chat-conv-item__row">
          <div className="chat-conv-item__name-wrap">
            <span className={`chat-conv-item__name${unreadCount > 0 ? ' chat-conv-item__name--bold' : ''}`}>
              {displayName}
            </span>
            {isFavorite && <IconifyIcon icon="tabler:star-filled" style={{ fontSize: 11, color: '#ffc107', flexShrink: 0 }} />}
            {isMuted    && <IconifyIcon icon="tabler:bell-off"    style={{ fontSize: 11, color: '#65676b', flexShrink: 0 }} />}
          </div>
          <span className="chat-conv-item__time">{time}</span>
        </div>
        <div className="chat-conv-item__subrow">
          {lastMsgIsMine && unreadCount === 0 && (
            <IconifyIcon
              icon={lastMsgIsRead ? 'tabler:checks' : 'tabler:check'}
              className="chat-conv-item__read-icon"
              style={{ color: lastMsgIsRead ? '#0d6efd' : '#65676b' }}
            />
          )}
          <span className={`chat-conv-item__preview${unreadCount > 0 ? ' chat-conv-item__preview--bold' : ''}`}>
            {lastMessage}
          </span>
          {unreadCount > 0 && (
            <span className="chat-conv-item__badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contact search result row ──────────────────────────────────────────────
const ContactSearchItem = ({ user, isOnline, onStart }: { user: ChatUtilisateur; isOnline: boolean; onStart: () => void }) => {
  const photo = user.photo || user.photoUrl
  return (
    <div onClick={onStart} className="chat-contact-item">
      <div className="chat-contact-item__avatar-wrap">
        <div className="chat-contact-item__avatar">
          {photo ? (
            <img src={`${API_URL}${photo}`} alt="avatar" />
          ) : (
            <span style={{ textTransform: 'uppercase' }}>{getFirstTwoLetters(`${user.prenom} ${user.nom}`)}</span>
          )}
        </div>
        <span className={`chat-contact-item__online-dot${isOnline ? ' chat-contact-item__online-dot--on' : ''}`} />
      </div>
      <div className="flex-grow-1 overflow-hidden">
        <p className="chat-contact-item__name">{user.prenom} {user.nom}</p>
        <p className="chat-contact-item__email">{user.email}</p>
      </div>
    </div>
  )
}

// ── New Group Modal ────────────────────────────────────────────────────────
const NewGroupModal = ({
  show, onHide, groupName, setGroupName, groupSearch, setGroupSearch,
  searchResults, currentUserId, isUserOnline, groupParticipants, setGroupParticipants,
  onConfirm, creating,
}: {
  show: boolean; onHide: () => void
  groupName: string; setGroupName: (v: string) => void
  groupSearch: string; setGroupSearch: (v: string) => void
  searchResults: ChatUtilisateur[]; currentUserId: string
  isUserOnline: (id: number) => boolean
  groupParticipants: ChatUtilisateur[]
  setGroupParticipants: React.Dispatch<React.SetStateAction<ChatUtilisateur[]>>
  onConfirm: () => void; creating: boolean
}) => {
  const norm = (id: any) => String(id ?? '').toLowerCase().trim()
  const available = searchResults.filter(u =>
    norm(u.idUtilisateur) !== norm(currentUserId) &&
    !groupParticipants.some(p => p.idUtilisateur === u.idUtilisateur)
  )

  const toggle = (user: ChatUtilisateur) =>
    setGroupParticipants(prev =>
      prev.some(p => p.idUtilisateur === user.idUtilisateur)
        ? prev.filter(p => p.idUtilisateur !== user.idUtilisateur)
        : [...prev, user]
    )

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>
          <IconifyIcon icon="tabler:users-plus" className="me-2" style={{ color: '#0d6efd' }} />
          Nouveau Groupe
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '12px 20px 20px' }}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
            placeholder="Nom du groupe..." autoFocus className="chat-modal__input"
          />
        </div>

        {groupParticipants.length > 0 && (
          <div className="chat-modal__chip-list">
            {groupParticipants.map(u => (
              <span key={u.idUtilisateur} className="chat-modal__chip">
                {u.prenom} {u.nom}
                <button className="chat-modal__chip-remove" onClick={() => toggle(u)}>
                  <IconifyIcon icon="tabler:x" style={{ fontSize: 12 }} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="chat-modal__search-wrap">
          <IconifyIcon icon="tabler:search" className="chat-modal__search-icon" />
          <input
            type="text" value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
            placeholder="Ajouter des participants..." className="chat-modal__input chat-modal__input--search"
          />
        </div>

        <SimplebarReactClient style={{ maxHeight: 280 }}>
          {available.length === 0 ? (
            <div className="text-center py-3 text-muted"><p className="mb-0 fs-13">Aucun utilisateur trouvé</p></div>
          ) : available.map(user => {
            const online = isUserOnline(user.idUtilisateur)
            const photo = user.photo || user.photoUrl
            return (
              <div key={user.idUtilisateur} onClick={() => toggle(user)} className="chat-modal__user-item">
                <div className="chat-modal__user-avatar-wrap">
                  <div className="chat-modal__user-avatar">
                    {photo ? <img src={`${API_URL}${photo}`} alt="avatar" /> : <span style={{ textTransform: 'uppercase' }}>{getFirstTwoLetters(`${user.prenom} ${user.nom}`)}</span>}
                  </div>
                  <span className={`chat-modal__user-online${online ? ' chat-modal__user-online--on' : ''}`} />
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <p className="chat-modal__user-name">{user.prenom} {user.nom}</p>
                  <p className="chat-modal__user-email">{user.email}</p>
                </div>
                <IconifyIcon icon="tabler:circle-plus" className="chat-modal__add-icon" />
              </div>
            )
          })}
        </SimplebarReactClient>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #e4e6eb' }}>
        <div className="chat-modal__footer">
          <button onClick={onHide} className="chat-modal__cancel-btn">Annuler</button>
          <button
            onClick={onConfirm}
            disabled={!groupName.trim() || groupParticipants.length === 0 || creating}
            className="chat-modal__confirm-btn"
          >
            {creating ? 'Création...' : `Créer le groupe (${groupParticipants.length} membre${groupParticipants.length > 1 ? 's' : ''})`}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

// ── New Contact Modal ──────────────────────────────────────────────────────
const NewContactModal = ({
  show, onHide, searchResults, currentUserId, isUserOnline,
  contactSearch, setContactSearch, onStartChat,
}: {
  show: boolean; onHide: () => void
  searchResults: ChatUtilisateur[]; currentUserId: string
  isUserOnline: (id: number) => boolean
  contactSearch: string; setContactSearch: (v: string) => void
  onStartChat: (userId: number) => void
}) => {
  const norm = (id: any) => String(id ?? '').toLowerCase().trim()
  const filtered = searchResults.filter(u => norm(u.idUtilisateur) !== norm(currentUserId))

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>
          <IconifyIcon icon="tabler:user-plus" className="me-2" style={{ color: '#0d6efd' }} />
          Nouveau message
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '12px 20px 20px' }}>
        <div className="chat-modal__search-wrap">
          <IconifyIcon icon="tabler:search" className="chat-modal__search-icon" />
          <input
            autoFocus type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="chat-modal__input chat-modal__input--search"
            style={{ padding: '10px 12px 10px 34px', fontSize: 14 }}
          />
        </div>

        <SimplebarReactClient style={{ maxHeight: 400 }}>
          {filtered.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <IconifyIcon icon="tabler:users-minus" style={{ fontSize: 36, display: 'block', margin: '0 auto 10px', opacity: .4 }} />
              <p className="mb-0 fs-13">Aucun utilisateur trouvé</p>
            </div>
          ) : filtered.map(user => {
            const online = isUserOnline(user.idUtilisateur)
            const photo = user.photo || user.photoUrl
            return (
              <div key={user.idUtilisateur} className="d-flex align-items-center gap-3 py-2" style={{ borderBottom: '1px solid #e4e6eb' }}>
                <div className="chat-modal__user-avatar-wrap">
                  <div className="chat-modal__user-avatar-lg">
                    {photo ? <img src={`${API_URL}${photo}`} alt="avatar" /> : <span style={{ textTransform: 'uppercase' }}>{getFirstTwoLetters(`${user.prenom} ${user.nom}`)}</span>}
                  </div>
                  <span className={`chat-modal__user-online-lg${online ? ' chat-modal__user-online-lg--on' : ''}`} />
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <p className="chat-modal__user-name-lg">{user.prenom} {user.nom}</p>
                  <p className="chat-modal__user-email-lg">{user.email}</p>
                </div>
                <button
                  onClick={() => { onStartChat(user.idUtilisateur); onHide() }}
                  className="chat-modal__start-btn"
                >
                  Démarrer
                </button>
              </div>
            )
          })}
        </SimplebarReactClient>
      </Modal.Body>
    </Modal>
  )
}

export default Chat
