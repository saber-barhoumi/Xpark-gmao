import React from 'react'
import Contacts from './components/Contacts'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardHeader, Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'


// 

const ContactPage = () => {
  return (
    <>
      <PageBreadcrumb title='Contact' />
      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="justify-content-between d-flex gap-2">
              <a href="" className="btn btn-danger">
                <IconifyIcon icon='tabler:circle-plus' className="fs-20 me-2" /> Add New
              </a>
              <form className="d-flex align-items-start flex-wrap justify-content-sm-end gap-2">
                <div className="d-flex align-items-start flex-wrap">
                  <label htmlFor="membersearch-input" className="visually-hidden">Search</label>
                  <input type="search" className="form-control" id="membersearch-input" placeholder="Search..." />
                </div>
                <button type="button" className="btn btn-success">
                  <IconifyIcon icon='tabler:settings' className="fs-20" />
                </button>
              </form>
            </CardHeader>
          </Card>
        </Col>
      </Row>
      <Contacts />
      <Row className=" align-items-center mb-3">
        <Col sm={6}>
          <div>
            <p className="fs-14 m-0 text-body text-muted">Showing <span className="text-body fw-semibold">12</span> Of <span className="text-body fw-semibold">229</span> members</p>
          </div>
        </Col>
        <Col sm={6}>
          <div className="float-sm-end">
            <ul className="pagination pagination-rounded mb-sm-0">
              <li className="page-item disabled">
                <a href="#" className="page-link"><IconifyIcon icon='tabler:chevron-left' /></a>
              </li>
              <li className="page-item">
                <a href="#" className="page-link">1</a>
              </li>
              <li className="page-item active">
                <a href="#" className="page-link">2</a>
              </li>
              <li className="page-item">
                <a href="#" className="page-link">3</a>
              </li>
              <li className="page-item">
                <a href="#" className="page-link">4</a>
              </li>
              <li className="page-item">
                <a href="#" className="page-link">5</a>
              </li>
              <li className="page-item">
                <a href="#" className="page-link"><IconifyIcon icon='tabler:chevron-right' /></a>
              </li>
            </ul>
          </div>
        </Col>
      </Row>
    </>


  )
}

export default ContactPage