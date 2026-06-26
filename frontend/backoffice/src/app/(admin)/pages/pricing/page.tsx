import React from 'react'
import { pricingData } from './data'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, CardFooter, CardHeader, Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'

const PricingPage = () => {
  return (
    <>
      <PageBreadcrumb title='Pricing' />
      <Row className="justify-content-center">
        <Col xxl={11}>
          <Row className="mt-sm-4 align-items-end justify-content-center my-3">
            {
              pricingData.map((item, idx) => (
                <Col lg={3} key={idx}>
                  <Card className={`h-100 ${item.popular ? '' : 'overflow-hidden'} `}>
                    <CardHeader className="border-bottom border-dashed p-3 text-center">
                      <h4 className={`fw-bold fs-18 ${item.popular && 'pt-2'} `}>{item.type}</h4>
                      <p className="mt-2 mb-0 text-muted">{item.description}</p>
                    </CardHeader>
                    <CardBody className="p-3">
                      <div className="d-flex align-items-center gap-1">
                        <span className="text-muted fs-3 fw-semibold">$</span>
                        <h1 className="display-5 fw-semibold mb-0">{item.price}</h1>
                        <div className="d-block">
                          <p className=" fw-semibold mb-0">One-time payment</p>
                          <p className="text-muted mb-0">+plus local taxes</p>
                        </div>
                      </div>
                      <ul className="d-flex flex-column gap-2 mt-3 list-unstyled">
                        {
                          item.features.map((data, idx) => (
                            <li key={idx}>
                              <IconifyIcon icon='tabler:point' className="text-primary fs-4 align-middle me-1" />
                              {data}
                            </li>
                          ))
                        }
                      </ul>
                    </CardBody>
                    <CardFooter>
                      <a href="" className={`btn btn-${item.popular ? 'danger' : 'primary'} fw-semibold w-100`}>Buy
                        Now</a>
                    </CardFooter>
                    {
                      item.popular &&
                      <span className="position-absolute top-0 translate-middle start-50 text-bg-info px-3 py-1 rounded-pill fw-semibold">
                        Most Popular
                      </span>
                    }
                  </Card>
                </Col>
              ))
            }
          </Row>
        </Col>
      </Row>
    </>

  )
}

export default PricingPage