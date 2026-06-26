import React from 'react'
import { remindersData } from '../data'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const Reminders = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">Upcoming Reminders</h4>
        <Dropdown>
          <DropdownToggle as={'a'} href="#" className=" drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
            <IconifyIcon icon='ri:"more-2-fill' className="fs-18" />
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
        {
          remindersData.map((item, idx) => (
            <li className="list-group-item border-light" key={idx}>
              <div className="d-flex align-items-center gap-2">
                <div className="me-1">
                  <IconifyIcon width={16} height={16} icon='ri:circle-fill' className={`text-${item.status}`} />
                </div>
                <div>
                  <h5 className="mb-1">{item.title}</h5>
                  <span className="text-muted fs-12 text-truncate d-block">{item.date} - {item.time}</span>
                </div>
                <div className="ms-auto">
                  <a href="#" className="text-decoration-underline fw-semibold ms-auto link-offset-2">View <IconifyIcon icon='tabler:arrow' /></a>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </Card>
  )
}

export default Reminders