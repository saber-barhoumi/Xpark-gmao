import React from 'react'
import AllWizard from './components/AllWizard'

import PageBreadcrumb from '@/components/PageBreadcrumb'

// 

const WizardPage = () => {
  return (
    <>
      <PageBreadcrumb title='Wizard' />
      <AllWizard />
    </>
  )
}

export default WizardPage