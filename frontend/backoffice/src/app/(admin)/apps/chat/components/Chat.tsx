
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { useChatContext } from '@/context/useChatContext'
import { Conversation, ChatUtilisateur } from '@/services/chatService'
import { getFirstTwoLetters } from '@/utils/change-casing'

import { Fragment, useState, useEffect } from 'react'
import { CardBody, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

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

  // Trigger search when searchTerm changes
  // Search contacts when modal is open
  useEffect(() => {
    if (showNewContactModal) {
      const timer = setTimeout(() => {
        searchUsers(contactSearch)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [contactSearch, showNewContactModal, searchUsers])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, searchUsers])

  const normalizeId = (id: any): string => String(id ?? '').toLowerCase().trim();

  // Get the display name for a conversation
  const getDisplayName = (conv: Conversation): string => {
    if (conv.typeConversation === 'GROUPE') {
      return conv.titre || 'Groupe'
    }
    const otherParticipant = conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))
    if (otherParticipant?.utilisateur) {
      return `${otherParticipant.utilisateur.prenom} ${otherParticipant.utilisateur.nom}`
    }
    return 'Utilisateur'
  }

  // Get the other user's ID (for private conversations)
  const getOtherUserId = (conv: Conversation): number => {
    const other = conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))
    return other?.utilisateurId || 0
  }

  // Format time display
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

  // Get last message preview
  const getLastMessage = (conv: Conversation): string => {
    if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1]
      if (lastMsg.estSupprime) return 'Message supprimé'
      if (lastMsg.typeMessage === 'IMAGE') return '📷 Image'
      if (lastMsg.typeMessage === 'FICHIER') return '📎 Fichier'
      if (lastMsg.typeMessage === 'APPEL') {
        try {
          const data = JSON.parse(lastMsg.contenu)
          return `${data.icon || '📞'} ${data.label || 'Appel'}`
        } catch { return '📞 Appel' }
      }
      return lastMsg.contenu
    }
    return 'Aucun message'
  }

  // Get unread count
  const getUnreadCount = (conv: Conversation): number => {
    if (!conv.messages) return 0
    return conv.messages.filter(m => !m.estLu && normalizeId(m.expediteurId) !== normalizeId(currentUserId)).length
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const name = getDisplayName(conv).toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  // Failsafe: Filter duplicates (only keep one conversation per other user)
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

  // Bug 1 Fix — Sort by activity (descending)
  uniqueConversations.sort((a, b) => {
    const getTimestamp = (c: Conversation) => {
      const d1 = c.dernierMessageDate ? new Date(c.dernierMessageDate).getTime() : 0;
      const d2 = (c.messages && c.messages.length > 0) ? new Date(c.messages[c.messages.length - 1].dateEnvoi).getTime() : 0;
      const d3 = c.dateCreation ? new Date(c.dateCreation).getTime() : 0;
      
      const val = Math.max(
        isNaN(d1) ? 0 : d1,
        isNaN(d2) ? 0 : d2,
        isNaN(d3) ? 0 : d3
      );
      return val || 0;
    };
    return getTimestamp(b) - getTimestamp(a);
  });

  // Filter search results - only show users NOT in existing conversations if they match searchTerm
  const finalSearchResults = searchResults.filter(user => {
    // Ne pas montrer l'utilisateur courant
    if (normalizeId(user.idUtilisateur) === normalizeId(currentUserId)) return false
    // Ne pas montrer si déjà une conversation privée existante
    return !conversations.some(c => 
      c.typeConversation === 'PRIVEE' && 
      c.participants.some(p => normalizeId(p.utilisateurId) === normalizeId(user.idUtilisateur))
    )
  })

  // Separate pinned and all conversations
  const pinnedConversations = uniqueConversations.filter(conv =>
    conv.participants.some(p => normalizeId(p.utilisateurId) === normalizeId(currentUserId) && p.estEpingle)
  )
  const otherConversations = uniqueConversations.filter(conv =>
    !conv.participants.some(p => normalizeId(p.utilisateurId) === normalizeId(currentUserId) && p.estEpingle)
  )

  // Get the current user info from any conversation
  const currentUser = conversations.length > 0
    ? conversations[0].participants.find(p => normalizeId(p.utilisateurId) === normalizeId(currentUserId))?.utilisateur
    : null

  return (
    <div className="chat-user-list border-end">
      <CardBody className="py-2 px-3 border-bottom">
        <div className="d-flex align-items-center gap-2 py-1">
          <div className="chat-users">
            <div className="avatar-lg chat-avatar-online">
              <div className="h-100 w-100 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center overflow-hidden">
                {currentUser?.photo || currentUser?.photoUrl ? (
                  <img 
                    src={`${API_URL}${currentUser.photo || currentUser.photoUrl}`} 
                    alt="avatar" 
                    className="h-100 w-100 rounded-circle" 
                    style={{ objectFit: 'cover' }} 
                  />
                ) : (
                  <span className="fw-semibold text-uppercase">{currentUser ? getFirstTwoLetters(`${currentUser.prenom} ${currentUser.nom}`) : 'ME'}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-0">
              <Link to="" className="text-reset lh-base">{currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Moi'}</Link>
            </h5>
            <p className="mb-0 text-muted">En ligne</p>
          </div>
          <Dropdown className="lh-1" align={'end'}>
            <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
              <IconifyIcon width={20} height={20} icon="solar:settings-outline" className="align-middle" />
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem onClick={() => { setShowNewContactModal(true); setContactSearch(''); searchUsers(''); }}>
                <IconifyIcon icon='tabler:user-plus' className="me-1 fs-17 align-middle" />
                <span className="align-middle">Nouveau Contact</span>
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon='tabler:users-plus' className="me-1 fs-17 align-middle" />
                <span className="align-middle">Nouveau Groupe</span>
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon='tabler:star' className="me-1 fs-17 align-middle" />
                <span className="align-middle">Favoris</span>
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon='tabler:archive' className="me-1 fs-17 align-middle" />
                <span className="align-middle">Archivés</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <button onClick={chatSetting.toggle} type="button" className="flex-grow-0 btn btn-sm btn-icon btn-soft-danger d-xl-none" data-bs-dismiss="offcanvas" data-bs-target="#chatUserList" aria-label="Close">
            <IconifyIcon icon='tabler:x' className="fs-20" />
          </button>
        </div>
      </CardBody>

      <div className="d-flex flex-column chat">
        <SimplebarReactClient className="users-list position-relative list-scroll">
          {/* Search */}
          <div className="px-3 py-2">
            <div className="app-search py-1">
              <input
                type="text"
                className="form-control border-light bg-light bg-opacity-50 rounded-2"
                placeholder="Rechercher une conversation ou un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <IconifyIcon icon='tabler:search' className="app-search-icon text-muted fs-16" />
            </div>
          </div>

          {/* Search Results (Global Contacts) */}
          {searchTerm && finalSearchResults.length > 0 && (
            <>
              <div className="d-flex align-items-center px-3 py-2 bg-body-secondary position-sticky top-0 z-1">
                <IconifyIcon icon="tabler:users-search" className="fs-18 text-muted" />
                <h5 className="mb-0 ms-1 fw-semibold fs-14">Contacts trouvés</h5>
              </div>
              {finalSearchResults.map((user) => (
                <div 
                  key={user.idUtilisateur} 
                  className="chat-users" 
                  onClick={() => {
                    onStartChat(user.idUtilisateur)
                    setSearchTerm('')
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`avatar-md ${isUserOnline(user.idUtilisateur) ? 'chat-avatar-online' : 'chat-avatar-offline'}`}>
                    <div className="h-100 w-100 rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center overflow-hidden">
                      {user.photo || user.photoUrl ? (
                        <img 
                          src={`${API_URL}${user.photo || user.photoUrl}`} 
                          alt="avatar" 
                          className="h-100 w-100 rounded-circle" 
                          style={{ objectFit: 'cover' }} 
                        />
                      ) : (
                        <span className="fw-semibold text-uppercase">{getFirstTwoLetters(`${user.prenom} ${user.nom}`)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <h5 className="mt-0 mb-0 fs-13">{user.prenom} {user.nom}</h5>
                    <p className="mt-1 mb-0 text-muted lh-1 text-truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Pinned conversations */}
          {pinnedConversations.length > 0 && (
            <>
              <div className="d-flex align-items-center px-3 py-2 bg-body-secondary position-sticky top-0 z-1">
                <IconifyIcon icon="solar:pin-bold-duotone" className="fs-18 text-muted" />
                <h5 className="mb-0 ms-1 fw-semibold fs-14">Épinglés</h5>
              </div>
              {pinnedConversations.map((conv) => renderConversationItem(conv))}
            </>
          )}

          {/* All messages */}
          <div className="d-flex align-items-center px-3 py-2 bg-body-secondary position-sticky top-0 z-1">
            <IconifyIcon icon="solar:chat-line-bold-duotone" className="fs-18 text-muted" />
            <h5 className="mb-0 ms-1 fw-semibold fs-14">Tous les messages</h5>
          </div>
          {otherConversations.length === 0 && pinnedConversations.length === 0 && !searchTerm && (
            <div className="text-center p-4">
              <p className="text-muted">Aucune conversation trouvée</p>
            </div>
          )}
          {otherConversations.map((conv) => renderConversationItem(conv))}
        </SimplebarReactClient>
      </div>

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

  function renderConversationItem(conv: Conversation) {
    const displayName = getDisplayName(conv)
    const isActive = activeConversation?.idConversation === conv.idConversation
    const unreadCount = getUnreadCount(conv)
    const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null
    const isOnline = conv.typeConversation === 'PRIVEE' ? isUserOnline(getOtherUserId(conv)) : false

    return (
      <Fragment key={conv.idConversation}>
        <div className="text-body d-block" style={{ cursor: 'pointer' }}>
          <div className={`chat-users ${isActive && 'active'}`} onClick={() => onSelectConversation(conv)}>
            <div className={`avatar-md ${isOnline ? 'chat-avatar-online' : 'chat-avatar-offline'}`}>
              {conv.typeConversation === 'GROUPE' ? (
                <div className="h-100 w-100 rounded-circle bg-warning text-white d-flex align-items-center justify-content-center">
                  <IconifyIcon icon="tabler:users" className="fs-20" />
                </div>
              ) : (
                <div className="h-100 w-100 rounded-circle bg-info text-white d-flex align-items-center justify-content-center overflow-hidden">
                  {(() => {
                    const otherPart = conv.participants.find(p => normalizeId(p.utilisateurId) !== normalizeId(currentUserId))?.utilisateur;
                    const photo = otherPart?.photo || otherPart?.photoUrl;
                    return photo ? (
                      <img 
                        src={`${API_URL}${photo}`} 
                        alt="avatar" 
                        className="h-100 w-100 rounded-circle" 
                        style={{ objectFit: 'cover' }} 
                      />
                    ) : (
                      <span className="fw-semibold text-uppercase">{getFirstTwoLetters(displayName)}</span>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <h5 className="mt-0 mb-0 fs-13">
                <span className="float-end text-muted fs-12">
                  {formatTime(lastMessage?.dateEnvoi || conv.dernierMessageDate || conv.dateCreation)}
                </span>
                {displayName}
              </h5>
              <p className="mt-1 mb-0 text-muted lh-1">
                {unreadCount > 0 && (
                  <span className="w-25 float-end text-end">
                    <span className="badge bg-danger-subtle text-danger">{unreadCount}</span>
                  </span>
                )}
                {unreadCount === 0 && lastMessage && normalizeId(lastMessage.expediteurId) === normalizeId(currentUserId) && (
                  <span className="w-25 text-end float-end text-success">
                    <IconifyIcon icon={lastMessage.estLu ? "tabler:checks" : "tabler:check"} />
                  </span>
                )}
                <span className="w-75 d-inline-block text-truncate overflow-hidden">
                  {getLastMessage(conv)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}

// ── Modal Nouveau Contact ──────────────────────────────────────
const NewContactModal = ({ 
  show, 
  onHide, 
  searchResults, 
  currentUserId, 
  isUserOnline,
  contactSearch,
  setContactSearch,
  onStartChat 
}: {
  show: boolean
  onHide: () => void
  searchResults: ChatUtilisateur[]
  currentUserId: string
  isUserOnline: (userId: number) => boolean
  contactSearch: string
  setContactSearch: (v: string) => void
  onStartChat: (userId: number) => void
}) => {
  const normalizeId = (id: any): string => String(id ?? '').toLowerCase().trim();
  const filteredUsers = searchResults.filter(u => normalizeId(u.idUtilisateur) !== normalizeId(currentUserId))

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <IconifyIcon icon="tabler:user-plus" className="me-2" />
          Nouveau Contact
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="app-search mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher par nom ou email..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            autoFocus
          />
          <IconifyIcon icon='tabler:search' className="app-search-icon text-muted fs-16" />
        </div>
        <SimplebarReactClient style={{ maxHeight: 400 }}>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <IconifyIcon icon="tabler:users-minus" className="fs-32 d-block mx-auto mb-2 opacity-50" />
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredUsers.map(user => {
                const online = isUserOnline(user.idUtilisateur)
                return (
                  <div
                    key={user.idUtilisateur}
                    className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2 border-0 rounded"
                  >
                    <div className={`avatar-md ${online ? 'chat-avatar-online' : 'chat-avatar-offline'}`}>
                      <div className="h-100 w-100 rounded-circle bg-info text-white d-flex align-items-center justify-content-center overflow-hidden">
                        {user.photo || user.photoUrl ? (
                          <img 
                            src={`${API_URL}${user.photo || user.photoUrl}`} 
                            alt="avatar" 
                            className="h-100 w-100 rounded-circle" 
                            style={{ objectFit: 'cover' }} 
                          />
                        ) : (
                          <span className="fw-semibold text-uppercase" style={{ fontSize: '0.75rem' }}>
                            {getFirstTwoLetters(`${user.prenom} ${user.nom}`)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="mb-0">{user.prenom} {user.nom}</h6>
                      <p className="mb-0 text-muted small text-truncate">{user.email}</p>
                    </div>
                    <button
                      className="btn btn-sm btn-soft-primary"
                      onClick={() => {
                        onStartChat(user.idUtilisateur)
                        onHide()
                      }}
                    >
                      <IconifyIcon icon="tabler:message-circle" className="me-1" />
                      Démarrer
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </SimplebarReactClient>
      </Modal.Body>
    </Modal>
  )
}

export default Chat