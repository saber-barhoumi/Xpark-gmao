
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ApexCharts, { ApexOptions } from 'apexcharts'
import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ProgressBar, Row } from 'react-bootstrap'

const Stat = () => {
  const TotalOrdersChartOpts: ApexOptions = {
    series: [65],
    chart: {
        type: 'radialBar',
        height: 81,
        width: 81,
        sparkline: {
            enabled: false
        }
    },
    plotOptions: {
        radialBar: {
            offsetY: 0,
            hollow: {
                margin: 0,
                size: '50%'
            },
            dataLabels: {
                name: {
                    show: false,
                },
                value: {
                    offsetY: 5,
                    fontSize: '14px',
                    fontWeight: "600",
                    formatter: function (val: any) {
                        return val + 'k'
                    }
                }
            }
        }
    },
    grid: {
        padding: {
            top: -18,
            bottom: -20,
            left: -20,
            right: -20,
        }
    },
    colors: ["#ff5b5b","#F6F7FB"],
  }
  const NewUsersChartOpts: ApexOptions = {
    series: [75],
    chart: {
        type: 'radialBar',
        height: 81,
        width: 81,
        sparkline: {
            enabled: false
        }
    },
    plotOptions: {
        radialBar: {
            offsetY: 0,
            hollow: {
                margin: 0,
                size: '50%'
            },
            dataLabels: {
                name: {
                    show: false,
                },
                value: {
                    offsetY: 5,
                    fontSize: '14px',
                    fontWeight: "600",
                    formatter: function (val) {
                        return val + 'k'
                    }
                }
            }
        }
    },
    grid: {
        padding: {
            top: -18,
            bottom: -20,
            left: -20,
            right: -20,
        }
    },
    colors: ["#f9c851","#F6F7FB"],
  }
  return (
    <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
      <Col>
        <Card>
          <div className="d-flex card-header justify-content-between align-items-center">
            <div>
              <h4 className="header-title">Total Orders</h4>
            </div>
            <Dropdown align={'end'}>
              <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                <IconifyIcon icon='ri:more-2-fill' className=" fs-18" />
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
            <div className="d-flex align-items-end gap-2 justify-content-between">
              <div className="text-end flex-shrink-0">
                <ReactApexChart height={81} width={81} options={TotalOrdersChartOpts} series={TotalOrdersChartOpts.series} type="radialBar" />
              </div>
              <div className="text-end">
                <h3 className="fw-semibold">687.3k</h3>
                <p className="text-muted mb-0">Since last month</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col>
        <Card>
          <div className="d-flex card-header justify-content-between align-items-center">
            <div>
              <h4 className="header-title">Total Revenue</h4>
            </div>
            <Dropdown align={'end'}>
              <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                <IconifyIcon icon='ri:more-2-fill' className=" fs-18" />
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
              <span className="badge bg-success rounded-pill fs-13">32% <IconifyIcon icon='tabler:trending-up' /> </span>
              <div className="text-end">
                <h3 className="fw-semibold">$5.42M</h3>
                <p className="text-muted mb-0">Since last month</p>
              </div>
            </div>
            <div className="progress progress-soft progress-sm mt-3">
              <ProgressBar className="bg-success" role="progressbar" style={{ width: '25%' }} aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} />
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col>
        <Card>
          <div className="d-flex card-header justify-content-between align-items-center">
            <div>
              <h4 className="header-title">New Users</h4>
            </div>
            <Dropdown align={'end'}>
              <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                <IconifyIcon icon='ri:more-2-fill' className=" fs-18" />
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
            <div className="d-flex align-items-end gap-2 justify-content-between">
              <div className="text-end flex-shrink-0">
                <ReactApexChart height={81} width={81} options={NewUsersChartOpts} series={NewUsersChartOpts.series} type="radialBar" />
              </div>
              <div className="text-end">
                <h3 className="fw-semibold">45.3k</h3>
                <p className="text-muted mb-0">Since last month</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col>
        <Card>
          <div className="d-flex card-header justify-content-between align-items-center">
            <div>
              <h4 className="header-title">Customer Satisfaction</h4>
            </div>
            <Dropdown align={'end'}>
              <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                <IconifyIcon icon='ri:more-2-fill' className=" fs-18" />
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
              <span className="badge bg-info rounded-pill fs-13">5.7% <IconifyIcon icon='tabler:trending-down' /> </span>
              <div className="text-end">
                <h3 className="fw-semibold">94.3%</h3>
                <p className="text-muted mb-0">Since last month</p>
              </div>
            </div>
               <ProgressBar variant='info' className={`progress-soft progress-sm mt-3`}   now={94.3} role="progressbar" aria-valuenow={80} aria-valuemin={0} aria-valuemax={100}/>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default Stat