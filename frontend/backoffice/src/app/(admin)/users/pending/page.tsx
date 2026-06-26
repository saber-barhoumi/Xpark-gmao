import React from 'react';
import PendingUsers from './components/PendingUsers';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Card, CardHeader, Col, Row } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const PendingUsersPage = () => {
    return (
        <>
            <PageBreadcrumb title='Utilisateurs en attente' />
            <Row>
                <Col xs={12}>
                    <Card>
                        <CardHeader className="justify-content-between d-flex gap-2">
                            <h4 className="header-title">Admissions en attente</h4>
                        </CardHeader>
                    </Card>
                </Col>
            </Row>
            <PendingUsers />
        </>
    );
};

export default PendingUsersPage;
