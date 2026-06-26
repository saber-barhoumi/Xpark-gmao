
import PageBreadcrumb from '@/components/PageBreadcrumb'
import AllDataTable from './components/AllDataTable'
import { getAllDataTableRecords } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'

// 

const GridJs = () => {
  const dataTableRecords = useFetchData(getAllDataTableRecords)
  return (
    <>
      <PageBreadcrumb title='Grid js' />
      {
        dataTableRecords &&
        <AllDataTable dataTableRecords={dataTableRecords} />
      }
    </>
  )
}

export default GridJs