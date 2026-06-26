
import React from 'react'
import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import Timer from './component/Timer'
import { Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'

const ComingSoonPage = () => {
  return (

    <>
    <PageBreadcrumb title='Coming Soon' />
    <div className="auth-bg d-flex min-vh-100 justify-content-center align-items-center">
      <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
        <Col xl={4} lg={5} md={6}>
          <Card className="overflow-hidden text-center h-100 p-xxl-4 p-3 mb-0">
            <a href="/" className="auth-brand mb-3">
              <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
              <img src={logo} alt="logo light" height={26} className="logo-light" />
            </a>
            <div>
              <h3 className="fw-semibold mb-2">Stay tunned, we're launching very soon</h3>
              <p className="text-muted mb-0">We're making the system more awesome.</p>
            </div>
            <Timer />
            <p className="mt-3 mb-0">
              © XPARK GMAO - <span className="fw-bold text-uppercase fs-12">Tous droits réservés</span>
            </p>
          </Card>
        </Col>
      </Row>
    </div>
    </>

  )
}

export default ComingSoonPage