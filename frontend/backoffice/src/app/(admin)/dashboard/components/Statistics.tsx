
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { ApexOptions } from 'apexcharts'
import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'

const Statistics = () => {
  const StatisticsChartOpts: ApexOptions = {
    series: [
      { name: "Open Campaign", type: "bar", data: [89.25, 98.58, 68.74, 108.87, 77.54, 84.03, 51.24] }
    ],
    chart: { height: 301, type: "line", toolbar: { show: false } },
    stroke: {
      width: 0,
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        columnWidth: "20%",
        barHeight: "70%",
        borderRadius: 5,
      },
    },
    xaxis: { categories: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"] },
    colors: ["#188ae2"]
  }
  return (
    <Card>
      <div className="d-flex card-header justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title">Statistics</h4>
        <Dropdown>
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
      </div>
      <CardBody className="p-0 pt-1">
        <div dir="ltr" className="px-1">
          <div id="statistics-chart" className="apex-charts" data-colors="#188ae2" />
          <ReactApexChart height={301} options={StatisticsChartOpts} className="apex-charts" series={StatisticsChartOpts.series} type="line" />
        </div>
        <div className="border-top border-dashed mt-2">
          <Row className="text-center align-items-center g-0">
            <Col md={4} xs={6} >
              <p className="text-muted mt-3 mb-1">Revenue</p>
              <h4 className="mb-3">
                <span className=" text-success me-1"><IconifyIcon icon='ri:arrow-left-down-box-line' /> </span>
                <span>$29.5k</span>
              </h4>
            </Col>
            <Col md={4} xs={6} className=" border-start border-end border-dashed">
              <p className="text-muted mt-3 mb-1">Expenses</p>
              <h4 className="mb-3">
                <span className=" text-danger me-1"><IconifyIcon icon='ri:arrow-left-up-box-line' /> </span>
                <span>$15.07k</span>
              </h4>
            </Col>
            <Col md={4} className="">
              <p className="text-muted mt-3 mb-1">Revenue</p>
              <h4 className="mb-3">
                <span className=" text-success me-1"><IconifyIcon icon='ri:arrow-left-down-box-line' /> </span>
                <span>$71.5k</span>
              </h4>
            </Col>
          </Row>
        </div>
      </CardBody>
    </Card>
  )
}

export default Statistics