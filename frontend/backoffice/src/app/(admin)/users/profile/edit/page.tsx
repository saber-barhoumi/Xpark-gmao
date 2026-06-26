import React from 'react'
import { Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import EditProfileForm from './components/EditProfileForm'

const EditProfilePage = () => {
  return (
    <>
      <PageBreadcrumb
        title="Modifier mon profil"
        subName="Profil"
      />
      <Row className="justify-content-center">
        <Col xxl={8} xl={10}>
          <EditProfileForm />
        </Col>
      </Row>
    </>
  )
}

export default EditProfilePage
