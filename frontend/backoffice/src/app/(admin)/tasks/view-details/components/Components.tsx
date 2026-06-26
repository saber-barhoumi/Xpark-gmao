import IconifyIcon from '@/components/wrappers/IconifyIcon'

import React from 'react'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'

const Components = () => {
  return (
    <Col xl={4}>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
          <h4 className="header-title">Comments (51)</h4>
          <div>
            <select className="form-select form-select-sm">
              <option selected>Recent</option>
              <option value={1}>Most Helpful</option>
              <option value={2}>High to Low</option>
              <option value={3}>Low to High</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          <div className="d-flex">
            <img className="me-2 rounded-circle" src={avatar3} alt="Generic placeholder image" height={32} />
            <div className="flex-1">
              <h5 className="mt-0">Barry Gould
                <small className="text-muted fw-normal float-end">5 hours ago</small>
              </h5>
              Nice work, makes me think of The Money Pit.
              <br />
              <a href="" className="text-muted fs-13 d-inline-block mt-2">
                <IconifyIcon icon='tabler:corner-up-left' /> Reply
              </a>
              <div className="d-flex align-items-start mt-3">
                <a className="pe-2" href="#">
                  <img src={avatar4} className="rounded-circle" alt="Generic placeholder image" height={32} />
                </a>
                <div className="flex-1">
                  <h5 className="mt-0">Louis Hill
                    <small className="text-muted fw-normal float-end">3 hours ago</small>
                  </h5>
                  i'm in the middle of a timelapse animation myself! (Very different
                  though.) Awesome stuff.
                  <br />
                  <a href="" className="text-muted fs-13 d-inline-block mt-2">
                    <IconifyIcon icon='tabler:corner-up-left'  /> Reply
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-start mt-3">
            <img className="me-2 rounded-circle" src={avatar5} alt="Generic placeholder image" height={32} />
            <div className="flex-1">
              <h5 className="mt-0">Aaron Wilson
                <small className="text-muted fw-normal float-end">1 day ago</small>
              </h5>
              It would be very nice to have.
              <br />
              <a href="" className="text-muted fs-13 d-inline-block mt-2">
                <IconifyIcon icon='tabler:corner-up-left' /> Reply
              </a>
            </div>
          </div>
          <div className="text-center mt-2">
            <a href="" className="text-danger">
              <IconifyIcon icon='tabler:loader' className=" ti-spin me-1" /> Load more
            </a>
          </div>
          <div className="border rounded mt-4">
            <form action="#" className="comment-area-box">
              <textarea rows={3} className="form-control border-0 resize-none" placeholder="Your comment..." defaultValue={""} />
              <div className="p-2 bg-light d-flex justify-content-between align-items-center">
                <div>
                  <a href="#" className="btn btn-sm px-1 btn-light">
                    <IconifyIcon icon='tabler:upload' className="" />
                  </a>
                  <a href="#" className="btn btn-sm px-1 btn-light">
                    <IconifyIcon icon='tabler:at' className="" />
                  </a>
                </div>
                <button type="submit" className="btn btn-sm btn-success">
                  <IconifyIcon icon='tabler:send' className=" me-1" />Submit
                </button>
              </div>
            </form>
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}

export default Components