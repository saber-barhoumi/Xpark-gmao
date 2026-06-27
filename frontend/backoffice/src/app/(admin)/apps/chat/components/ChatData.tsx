
import { useChatContext } from '@/context/useChatContext'
import { useChat } from '@/hooks/useChat'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { Card, Collapse, Offcanvas, Spinner } from 'react-bootstrap'
import Chat from './Chat'
import ChatArea from './ChatArea'
import UserList from './UserList'

// Full height = viewport minus sticky topbar (CSS variable set by theme)
const CHAT_HEIGHT = 'calc(100vh - var(--ct-topbar-height, 85px))'

const ChatData = () => {
  const currentUserId = useCurrentUserId()
  const {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    loading,
    connected,
    selectConversation,
    sendMessage,
    sendFile,
    typing,
    createPrivateChat,
    searchUsers,
    searchResults,
    isUserTyping,
    isUserOnline,
    deleteMessage,
    pinMessage,
    refreshConversations,
  } = useChat()

  const { chatList, chatSetting } = useChatContext()

  if (loading) {
    return (
      <Card style={{ height: CHAT_HEIGHT, overflow: 'hidden' }}>
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Chargement du chat...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!connected) {
    return (
      <Card style={{ height: CHAT_HEIGHT, overflow: 'hidden' }}>
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="text-center">
            <i className="ri-wifi-off-line fs-1 text-danger"></i>
            <p className="mt-3 text-danger">Connexion au serveur perdue. Reconnexion en cours...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    // Height is on the Card so all children can use height: 100%
    <Card style={{ height: CHAT_HEIGHT, overflow: 'hidden', marginBottom: 0 }}>
      <div className="chat d-flex" style={{ height: '100%' }}>

        {/* Desktop: Collapsible sidebar — must be full height */}
        <div className="d-none d-xxl-block" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Collapse in={chatList.open} dimension="width">
            {/* This div IS the Collapse element — must carry height */}
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          </Collapse>
        </div>

        {/* Mobile: Offcanvas sidebar */}
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

        {/* Chat Area — already uses h-100 internally */}
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
          <Card className="chat-content rounded-0 shadow-none mb-0" style={{ flex: 1, height: '100%' }}>
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <i className="ri-message-3-line" style={{ fontSize: '4rem', color: '#adb5bd' }}></i>
                <p className="text-muted mt-3 fs-16">Sélectionnez une conversation pour commencer</p>
              </div>
            </div>
          </Card>
        )}

        {/* Online Users Sidebar — desktop only, full height */}
        <div className="d-none d-xxl-block border-start" style={{ minWidth: '260px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
