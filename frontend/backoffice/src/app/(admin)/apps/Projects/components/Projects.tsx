import React from 'react'
import { projectData } from '../data';
import { splitArray } from '@/utils/array';
;
import { Card, CardBody, Col, ProgressBar, Row } from 'react-bootstrap';

const Projects = () => {


  const chunk_size = 3;
  const appsChunks = splitArray(projectData, chunk_size);
  return (
    <>
      {(appsChunks || []).map((chunk, idx) => (
        <Row key={idx}>
          {(chunk || []).map((item, idx) => (
            <Col xl={4} key={idx}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mt-0"><a href='' className="text-dark">{item.title}</a></h4>
                      <p className={`text-${item.variant} text-uppercase fw-semibold fs-11`}>{item.category}</p>
                    </div>
                    <div>
                      <div className={`badge badge-soft-${item.variant} p-1`}>{item.status}</div>
                    </div>
                  </div>
                  <p className="text-muted mb-3">{item.description} <a href="#" className="link-dark">View more</a>
                  </p>
                  <ul className="list-inline">
                    <li className="list-inline-item me-4">
                      <h4 className="mb-0 lh-base">{item.questions}</h4>
                      <p className="text-muted">Questions</p>
                    </li>&nbsp;
                    <li className="list-inline-item">
                      <h4 className="mb-0 lh-base">{item.comments}</h4>
                      <p className="text-muted">Comments</p>
                    </li>
                  </ul>
                  <div className="d-flex align-items-center mb-3">
                    <h5 className="me-3 mb-0">Team :</h5>
                    <div className="avatar-group">
                      {
                        item.team &&
                        item.team.map((avatar: any, idx: number) => (
                          <a href="#" className="avatar" key={idx} data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Mat Helme" data-bs-original-title="Mat Helme">
                            <img src={avatar} className="rounded-circle avatar-sm" alt="friend" />
                          </a>
                        ))
                      }
                    </div>
                  </div>
                  <h5 className="mb-2">Progress <span className={`text-${item.variant} float-end`}>{item.progress}%</span></h5>
                    <ProgressBar variant={item.variant} className={`progress-soft progress-sm`}   now={item.progress} role="progressbar" aria-valuenow={80} aria-valuemin={0} aria-valuemax={100}/>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      ))}
    </>
  )
}

export default Projects