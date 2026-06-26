import React from 'react'
import { Card, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Col, Row, Form } from 'react-bootstrap'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useKanbanContext } from '@/context/useKanbanContext'
import TaskItem from './TaskItem'
import KanbanModal from './KanbanModal'

const Board = () => {
  const {
    onDragEnd,
    sections,
    getCardsForSection,
    addCard,
    clearColumn,
    searchTerm, setSearchTerm,
    filterTechnician, setFilterTechnician,
    filterPriority, setFilterPriority,
    technicians,
    totalBySection
  } = useKanbanContext()

  return (
    <>
      {/* Search & Filter Toolbar */}
      <Card className="mb-4 border-0 shadow-sm bg-glass">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <div className="search-box position-relative">
                <IconifyIcon icon="tabler:search" className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Rechercher par référence, titre ou technicien..."
                  className="ps-5 border-0 bg-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2 small fw-medium text-nowrap">Technicien:</span>
                <Form.Select 
                  className="border-0 bg-light form-select-sm"
                  value={filterTechnician}
                  onChange={(e) => setFilterTechnician(e.target.value)}
                >
                  {technicians.map(tech => (
                    <option key={tech} value={tech}>{tech === 'All' ? 'Tous' : tech}</option>
                  ))}
                </Form.Select>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2 small fw-medium text-nowrap">Priorité:</span>
                <Form.Select 
                  className="border-0 bg-light form-select-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="All">Toutes</option>
                  <option value="BASSE">Basse</option>
                  <option value="NORMALE">Normale</option>
                  <option value="HAUTE">Haute</option>
                  <option value="CRITIQUE">Critique</option>
                </Form.Select>
              </div>
            </Col>
            <Col md={2} className="text-end">
              <button 
                className="btn btn-primary btn-sm d-inline-flex align-items-center px-3"
                onClick={() => addCard('PLANIFIE')}
              >
                <IconifyIcon icon="tabler:plus" className="me-1" /> Nouvel OT
              </button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex gap-3 kanban-board overflow-auto pb-2" style={{ minHeight: '70vh' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {sections.map((section) => (
            <div key={section.id} className="kanban-column" style={{ minWidth: '320px', width: '320px' }}>
              <div className={`card overflow-hidden border-0 shadow-sm h-100 bg-soft-${section.color}`}>
                <div className="p-3 d-flex align-items-center justify-content-between border-bottom border-light">
                  <div className="d-flex align-items-center">
                    <div className={`avatar-xs me-2 d-flex align-items-center justify-content-center rounded bg-${section.color} text-white`}>
                      <IconifyIcon icon={section.icon} className="fs-16" />
                    </div>
                    <h5 className="mb-0 fw-bold text-dark">
                      {section.title}
                      <span className="ms-2 badge rounded-pill bg-white text-dark shadow-sm border small px-2">
                        {totalBySection[section.id] || 0}
                      </span>
                    </h5>
                  </div>
                  <Dropdown align="end">
                    <DropdownToggle as="a" className="btn btn-link p-0 text-muted shadow-none">
                      <IconifyIcon icon="tabler:dots-vertical" className="fs-18" />
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem onClick={() => addCard(section.id)}>Ajouter une tâche</DropdownItem>
                      <DropdownItem onClick={() => clearColumn(section.id)}>Nettoyer la colonne</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                <Droppable droppableId={section.id}>
                  {(provided, snapshot) => (
                    <SimplebarReactClient 
                      data-simplebar 
                      style={{ maxHeight: 'calc(100vh - 350px)' }}
                    >
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`tasklist p-3 min-vh-50 ${snapshot.isDraggingOver ? 'bg-white bg-opacity-25 rounded' : ''}`}
                        style={{ minHeight: '400px' }}
                      >
                        {getCardsForSection(section.id).map((task, idx) => (
                          <Draggable key={task.id} draggableId={task.id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 transition-all ${snapshot.isDragging ? 'grabbing-scale shadow-lg' : ''}`}
                              >
                                <TaskItem task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </SimplebarReactClient>
                  )}
                </Droppable>
                
                <div className="p-3 mt-auto">
                    <button 
                        className="btn btn-dashed w-100 border-2 py-2 d-flex align-items-center justify-content-center text-muted"
                        onClick={() => addCard(section.id)}
                    >
                        <IconifyIcon icon="tabler:plus" className="me-1" /> Ajouter une tâche
                    </button>
                </div>
              </div>
            </div>
          ))}
        </DragDropContext>
        <KanbanModal />
      </div>
    </>
  )
}

export default Board
