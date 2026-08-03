import { createContext, useContext, useState } from 'react'
import type { ChildrenType } from '@/types/component-props'
import { ChatContextType, ChatOffcanvasStatesType, OffcanvasControlType } from '@/types/layout'

/**
 * Contexte d'affichage de la messagerie : il ne gère que l'ouverture des
 * panneaux latéraux (liste des conversations, profil, réglages).
 *
 * Il portait aussi un `activeChat` alimenté par `getUserById('101')` — un
 * utilisateur de DÉMONSTRATION chargé à chaque montage, qu'aucun composant
 * ne consommait. Les conversations réelles viennent de chatService/SignalR ;
 * ce résidu a donc été retiré.
 */
const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext can only be used within ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }: ChildrenType) => {
  const [offcanvasStates, setOffcanvasStates] = useState<ChatOffcanvasStatesType>({
    showChatList: true,
    showUserSetting: false,
    showUserProfile: false,
  })

  const toggleChatList: OffcanvasControlType['toggle'] = () => {
    setOffcanvasStates({ ...offcanvasStates, showChatList: !offcanvasStates.showChatList })
  }

  const toggleUserProfile: OffcanvasControlType['toggle'] = () => {
    setOffcanvasStates({ ...offcanvasStates, showUserProfile: !offcanvasStates.showUserProfile })
  }

  const toggleUserSetting: OffcanvasControlType['toggle'] = () => {
    setOffcanvasStates({ ...offcanvasStates, showUserSetting: !offcanvasStates.showUserSetting })
  }

  const chatList: ChatContextType['chatList'] = {
    open: offcanvasStates.showChatList,
    toggle: toggleChatList,
  }

  const chatProfile: ChatContextType['chatProfile'] = {
    open: offcanvasStates.showUserProfile,
    toggle: toggleUserProfile,
  }

  const chatSetting: ChatContextType['chatSetting'] = {
    open: offcanvasStates.showUserSetting,
    toggle: toggleUserSetting,
  }

  return (
    <ChatContext.Provider value={{ chatSetting, chatList, chatProfile }}>
      {children}
    </ChatContext.Provider>
  )
}
