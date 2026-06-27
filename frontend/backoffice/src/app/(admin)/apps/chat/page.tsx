
import { useEffect } from 'react'
import ChatData from './components/ChatData'

const ChatPage = () => {
  useEffect(() => {
    const pageContent    = document.querySelector<HTMLElement>('.page-content')
    const containerFluid = pageContent?.querySelector<HTMLElement>('.container-fluid')
    const footer         = document.querySelector<HTMLElement>('.footer')

    // Lock page-content to viewport height — no main-page scroll
    if (pageContent) {
      pageContent.style.height        = 'calc(100vh - var(--ct-topbar-height, 85px))'
      pageContent.style.minHeight     = '0'
      pageContent.style.overflow      = 'hidden'
      pageContent.style.display       = 'flex'
      pageContent.style.flexDirection = 'column'
      pageContent.style.paddingTop    = '0'
      pageContent.style.paddingBottom = '0'
    }

    // container-fluid becomes the sole flex child that fills page-content
    if (containerFluid) {
      containerFluid.style.flex          = '1'
      containerFluid.style.overflow      = 'hidden'
      containerFluid.style.minHeight     = '0'
      containerFluid.style.display       = 'flex'
      containerFluid.style.flexDirection = 'column'
      containerFluid.style.paddingTop    = '0'
      containerFluid.style.paddingBottom = '0'
    }

    if (footer) footer.style.display = 'none'

    return () => {
      if (pageContent) {
        pageContent.style.height        = ''
        pageContent.style.minHeight     = ''
        pageContent.style.overflow      = ''
        pageContent.style.display       = ''
        pageContent.style.flexDirection = ''
        pageContent.style.paddingTop    = ''
        pageContent.style.paddingBottom = ''
      }
      if (containerFluid) {
        containerFluid.style.flex          = ''
        containerFluid.style.overflow      = ''
        containerFluid.style.minHeight     = ''
        containerFluid.style.display       = ''
        containerFluid.style.flexDirection = ''
        containerFluid.style.paddingTop    = ''
        containerFluid.style.paddingBottom = ''
      }
      if (footer) footer.style.display = ''
    }
  }, [])

  return <ChatData />
}

export default ChatPage
