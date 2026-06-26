import IconifyIcon from '@/components/wrappers/IconifyIcon'
import React from 'react'
import { Card, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const Reminders = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">Upcoming Reminders</h4>
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
      <ul className="list-group mb-0 list-group-flush">
        <li className="list-group-item border-light">
          <div className="d-flex align-items-center gap-2">
            <div className="me-1">
              <IconifyIcon icon='ri:circle-fill' className="text-primary" />
            </div>
            <div>
              <h5 className="mb-1">Meet Manager</h5>
              <span className="text-muted fs-12 text-truncate d-block">February
                24, 2025 - 10:30am to 12:45pm</span>
            </div>
            <div className="ms-auto">
              <a href="#" className="text-decoration-underline fw-semibold ms-auto link-offset-2">View <i className="ti ti-arrow" /></a>
            </div>
          </div>
        </li>
        <li className="list-group-item border-light">
          <div className="d-flex align-items-center gap-2">
            <div className="me-1">
              <IconifyIcon icon='ri:circle-fill' className="text-success" />
            </div>
            <div>
              <h5 className="mb-1">Team Stand-Up</h5>
              <span className="text-muted fs-12 text-truncate d-block">February 25, 2025 - 9:00am to 9:30am</span>
            </div>
            <div className="ms-auto">
              <a href="#" className="text-decoration-underline fw-semibold ms-auto link-offset-2">View <i className="ti ti-arrow" /></a>
            </div>
          </div>
        </li>
        <li className="list-group-item border-light">
          <div className="d-flex align-items-center gap-2">
            <div className="me-1">
              <IconifyIcon icon='ri:circle-fill' className="text-danger" />
            </div>
            <div>
              <h5 className="mb-1">Client Presentation</h5>
              <span className="text-muted fs-12 text-truncate d-block">February 26, 2025 - 2:00pm to 4:00pm</span>
            </div>
            <div className="ms-auto">
              <a href="#" className="text-decoration-underline fw-semibold ms-auto link-offset-2">View <i className="ti ti-arrow" /></a>
            </div>
          </div>
        </li>
        <li className="list-group-item border-light">
          <div className="d-flex align-items-center gap-2">
            <div className="me-1">
              <IconifyIcon icon='ri:circle-fill' className="text-warning" />
            </div>
            <div>
              <h5 className="mb-1">Project Kickoff</h5>
              <span className="text-muted fs-12 text-truncate d-block">February 27, 2025 - 11:00am to 1:00pm</span>
            </div>
            <div className="ms-auto">
              <a href="#" className="text-decoration-underline fw-semibold ms-auto link-offset-2">View <i className="ti ti-arrow" /></a>
            </div>
          </div>
        </li>
        <li className="list-group-item border-light">
          <div className="d-flex align-items-center gap-2">
            <div className="me-1">
              <IconifyIcon icon='ri:circle-fill' className="text-info" />
            </div>
            <div>
              <h5 className="mb-1">Monthly Review</h5>
              <span className="text-muted fs-12 text-truncate d-block">February 28, 2025 - 3:00pm to 5:00pm</span>
            </div>
            <div className="ms-auto">
              <a href="#" className="text-decoration-underline fw-semibold ms-auto link-offset-2">View <i className="ti ti-arrow" /></a>
            </div>
          </div>
        </li>
      </ul>
    </Card>
  )
}

export default Reminders