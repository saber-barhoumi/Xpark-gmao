import FileUpload from '@/components/FileUpload'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import React from 'react'
import { Card, CardBody, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { Attachment } from '@/services/viewDetailsService'
import { getFileExtensionIcon } from '@/utils/get-icons'

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const Attachments = ({ attachments, onUpload }: { attachments: Attachment[], onUpload: (file: File) => void }) => {
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center border-bottom border-dashed">
        <h5 className="header-title">Attachments</h5>
        <Dropdown align={'end'} className="float-end">
          <DropdownToggle as={'a'} className="drop-arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
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
            <DropdownItem className=" text-danger">
              <IconifyIcon icon='tabler:trash' className="me-1" />Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardBody>
        {attachments.length > 0 && (
          <div className="mb-3">
            {attachments.map((file) => (
              <div key={file.id} className="border rounded mb-2 p-2 d-flex align-items-center">
                <div className="avatar-sm bg-light rounded d-flex align-items-center justify-content-center me-2">
                  <IconifyIcon icon={getFileExtensionIcon(file.nom)} className="fs-24 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h5 className="fs-14 mb-0 text-truncate">
                    <a href={`${API_URL}${file.url}`} target="_blank" rel="noopener noreferrer" className="text-dark">
                      {file.nom}
                    </a>
                  </h5>
                  <small className="text-muted">{(file.taille / 1024).toFixed(1)} KB</small>
                </div>
              </div>
            ))}
          </div>
        )}
        <FileUpload 
          title="Ajouter un fichier" 
          onFileUpload={(files) => {
            if (files && files.length > 0) {
              onUpload(files[0] as File);
            }
          }} 
        />
      </CardBody>
    </Card>
  )
}

export default Attachments