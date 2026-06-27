
import { useChatContext } from '@/context/useChatContext'
import { useChat } from '@/hooks/useChat'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { Card, Offcanvas, Spinner } from 'react-bootstrap'
import Chat from './Chat'
import ChatArea from './ChatArea'
import UserList from './UserList'

// Shared style: fills parent, clips overflow so only inner panels scroll
const FILL: React.CSSProperties = { height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }

const ChatData = () => {
  const currentUserId = useCurrentUserId()
  const {
    conversations, activeConversation, messages, onlineUsers,
    loading, connected, selectConversation, sendMessage, sendFile,
    typing, createPrivateChat, searchUsers, searchResults,
    isUserTyping, isUserOnline, deleteMessage, pinMessage, refreshConversations,
  } = useChat()

  const { chatList, chatSetting } = useChatContext()

  if (loading) {
    return (
      <Card className="flex-1" style={{ flex: 1, ...FILL, justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Chargement du chat...</p>
        </div>
      </Card>
    )
  }

  if (!connected) {
    return (
      <Card style={{ flex: 1, ...FILL, justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <i className="ri-wifi-off-line fs-1 text-danger"></i>
          <p className="mt-3 text-danger">Connexion au serveur perdue. Reconnexion en cours...</p>
        </div>
      </Card>
    )
  }

  return (
    /*
     * Card takes flex: 1 to fill container-fluid (which page.tsx forces to
     * display:flex flex-direction:column). overflow:hidden prevents the card
     * from growing past the viewport — only internal panels scroll.
     */
    <Card style={{ flex: 1, ...FILL, marginBottom: 0 }}>
      {/* .chat is a flex row that fills the card */}
      <div className="chat d-flex" style={{ height: '100%', overflow: 'hidden' }}>

        {/*
         * Desktop sidebar — CSS width transition replaces React-Bootstrap Collapse.
         * Collapse broke the height chain (its root div is display:block with no
         * explicit height, so height:100% inside Chat resolved to 0).
         * d-xxl-flex gives display:flex !important at ≥1400px so height:100%
         * from the flex-stretch parent propagates correctly into Chat.
         */}
        <div
          className="d-none d-xxl-flex flex-column"
          style={{
            height: '100%',
            width: chatList.open ? '340px' : '0',
            minWidth: '0',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.3s ease',
          }}
        >
          <Chat
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={selectConversation}
            isUserOnline={isUserOnline}
            currentUserId={currentUserId}
            searchUsers={searchUsers}
            searchResults={searchResults}
            onStartChat={createPrivateChat}
            refreshConversations={refreshConversations}
          />
        </div>

        {/* ── Mobile: Offcanvas sidebar ── */}
        <Offcanvas
          show={chatSetting.open}
          onHide={chatSetting.toggle}
          className="offcanvas-xxl offcanvas-start"
          tabIndex={-1}
          id="chatUserList"
          aria-labelledby="chatUserListLabel"
        >
          <Chat
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={selectConversation}
            isUserOnline={isUserOnline}
            currentUserId={currentUserId}
            searchUsers={searchUsers}
            searchResults={searchResults}
            onStartChat={createPrivateChat}
            refreshConversations={refreshConversations}
          />
        </Offcanvas>

        {/* ── Chat area — ChatArea already uses h-100 d-flex flex-column ── */}
        {activeConversation ? (
          <ChatArea
            conversation={activeConversation}
            messages={messages}
            onSendMessage={sendMessage}
            onSendFile={sendFile}
            onTyping={typing}
            isUserTyping={isUserTyping(activeConversation.idConversation)}
            currentUserId={currentUserId}
            isUserOnline={isUserOnline}
            onDeleteMessage={deleteMessage}
            onPinMessage={pinMessage}
            conversationsList={conversations}
            refreshConversations={refreshConversations}
          />
        ) : (
          <div className="d-flex align-items-center justify-content-center" style={{ flex: 1 }}>
            <div className="text-center">
              <i className="ri-message-3-line" style={{ fontSize: '4rem', color: '#adb5bd' }}></i>
              <p className="text-muted mt-3 fs-16">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}

        {/* ── Online users sidebar — desktop only ── */}
        <div className="d-none d-xxl-block border-start" style={{ minWidth: '260px', ...FILL }}>
          <UserList
            onlineUsers={onlineUsers}
            onStartChat={createPrivateChat}
          />
        </div>
      </div>
    </Card>
  )
}

export default ChatData
