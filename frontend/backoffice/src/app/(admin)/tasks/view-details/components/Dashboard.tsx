import IconifyIcon from '@/components/wrappers/IconifyIcon'
import React from 'react'
import { Card, CardBody, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { OrdreDetail } from '@/services/viewDetailsService'
import { PRIORITE_CONFIG } from '@/services/kanbanService'
import dayjs from 'dayjs'

const Dashboard = ({ ordre }: { ordre: OrdreDetail }) => {
  const prio = PRIORITE_CONFIG[ordre.priorite] || { label: ordre.priorite, color: 'secondary' }
  
  return (
    <Card>
      <CardHeader className="border-bottom border-dashed">
        <div className="d-flex justify-content-between">
          <div>
            <h4 className="mb-1">{ordre.titre}</h4>
            <p className="fw-semibold mb-0">
              <span className={`badge bg-${prio.color}`}>{prio.label}</span>
              &nbsp;
              <span className="badge bg-soft-info text-info ms-1">{ordre.statut}</span>
            </p>
          </div>
          <Dropdown align='end'>
            <DropdownToggle as='a' className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
              <IconifyIcon icon='ri:more-2-fill' className="fs-18" />
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem>
                <IconifyIcon icon='tabler:paperclip' className="me-1" />Attachment
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon='tabler:pencil' className="me-1" />Edit
              </DropdownItem>
              <DropdownItem>
                <IconifyIcon icon='tabler:copy' className="me-1" />Mark as Duplicate
              </DropdownItem>
              <div className="dropdown-divider" />
              <DropdownItem  className="text-danger">
                <IconifyIcon icon='tabler:trash' className="me-1" />Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>
      <CardBody>
        <Row>
          <Col lg={4} sm={6}>
            <div className="d-flex align-items-start">
              <div className="me-2 align-self-center">
                <IconifyIcon icon='ri:hashtag' className="h2 m-0 text-muted" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="mb-1 text-muted fs-12">Task ID</p>
                <h5 className="m-0 text-truncate">
                  #{ordre.id}
                </h5>
              </div>
            </div>
          </Col>
              <div className="flex-1 overflow-hidden">
                <p className="mb-1 text-muted fs-12">Assign to</p>
                <h5 className="m-0 text-truncate">
                  {ordre.technicien || 'Non assigné'}
                </h5>
              </div>
          <Col lg={4} sm={6}>
            <div className="d-flex align-items-start">
              <div className="me-2 align-self-center">
                <IconifyIcon width={16} height={16} icon='ri:calendar-event-line' className="h2 m-0 text-muted" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="mb-1 text-muted fs-12">Due Date</p>
                <h5 className="m-0 text-truncate">
                  {ordre.dateEcheance ? dayjs(ordre.dateEcheance).format('DD/MM/YYYY HH:mm') : 'Pas d\'échéance'}
                </h5>
              </div>
            </div>
          </Col>
        </Row>
        <div className="mt-4">
          <div>
            <h5>Overview:</h5>
            <p className="text-muted">{ordre.description || 'Aucune description fournie.'}</p>
            <div className="mt-3">
              <h5>Tags :</h5>
              <div>
                {ordre.tags.map((t, idx) => (
                  <span key={idx} className="badge badge-soft-primary p-1 me-1">{t}</span>
                ))}
                {ordre.equipement && (
                  <span className="badge badge-soft-success p-1 ms-1">
                    <IconifyIcon icon="tabler:tool" className="me-1" />
                    {ordre.equipement}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h5>Checklists/Sub-tasks</h5>
            <div className="form-check mt-2">
              <input className="form-check-input" type="checkbox" id="checklistcheck01" />
              <label className="form-check-label strikethrough" htmlFor="checklistcheck01">
                Find out the old contract documents
              </label>
            </div>
            <div className="form-check mt-1">
              <input className="form-check-input" type="checkbox" id="checklistcheck02" />
              <label className="form-check-label strikethrough" htmlFor="checklistcheck02">
                Organize meeting sales associates to understand need in detail
              </label>
            </div>
            <div className="form-check mt-1">
              <input className="form-check-input" type="checkbox" id="checklistcheck03" />
              <label className="form-check-label strikethrough" htmlFor="checklistcheck03">
                Make sure to cover every small details
              </label>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default Dashboard