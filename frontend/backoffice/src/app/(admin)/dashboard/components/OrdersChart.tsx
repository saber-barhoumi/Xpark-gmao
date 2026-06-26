
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { ApexOptions } from 'apexcharts'
import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'

const OrdersChart = () => {
  const OrdersChartOpts: ApexOptions = {
    chart: {
      height: 277,
      type: 'donut',
    },
    series: [65, 14, 10, 45],
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      offsetX: 0,
      offsetY: 7
    },
    labels: ["Direct", "Social", "Marketing", "Affiliates"], // Age groups
    colors: ["#5b69bc", "#ff8acc", "#10c469", "#35b8e0"],
    stroke: {
      show: false
    }
  }
  return (
    <Card>
      <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom border-dashed">
        <h4 className="header-title">Orders Statistics</h4>
        <div className="d-flex gap-2 justify-content-end text-end">
          <a href="" className="btn btn-sm btn-light">Refresh <IconifyIcon icon='ri:refresh-line' className="ms-1" /></a>
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        <div dir="ltr">
          <ReactApexChart height={277} options={OrdersChartOpts} className="apex-charts" series={OrdersChartOpts.series} type="donut" />
          <Row className="mt-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center p-1">
                <div>
                  <IconifyIcon icon='ri:circle-fill' className="fs-12 align-middle me-1 text-primary" />
                  <span className="align-middle fw-semibold">Direct</span>
                </div>
                <span className="fw-semibold text-muted float-end"><IconifyIcon width={16} height={16} icon='ri:arrow-down-s-fill' className="text-danger" /> 965</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-1">
                <div>
                  <IconifyIcon icon='ri:circle-fill' className="fs-12 text-secondary align-middle me-1" />
                  <span className="align-middle fw-semibold">Social</span>
                </div>
                <span className="fw-semibold text-muted float-end"><IconifyIcon width={16} height={16} icon='ri:arrow-up-s-fill' className="text-success" /> 75</span>
              </div>
            </Col>
            <Col>
              <div className="d-flex justify-content-between align-items-center p-1">
                <div>
                  <IconifyIcon icon='ri:circle-fill' className="fs-12 text-success align-middle me-1" />
                  <span className="align-middle fw-semibold"> Marketing</span>
                </div>
                <span className="fw-semibold text-muted float-end"><IconifyIcon width={16} height={16} icon='ri:arrow-up-s-fill' className="text-success" /> 102</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-1">
                <div>
                  <IconifyIcon icon='ri:circle-fill' className="fs-12 text-info align-middle me-1" />
                  <span className="align-middle fw-semibold">Affiliates</span>
                </div>
                <span className="fw-semibold text-muted float-end"><IconifyIcon width={16} height={16} icon='ri:arrow-down-s-fill' className="text-danger" /> 96</span>
              </div>
            </Col>
          </Row>
        </div>
      </CardBody>
    </Card>
  )
}

export default OrdersChart