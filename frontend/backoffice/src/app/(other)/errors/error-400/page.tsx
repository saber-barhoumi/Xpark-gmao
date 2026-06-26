import logoDark from '@/assets/images/logo-dark.png'
import logo from '@/assets/images/logo.png'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

import { Card, Col, Row } from 'react-bootstrap'

const Error400Page = () => {
  return (
    <>
    <PageBreadcrumb title='Error 400' />
    <div className="auth-bg d-flex min-vh-100">
      <Row className="g-0 justify-content-center w-100 m-xxl-5 px-xxl-4 m-3">
        <Col xxl={3} lg={5} md={6}>
          <a href="/" className="auth-brand d-flex justify-content-center mb-2">
            <img src={logoDark} alt="dark logo" height={26} className="logo-dark" />
            <img src={logo} alt="logo light" height={26} className="logo-light" />
          </a>
          <p className="fw-semibold mb-4 text-center text-muted fs-15">XPARK GMAO - Portail Administration</p>
          <Card className="overflow-hidden text-center p-xxl-4 p-3 mb-0">
            <div className="text-center">
              <h1 className="text-error">400</h1>
              <h3 className="mt-3 mb-2">Bed Request !</h3>
              <p className="text-muted mb-3">The server could not understand the request due to invalid syntax. Please check your input and try again.</p>
              <a href="/" className="btn btn-danger">
                <IconifyIcon width={16} height={16} icon='tabler:home' className="=fs-16 me-1" /> Back to Home
              </a>
            </div>
          </Card>
          <p className="mt-4 text-center mb-0">
            © XPARK GMAO - <span className="fw-bold text-uppercase fs-12">Tous droits réservés</span>
          </p>
        </Col>
      </Row>
    </div>
    </>
  )
}

export default Error400Page