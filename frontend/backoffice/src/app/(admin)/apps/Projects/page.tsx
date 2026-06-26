;
import PageBreadcrumb from '@/components/PageBreadcrumb';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { Col, Row } from 'react-bootstrap';
import Head from './components/Head';
import Projects from './components/Projects';

const ProjectsPage = () => {
  return (
    <>
      <PageBreadcrumb title='Project' />
      <Head />
      <Projects />
      <Row className="align-items-center mb-3">
        <Col sm={6}>
          <div>
            <p className="fs-14 m-0 text-body text-muted">Showing <span className="text-body fw-semibold">6</span> Of <span className="text-body fw-semibold">52</span> projects</p>
          </div>
        </Col>
        <Col sm={6}>
          <div className="float-sm-end">
            <ul className="pagination pagination-boxed mb-sm-0">
              <li className="page-item disabled">
                <a href="#" className="page-link"><IconifyIcon icon='tabler:chevron-left' /></a>
              </li>
              <li className="page-item active">
                <a href="#" className="page-link">1</a>
              </li>
              <li className="page-item">
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

export default ProjectsPage