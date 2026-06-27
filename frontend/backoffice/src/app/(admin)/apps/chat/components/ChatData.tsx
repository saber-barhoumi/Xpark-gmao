
import { useChatContext } from '@/context/useChatContext'
import { useChat } from '@/hooks/useChat'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { Card, Offcanvas, Spinner } from 'react-bootstrap'
import Chat from './Chat'
import ChatArea from './ChatArea'
import UserList from './UserList'

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
      <Card className="chat-fill flex-1" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Chargement du chat...</p>
        </div>
      </Card>
    )
  }

  if (!connected) {
    return (
      <Card className="chat-fill" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <i className="ri-wifi-off-line fs-1 text-danger"></i>
          <p className="mt-3 text-danger">Connexion au serveur perdue. Reconnexion en cours...</p>
        </div>
      </Card>
    )
  }

  return (
    /*
     * Card fills container-fluid (page.tsx forces flex-column).
     * overflow:hidden prevents the card from growing past the viewport.
     */
    <Card className="chat-fill" style={{ flex: 1, marginBottom: 0 }}>
      {/* Flex row that fills the card */}
      <div className="chat d-flex chat-fill">

        {/*
         * Desktop sidebar — CSS width transition (not React-Bootstrap Collapse).
         * d-xxl-flex propagates height correctly into Chat component.
         */}
        <div
          className="d-none d-xxl-flex flex-column chat-sidebar-container"
          style={{ width: chatList.open ? '340px' : '0' }}
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

        {/* Chat area */}
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

        {/* Online users sidebar — desktop only */}
        <div className="d-none d-xxl-block border-start chat-fill" style={{ minWidth: '260px' }}>
          <UserList onlineUsers={onlineUsers} onStartChat={createPrivateChat} />
        </div>
      </div>
    </Card>
  )
}

export default ChatData
