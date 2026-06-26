import avatar1 from '@/assets/images/users/avatar-1.jpg'
import avatar2 from '@/assets/images/users/avatar-2.jpg'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllFiles } from '@/helpers/data'

import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'


const FileData = async () => {

  const recentData = await getAllFiles()
  return (
    <tbody>
      {
        recentData.map((item, idx) => (
          <tr key={idx}>
            <td className="ps-3">
              <div className="d-flex align-items-center gap-2">
                <div className={`flex-shrink-0 avatar-md bg-${item.fileVariant}-subtle d-inline-flex align-items-center justify-content-center rounded-2`}>
                  <IconifyIcon icon='ri:file-line' className="fs-22 text-info" />
                </div>
                <div>
                  <span className="fw-medium"><a href="" className="text-reset">{item.title}</a></span>
                  <p className="mb-0 fs-12">{item.file}</p>
                </div>
              </div>
            </td>
            <td>
              <div className="d-flex align-items-center gap-2">
                <div>
                  <a href="">
                    <img src={avatar1} className="rounded-circle avatar-md" alt="friend" />
                  </a>
                </div>
                <div>
                  <p className="mb-0 fw-medium">{item.user?.name}</p>
                  <span className="fs-12">{item.user?.email}</span>
                </div>
              </div>
            </td>
            <td>{item.size} MB</td>
            <td>
              {item.date.toLocaleString('en-us', { month: 'short', day: '2-digit', year: 'numeric' })}
            </td>
            <td>
              <div className="avatar-group flex-nowrap">
                <div className="avatar avatar-sm">
                  <span className="avatar-title bg-success rounded-circle fw-bold">
                    D
                  </span>
                </div>
                <div className="avatar avatar-sm">
                  <span className="avatar-title bg-primary rounded-circle fw-bold">
                    K
                  </span>
                </div>
                <div className="avatar avatar-sm">
                  <span className="avatar-title bg-secondary rounded-circle fw-bold">
                    H
                  </span>
                </div>
                <div className="avatar avatar-sm">
                  <span className="avatar-title bg-warning rounded-circle fw-bold">
                    L
                  </span>
                </div>
                <div className="avatar avatar-sm">
                  <span className="avatar-title bg-info rounded-circle fw-bold">
                    G
                  </span>
                </div>
              </div>
            </td>
            <td>
              <Dropdown className="dropdown flex-shrink-0 text-muted">
                <DropdownToggle as={'a'} className="drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
                  <IconifyIcon icon='ri:more-2-fill' />
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                  <DropdownItem><IconifyIcon icon='ri:share-line' className="me-1" /> Share</DropdownItem>
                  <DropdownItem><IconifyIcon icon='ri:link' className="me-1" /> Get Sharable Link</DropdownItem>
                  <DropdownItem href={avatar1} download><IconifyIcon icon='ri:download-line' className="me-1" />
                    Download</DropdownItem>
                  <DropdownItem><IconifyIcon icon='ri:pushpin-2-line' className=" me-1" /> Pin</DropdownItem>
                  <DropdownItem><IconifyIcon icon='ri:edit-box-line' className="me-1" /> Edit</DropdownItem>
                  <DropdownItem><IconifyIcon icon='ri:delete-bin-line' className="me-1" /> Delete</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </td>
          </tr>
        ))
      }
      {/* <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-danger-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <IconifyIcon icon='ri:file-pdf-line' className=" fs-22 text-danger" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">ocen-dashboard.pdf</a></span>
              <p className="mb-0 fs-12">18 Pdf</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src={avatar2} className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Carol L. Simon</p>
              <span className="fs-12">carollcimon@jourrapide.com</span>
            </div>
          </div>
        </td>
        <td>521 MB</td>
        <td>
          April 28, 2024
        </td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-danger rounded-circle fw-bold">
                Y
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-success rounded-circle fw-bold">
                L
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title text-bg-dark rounded-circle fw-bold">
                O
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-warning rounded-circle fw-bold">
                J
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-primary rounded-circle fw-bold">
                G
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-1.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-warning-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-copy-line fs-22 text-warning" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">Dashboard tech
                requirements</a></span>
              <p className="mb-0 fs-12">12 File</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-3.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Rosa L. Winters</p>
              <span className="fs-12">rosalwinters@teleworm.us</span>
            </div>
          </div>
        </td>
        <td>7.2 MB</td>
        <td>
          May 1, 2024
        </td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-primary rounded-circle fw-bold">
                A
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-warning rounded-circle fw-bold">
                B
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-danger rounded-circle fw-bold">
                R
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-secondary rounded-circle fw-bold">
                C
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title text-bg-dark rounded-circle fw-bold">
                U
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-1.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-primary-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-image-line fs-22 text-primary" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">dashboard.jpg</a></span>
              <p className="mb-0 fs-12">172 Jpg Photo</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-4.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Jeremy C. Willi</p>
              <span className="fs-12">jeremycwilliams@dayrep.com</span>
            </div>
          </div>
        </td>
        <td>54.2 MB</td>
        <td>
          May 2, 2024
        </td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-warning rounded-circle fw-bold">
                L
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-secondary rounded-circle fw-bold">
                Y
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title text-bg-dark rounded-circle fw-bold">
                A
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-primary rounded-circle fw-bold">
                R
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-info rounded-circle fw-bold">
                V
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-1.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-success-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-zip-line fs-22 text-success" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">admin-hospital.zip</a></span>
              <p className="mb-0 fs-12">admin-hospital.zip</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-5.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">James R. Alvares</p>
              <span className="fs-12">jamesralvares@jourrapide.com</span>
            </div>
          </div>
        </td>
        <td>8.3 MB</td>
        <td>
          May 6, 2024
        </td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title text-bg-dark rounded-circle fw-bold">
                G
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title text-bg-light rounded-circle fw-bold">
                O
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-secondary rounded-circle fw-bold">
                W
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-primary rounded-circle fw-bold">
                A
              </span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-warning rounded-circle fw-bold">
                K
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-1.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-danger-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-pdf-line fs-22 text-danger" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">Project-summary.pdf</a></span>
              <p className="mb-0 fs-12">5 Pages</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-2.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Michael S. Parks</p>
              <span className="fs-12">michaelparks@mail.com</span>
            </div>
          </div>
        </td>
        <td>80 MB</td>
        <td>April 22, 2024</td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-success rounded-circle fw-bold">A</span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-primary rounded-circle fw-bold">T</span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-2.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-primary-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-excel-line fs-22 text-primary" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">Sales-data.xlsx</a></span>
              <p className="mb-0 fs-12">20 Sheets</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-3.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Samantha W. Howard</p>
              <span className="fs-12">samantha.howard@mail.com</span>
            </div>
          </div>
        </td>
        <td>256 MB</td>
        <td>April 20, 2024</td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-info rounded-circle fw-bold">S</span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-warning rounded-circle fw-bold">C</span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-3.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-warning-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-ppt-2-line fs-22 text-warning" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">Presentation-slides.pptx</a></span>
              <p className="mb-0 fs-12">15 Slides</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-4.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Jonathan D. Keller</p>
              <span className="fs-12">jonathan.keller@mail.com</span>
            </div>
          </div>
        </td>
        <td>64 MB</td>
        <td>April 18, 2024</td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-danger rounded-circle fw-bold">J</span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-primary rounded-circle fw-bold">M</span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-4.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-success-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-text-line fs-22 text-success" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">Readme.txt</a></span>
              <p className="mb-0 fs-12">1 Page</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-5.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Emily R. Stone</p>
              <span className="fs-12">emilystone@mail.com</span>
            </div>
          </div>
        </td>
        <td>2 MB</td>
        <td>April 15, 2024</td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-warning rounded-circle fw-bold">E</span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-secondary rounded-circle fw-bold">N</span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-5.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-shrink-0 avatar-md bg-secondary-subtle d-inline-flex align-items-center justify-content-center rounded-2">
              <i className="ri-file-image-line fs-22 text-secondary" />
            </div>
            <div>
              <span className="fw-medium"><a href="" className="text-reset">Team-photo.jpg</a></span>
              <p className="mb-0 fs-12">1 Image</p>
            </div>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div>
              <a href="">
                <img src="assets/images/users/avatar-6.jpg" className="rounded-circle avatar-md" alt="friend" />
              </a>
            </div>
            <div>
              <p className="mb-0 fw-medium">Carlos M. Reyes</p>
              <span className="fs-12">carlos.reyes@mail.com</span>
            </div>
          </div>
        </td>
        <td>3 MB</td>
        <td>April 10, 2024</td>
        <td>
          <div className="avatar-group flex-nowrap">
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-info rounded-circle fw-bold">C</span>
            </div>
            <div className="avatar avatar-sm">
              <span className="avatar-title bg-danger rounded-circle fw-bold">R</span>
            </div>
          </div>
        </td>
        <td>
          <div className="dropdown flex-shrink-0 text-muted">
            <a href="#" className="dropdown-toggle drop-arrow-none fs-20 link-reset" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="ri-more-2-fill" />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-share-line me-1" /> Share</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-link me-1" /> Get Sharable Link</a>
              <a href="assets/images/users/avatar-6.jpg" download className="dropdown-item"><i className="ri-download-line me-1" />
                Download</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-pushpin-2-line me-1" /> Pin</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-edit-box-line me-1" /> Edit</a>
              <a href="javascript:void(0);" className="dropdown-item"><i className="ri-delete-bin-line me-1" /> Delete</a>
            </div>
          </div>
        </td>
      </tr> */}
    </tbody>
  )
}

export default FileData