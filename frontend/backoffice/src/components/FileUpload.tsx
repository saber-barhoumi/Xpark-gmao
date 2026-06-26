import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import DropzoneFormInput from './form/DropzoneFormInput'

const FileUpload = ({ title, onFileUpload }: { title: string, onFileUpload?: (files: any) => void }) => {
  return (
    <>
      <CardBody>
        <DropzoneFormInput
          text="Déposez les fichiers ici ou cliquez pour télécharger."
          showPreview
          onFileUpload={onFileUpload}
        />
      </CardBody>
    </>
  )
}

export default FileUpload
