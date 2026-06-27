
import { useEffect } from 'react'
import ChatData from './components/ChatData'
import PageBreadcrumb from '@/components/PageBreadcrumb'

const ChatPage = () => {
  useEffect(() => {
    const pageContent    = document.querySelector<HTMLElement>('.page-content')
    const containerFluid = pageContent?.querySelector<HTMLElement>('.container-fluid')
    const footer         = document.querySelector<HTMLElement>('.footer')

    // Lock the outer page so only internal chat panels scroll
    if (pageContent) {
      pageContent.style.height   = 'calc(100vh - var(--ct-topbar-height, 85px))'
      pageContent.style.overflow = 'hidden'
      pageContent.style.display  = 'flex'
      pageContent.style.flexDirection = 'column'
    }

    // Make container-fluid a flex column that fills the remaining height
    if (containerFluid) {
      containerFluid.style.flex          = '1'
      containerFluid.style.overflow      = 'hidden'
      containerFluid.style.minHeight     = '0'
      containerFluid.style.display       = 'flex'
      containerFluid.style.flexDirection = 'column'
      containerFluid.style.paddingTop    = '0'
      containerFluid.style.paddingBottom = '0'
    }

    // Hide footer — chat is full-screen
    if (footer) footer.style.display = 'none'

    return () => {
      if (pageContent) {
        pageContent.style.height        = ''
        pageContent.style.overflow      = ''
        pageContent.style.display       = ''
        pageContent.style.flexDirection = ''
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

  return (
    <>
      <PageBreadcrumb title='Chat' />
      <ChatData />
    </>
  )
}

export default ChatPage
