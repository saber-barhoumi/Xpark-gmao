import React from 'react'
import { state2Data, State2Type } from '../data'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ProgressBar, Row } from 'react-bootstrap'

const StateCard = ({ color, count, icon, progress, title, value }: State2Type) => {
  return (
    <Card>
      <div className="d-flex card-header justify-content-between align-items-center">
        <div>
          <h4 className="header-title">{title}</h4>
        </div>
        <Dropdown align={'end'}>
          <DropdownToggle as={'a'}  className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
            <IconifyIcon icon='ri:more-2-fill' className="fs-18" />
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <DropdownItem>Sales Report</DropdownItem>
            <DropdownItem>Export Report</DropdownItem>
            <DropdownItem>Profit</DropdownItem>
            <DropdownItem>Action</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      <CardBody className="pt-0">
        <div className="d-flex align-items-center gap-2 justify-content-between">
          <span className={`badge bg-${color} rounded-pill fs-13`}>{count} <IconifyIcon icon={icon} /> </span>
          <div className="text-end">
            <h3 className="fw-semibold">{value}</h3>
            <p className="text-muted mb-0">Since last month</p>
          </div>
        </div>
          <ProgressBar variant={color} className={`progress-soft progress-sm mt-3`}   now={progress} role="progressbar" aria-valuenow={80} aria-valuemin={0} aria-valuemax={100}/>
      </CardBody>
    </Card>
  )
}

const State2 = () => {
  return (
    <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
      {
        state2Data.map((item, idx) => {
          return (
            <Col key={idx}>
              <StateCard {...item} />
            </Col>
          )
        })
      }
    </Row>
  )
}

export default State2