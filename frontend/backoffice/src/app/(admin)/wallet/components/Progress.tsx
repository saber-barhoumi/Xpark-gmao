import IconifyIcon from '@/components/wrappers/IconifyIcon'
import React from 'react'
import { Card, CardBody, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const Progress = () => {
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">Progress Bars</h4>
        <Dropdown className="float-end">
          <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
            <IconifyIcon icon='ri:more-2-fill' className="fs-18" />
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <DropdownItem>Sales Report</DropdownItem>
            <DropdownItem>Export Report</DropdownItem>
            <DropdownItem>Profit</DropdownItem>
            <DropdownItem>Action</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardBody>
        <h5 className="mt-0">iMacs <span className="text-primary float-end">80%</span></h5>
        <div className="progress progress-soft progress-sm mt-0 mb-3">
          <div className="progress-bar bg-primary" role="progressbar" aria-valuenow={80} aria-valuemin={0} aria-valuemax={100} style={{ width: '80%' }}>
          </div>
        </div>
        <h5 className="mt-0">iBooks <span className="text-secondary float-end">50%</span></h5>
        <div className="progress progress-soft progress-sm mt-0 mb-3">
          <div className="progress-bar bg-secondary" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} style={{ width: '50%' }}>
          </div>
        </div>
        <h5 className="mt-0">iPhone 5s <span className="text-info float-end">70%</span></h5>
        <div className="progress progress-soft progress-sm mt-0 mb-3">
          <div className="progress-bar bg-info" role="progressbar" aria-valuenow={70} aria-valuemin={0} aria-valuemax={100} style={{ width: '70%' }}>
          </div>
        </div>
        <h5 className="mt-0">iPhone 6 <span className="text-warning float-end">65%</span></h5>
        <div className="progress progress-soft progress-sm mt-0 mb-3">
          <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} style={{ width: '65%' }}>
          </div>
        </div>
        <h5 className="mt-0">iPhone 4 <span className="text-danger float-end">65%</span></h5>
        <div className="progress progress-soft progress-sm mt-0 mb-3">
          <div className="progress-bar bg-danger" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} style={{ width: '65%' }}>
          </div>
        </div>
        <h5 className="mt-0">iPhone 6s <span className="text-success float-end">40%</span></h5>
        <div className="progress progress-soft progress-sm mt-0">
          <div className="progress-bar bg-success" role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100} style={{ width: '40%' }}>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default Progress