import React from 'react'
import { remixIconData } from './data'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, OverlayTrigger, Tooltip } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'


// 

const RemixPage = () => {
  return (
    <>
    <PageBreadcrumb title='Remix' />
      <div className="d-flex flex-wrap gap-3 justify-content-center icon-box">
        {
          remixIconData.map((item, idx) => (
            <OverlayTrigger key={idx} trigger={'hover'} placement="top" overlay={<Tooltip>{item.title}</Tooltip>}>
              <Card className="mb-2" >
                <CardBody className="d-flex align-items-center justify-content-center" data-bs-toggle="tooltip" data-bs-placement="top" title={item.title}>
                  <IconifyIcon width={33} height={48} icon={item.icon} />
                </CardBody>
              </Card>
            </OverlayTrigger>
          ))
        }
      </div>
      <div className="my-3 text-center">
        <a href="https://remixicon.com/" target="_blank" className="btn btn-danger">View All
          Icons</a>
      </div>
    </>

  )
}

export default RemixPage