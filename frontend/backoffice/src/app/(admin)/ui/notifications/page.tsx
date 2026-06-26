import React from 'react'
import AllNotifications from './components/AllNotifications'

import PageBreadcrumb from '@/components/PageBreadcrumb'

const Notifications = () => {
  return (
    <>
      <PageBreadcrumb title='Notifications' />
      <AllNotifications />
    </>
  )
}

export default Notifications