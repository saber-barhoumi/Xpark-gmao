
import { useEffect } from 'react'
import ChatData from './components/ChatData'
import PageBreadcrumb from '@/components/PageBreadcrumb'

const ChatPage = () => {
  useEffect(() => {
    // Hide footer and lock page scroll for full-screen chat layout
    const footer = document.querySelector<HTMLElement>('.footer')
    const pageContent = document.querySelector<HTMLElement>('.page-content')
    if (footer) footer.style.display = 'none'
    if (pageContent) {
      pageContent.style.overflow = 'hidden'
      pageContent.style.display = 'flex'
      pageContent.style.flexDirection = 'column'
    }
    return () => {
      if (footer) footer.style.display = ''
      if (pageContent) {
        pageContent.style.overflow = ''
        pageContent.style.display = ''
        pageContent.style.flexDirection = ''
      }
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
