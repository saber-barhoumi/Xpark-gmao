import React from 'react'
import { CardBody, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, OverlayTrigger, Tooltip } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { KanbanCard, PRIORITE_CONFIG } from '@/services/kanbanService'
import { useKanbanContext } from '@/context/useKanbanContext'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const TaskItem = ({ task }: { task: KanbanCard }) => {
  const { editCard, deleteCard } = useKanbanContext()
  const navigate = useNavigate()
  const prio = PRIORITE_CONFIG[task.priorite] || { label: task.priorite, color: 'secondary' }
  const isMission = task.type === 'MISSION'
  const isIntervention = task.type === 'INTERVENTION'
  
  const isOverdue = task.dateEcheance && dayjs(task.dateEcheance).isBefore(dayjs()) && task.statut !== 'TERMINE'
  const formattedDueDate = task.dateEcheance ? dayjs(task.dateEcheance).format('DD/MM/YYYY') : null

  const handleDoubleClick = () => {
    if (task.type === 'OT') {
      navigate(`/tasks/view-details?id=${task.id.replace('OT_', '')}`)
    } else if (task.type === 'MISSION') {
      navigate(`/gestion/missions`) 
    } else {
      navigate(`/maintenance/interventions`)
    }
  }

  return (
    <div 
      className={`card kanban-card border-0 shadow-sm mb-0 h-100 transition-all card-hover-aero bg-white`}
      onDoubleClick={handleDoubleClick}
      title="Double-cliquez pour plus de détails"
    >
      <CardBody className="p-3">
        {/* Header: Type, Reference & Dropdown */}
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div className="d-flex flex-column gap-1">
             <div className="d-flex align-items-center gap-1">
                <span className={`badge bg-soft-${isMission ? 'info' : (isIntervention ? 'warning' : 'primary')} text-${isMission ? 'info' : (isIntervention ? 'warning' : 'primary')} fs-10 px-1 py-0`}>
                  {isMission ? 'MISSION' : (isIntervention ? 'INTERV' : 'GMAO')}
                </span>
                <span className="text-primary fw-bold small">{task.reference}</span>
             </div>
             <span className={`badge bg-soft-${prio.color} text-${prio.color} fs-11 px-2 py-1`}>
                <IconifyIcon icon="tabler:flag" className="me-1" /> {prio.label}
             </span>
          </div>
          <Dropdown align="end">
            <DropdownToggle as="a" className="btn btn-link p-0 text-muted shadow-none">
              <IconifyIcon icon="tabler:dots-vertical" className="fs-18" />
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end border-0 shadow-sm bg-white">
              <DropdownItem onClick={() => editCard(task)}>
                <IconifyIcon icon="tabler:edit" className="me-2 text-info" />Modifier
              </DropdownItem>
              <DropdownItem className="text-danger" onClick={() => deleteCard(task.id)}>
                <IconifyIcon icon="tabler:trash" className="me-2" />Supprimer
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Title & Equipment */}
        <h5 className="mt-0 line-clamp-2">
          <span className="text-dark fw-bold text-decoration-none">
            {task.titre}
          </span>
        </h5>
        
        {task.equipement && (
          <div className="d-flex align-items-center mt-2 mb-3 bg-light p-2 rounded-2 border border-dashed border-light">
            <IconifyIcon icon={isMission ? "tabler:map-pin" : "tabler:tool"} className="text-primary me-2 fs-16" />
            <span className="text-muted small fw-medium">{task.equipement}</span>
          </div>
        )}

        {/* Info Icons & Progress Indicators */}
        <div className="d-flex align-items-center gap-3 mb-3 border-top border-light pt-2 mt-2">
          {task.hasAttachments && (
              <OverlayTrigger placement="top" overlay={<Tooltip>Fichiers joints</Tooltip>}>
                <div className="d-flex align-items-center text-muted small">
                    <IconifyIcon icon="tabler:paperclip" className="me-1" />
                </div>
              </OverlayTrigger>
          )}
          {task.commentsCount > 0 && (
              <OverlayTrigger placement="top" overlay={<Tooltip>{task.commentsCount} Commentaires</Tooltip>}>
                <div className="d-flex align-items-center text-muted small">
                    <IconifyIcon icon="tabler:message-circle" className="me-1" />
                    <span>{task.commentsCount}</span>
                </div>
              </OverlayTrigger>
          )}
          {task.hasSpareParts && (
              <OverlayTrigger placement="top" overlay={<Tooltip>Pièces de rechange</Tooltip>}>
                <div className="d-flex align-items-center text-muted small">
                    <IconifyIcon icon="tabler:settings" className="me-1" />
                </div>
              </OverlayTrigger>
          )}
        </div>

        {/* Footer: Due Date & Technician */}
        <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-light">
          <div className={`d-flex align-items-center p-1 px-2 rounded-pill ${isOverdue ? 'bg-soft-danger text-danger' : 'bg-soft-light text-muted'}`}>
            <IconifyIcon icon="tabler:calendar-event" className="me-1 fs-14" />
            <span className="fs-12 fw-medium">{formattedDueDate || 'Pas d\'échéance'}</span>
          </div>

          <OverlayTrigger placement="top" overlay={<Tooltip>{task.technicien || 'Non assigné'}</Tooltip>}>
            <div className="avatar-xs">
              {task.technicienAvatar ? (
                <img src={task.technicienAvatar} alt="" className="avatar-title rounded-circle shadow-sm" />
              ) : (
                <div className="avatar-title bg-soft-primary text-primary rounded-circle shadow-sm fw-bold border border-white">
                  {task.technicien?.substring(0, 2).toUpperCase() || '??'}
                </div>
              )}
            </div>
          </OverlayTrigger>
        </div>
      </CardBody>
      
      <style>{`
        .kanban-card { transition: all 0.2s ease-in-out; cursor: pointer; }
        .kanban-card:hover { transform: translateY(-3px); box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fs-10 { font-size: 10px; }
      `}</style>
    </div>
  )
}

export default TaskItem
