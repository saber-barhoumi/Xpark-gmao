import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface PriorityIconProps {
    priority: string;
}

const PriorityIcon: React.FC<PriorityIconProps> = ({ priority }) => {
    const getPriorityConfig = (p: string) => {
        switch (p?.toUpperCase()) {
            case 'URGENT':
                return { icon: 'ri-fire-fill', color: '#ef4444', label: 'Urgent', pulse: true };
            case 'HAUTE':
                return { icon: 'ri-error-warning-fill', color: '#f97316', label: 'Haute' };
            case 'MOYENNE':
                return { icon: 'ri-time-fill', color: '#3b82f6', label: 'Moyenne' };
            case 'BASSE':
                return { icon: 'ri-checkbox-circle-fill', color: '#10b981', label: 'Basse' };
            default:
                return { icon: 'ri-question-fill', color: '#94a3b8', label: 'Inconnue' };
        }
    };

    const config = getPriorityConfig(priority);

    return (
        <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`tooltip-${priority}`}>{config.label}</Tooltip>}
        >
            <div
                className={`d-inline-flex align-items-center justify-content-center rounded-circle ${config.pulse ? 'pulse-animation' : ''}`}
                style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                    fontSize: '14px'
                }}
            >
                <i className={config.icon}></i>
            </div>
        </OverlayTrigger>
    );
};

export default PriorityIcon;
