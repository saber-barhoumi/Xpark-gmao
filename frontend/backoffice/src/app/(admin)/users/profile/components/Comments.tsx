import IconifyIcon from '@/components/wrappers/IconifyIcon'

import React from 'react'
import avatar1 from '@/assets/images/users/avatar-1.jpg'
import small1 from '@/assets/images/small/small-1.jpg'
import small2 from '@/assets/images/small/small-2.jpg'
import small3 from '@/assets/images/small/small-3.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'
import avatar7 from '@/assets/images/users/avatar-7.jpg'
import { Card, CardBody } from 'react-bootstrap'

const Comments = () => {
  return (
    <Card>
      <CardBody>
        <form method="post" className="mb-4">
          <div className="input-group">
            <textarea rows={3} className="form-control" placeholder="Post a new message" defaultValue={""} />
            <button className="btn btn-primary btn-sm">Send</button>
          </div>
          <ul className="nav nav-pills bg-light bg-opacity-50 rounded-bottom mt-n1 pt-1 d-flex justify-content-start">
            <li className="nav-item">
              <a href="#" className="nav-link fs-18 px-2 py-1"><IconifyIcon icon='tabler:user' /></a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link fs-18 px-2 py-1"><IconifyIcon icon='tabler:send' /></a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link fs-18 px-2 py-1"><IconifyIcon icon='tabler:camera' /></a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link fs-18 px-2 py-1"><IconifyIcon icon='tabler:mood-smile' /></a>
            </li>
          </ul>
        </form>
        <div className="d-flex align-items-top mb-2">
          <img src={avatar1} alt='avatar1' className="flex-shrink-0 comment-avatar avatar-sm rounded me-2" />
          <div className="flex-grow-1">
            <h5 className="mt-0"><a href="#" className="text-dark">Adam Jansen</a><small className="ms-1 text-muted">about 2 minutes ago</small></h5>
            <p>Story based around the idea of time lapse, animation to post soon!</p>
            <div>
              <a href=''>
                <img alt='' src={small1} className="avatar-md rounded" />
              </a>&nbsp;
              <a href=''>
                <img alt='' src={small2} className="avatar-md rounded" />
              </a>&nbsp;
              <a href=''>
                <img alt='' src={small3} className="avatar-md rounded" />
              </a>
            </div>
            <div className="d-flex gap-2 align-items-center fs-14 pt-2 mb-3">
              <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-up' /></a>
              <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-down' /></a>
              <a href="#" className="text-muted">Reply</a>
            </div>
            <div className="d-flex align-items-top mb-2">
              <img src={avatar3} alt='avatar3' className="flex-shrink-0 comment-avatar avatar-sm rounded me-2" />
              <div className="flex-grow-1">
                <h5 className="mt-0"><a href="#" className="text-dark">John Smith</a><small className="ms-1 text-muted">about 1 hour ago</small></h5>
                <p>Wow impressive!</p>
                <div className="d-flex gap-2 align-items-center fs-14">
                  <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-up' /></a>
                  <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-down' /></a>
                  <a href="#" className="text-muted">Reply</a>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-top">
              <img src={avatar4} alt='avatar4' className="flex-shrink-0 comment-avatar avatar-sm rounded me-2" />
              <div className="flex-grow-1">
                <h5 className="mt-0"><a href="#" className="text-dark">Matt Cheuvront</a><small className="ms-1 text-muted">about 2 hours ago</small></h5>
                <p>Wow, that is really nice.</p>
                <div className="d-flex gap-2 align-items-center fs-14 mb-3">
                  <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-up' /></a>
                  <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-down' /></a>
                  <a href="#" className="text-muted">Reply</a>
                </div>
                <div className="d-flex align-items-top mb-2">
                  <img src={avatar5} alt='avatar5' className="flex-shrink-0 comment-avatar avatar-sm rounded me-2" />
                  <div className="flex-grow-1">
                    <h5 className="mt-0"><a href="#" className="text-dark">Stephanie
                      Walter</a><small className="ms-1 text-muted">about 3 hours
                        ago</small></h5>
                    <p>Nice work, makes me think of The Money Pit.</p>
                    <div className="d-flex gap-2 align-items-center fs-14">
                      <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-up' /></a>
                      <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-down' /></a>
                      <a href="#" className="text-muted">Reply</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-top mb-3">
          <img src={avatar6} alt='avatar6' className="flex-shrink-0 comment-avatar avatar-sm rounded me-2" />
          <div className="flex-grow-1">
            <h5 className="mt-0"><a href="#" className="text-dark">John Smith</a><small className="ms-1 text-muted">about 4 hours ago</small></h5>
            <p>I'm in the middle of a timelapse animation myself! (Very different though.)
              Awesome stuff.</p>
            <div className="d-flex gap-2 align-items-center fs-14">
              <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-up' /></a>
              <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-down' /></a>
              <a href="#" className="text-muted">Reply</a>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-top mb-3">
          <img src={avatar7} alt='avatar7' className="flex-shrink-0 comment-avatar avatar-sm rounded me-2" />
          <div className="flex-grow-1">
            <h5 className="mt-0"><a href="#" className="text-dark">Nicolai Larson</a><small className="ms-1 text-muted">about 10 hours ago</small></h5>
            <p>The parallax is a little odd but O.o that house build is awesome!!</p>
            <div className="d-flex gap-2 align-items-center fs-14">
              <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-up' /></a>
              <a href="#" className="text-muted"><IconifyIcon icon='tabler:thumb-down' /></a>
              <a href="#" className="text-muted">Reply</a>
            </div>
          </div>
        </div>
        <div className="text-center">
          <a href='' className="text-danger"><IconifyIcon icon='tabler:loader' className="me-1" />
            Load more </a>
        </div>
      </CardBody>
    </Card>
  )
}

export default Comments