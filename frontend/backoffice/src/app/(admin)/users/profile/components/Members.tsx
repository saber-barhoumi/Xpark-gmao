import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { userData } from '../data'


const Members = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h4 className="header-title mb-0">My Team Members</h4>
        <Dropdown>
          <DropdownToggle as={'a'} className="dropdown-toggle drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
            <IconifyIcon icon='ri:more-2-fill' className="fs-18" />
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <DropdownItem>Sales Report</DropdownItem>
            <DropdownItem>Export Report</DropdownItem>
            <DropdownItem>Profit</DropdownItem>
            <DropdownItem>Action</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <ul className="list-group mb-0 list-group-flush">
        {
          userData.map((item, idx) => (
            <li className="list-group-item border-light" key={idx}>
              <div className="d-flex align-items-center gap-2">
                <div className="avatar-sm">
                  <img src={item.image} alt='avatar' className="img-fluid rounded-circle" />
                </div>
                <div>
                  <h5 className="mb-0 lh-base"><a href="#!" className="text-reset">{item.name}</a></h5>
                  <p className="text-muted mb-0 fs-13">{item.role}</p>
                </div>
                <div className="ms-auto">
                  <a href="#" className="btn btn-sm btn-soft-primary">Contact</a>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </Card>
  )
}

export default Members