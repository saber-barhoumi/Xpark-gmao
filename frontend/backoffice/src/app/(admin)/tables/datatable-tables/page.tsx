import ReactTable from '@/components/table/ReactTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardBody, Col, Row } from 'react-bootstrap';
import { records as data, Employee, expandableRecords } from './data';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const columns: ColumnDef<Employee>[] = [
  {
    header: 'ID',
    accessorKey: 'id',
  },
  {
    header: 'Name',
    accessorKey: 'name',
  },
  {
    header: 'Phone Number',
    accessorKey: 'phone',
  },
  {
    header: 'Age',
    accessorKey: 'age',
  },
  {
    header: 'Company',
    accessorKey: 'company',
  },
];

const sizePerPageList = [5, 10, 25, 50];

const AdvancedTable = () => {
	return (
		<>
<PageBreadcrumb title='Advanced Table' />
      <Row>
        <Col>
          <Card>
            <CardBody>
              <h4 className="header-title">Pagination &amp; Sort</h4>
              <p className="text-muted font-14 mb-4">
                A simple example of table with pagination and column sorting
              </p>

              <ReactTable<Employee>
                columns={columns}
                data={data}
                pageSize={5}
                rowsPerPageList={sizePerPageList}
                showPagination
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <CardBody>
              <h4 className="header-title">Search</h4>
              <p className="text-muted font-14 mb-4">A Table allowing search</p>

              <ReactTable<Employee>
                columns={columns}
                data={data}
                pageSize={5}
                rowsPerPageList={sizePerPageList}
                showPagination
                isSearchable={true}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <CardBody>
              <h4 className="header-title">Multiple Row Selection</h4>
              <p className="text-muted font-14 mb-4">
                This table allowing selection of multiple rows
              </p>

              <ReactTable<Employee>
                columns={columns}
                data={data}
                pageSize={5}
                rowsPerPageList={sizePerPageList}
                showPagination
                isSelectable={true}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <CardBody>
              <h4 className="header-title">Expand Row</h4>
              <p className="text-muted font-14 mb-4">
                Expand row to see more additional details
              </p>

              <ReactTable<Employee>
                columns={columns}
                data={expandableRecords}
                pageSize={5}
                rowsPerPageList={sizePerPageList}
                showPagination
                // isExpandable={true}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
		</>
	);
};

export default AdvancedTable;
