import { KanbanProvider } from '@/context/useKanbanContext'
import Board from './components/Board'

import PageBreadcrumb from '@/components/PageBreadcrumb'


// 

const KanbanPage = () => {
  return (
    <>
      <PageBreadcrumb title='Kanban' />
      <KanbanProvider>
        <Board />
      </KanbanProvider>
    </>

  )
}

export default KanbanPage