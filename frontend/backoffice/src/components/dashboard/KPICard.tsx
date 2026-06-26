import { Card, Badge } from 'react-bootstrap';

interface KPICardProps {
  nom: string;
  valeur: number;
  unite: string;
  objectif?: number;
  tendance: 'HAUSSE' | 'BAISSE' | 'STABLE';
  icone: string;
  couleur: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  description?: string;
  pourcentageObjectif: number;
  objectifAtteint: boolean;
}

export default function KPICard({
  nom,
  valeur,
  unite,
  objectif,
  tendance,
  icone,
  couleur,
  description,
  pourcentageObjectif,
  objectifAtteint,
}: KPICardProps) {
  const getTendanceIcon = () => {
    switch (tendance) {
      case 'HAUSSE': return <i className="ri-arrow-up-line text-success"></i>;
      case 'BAISSE': return <i className="ri-arrow-down-line text-danger"></i>;
      case 'STABLE': return <i className="ri-arrow-right-line text-muted"></i>;
      default: return <i className="ri-arrow-right-line text-muted"></i>;
    }
  };

  return (
    <Card className="card-animate border-0 shadow-sm h-100">
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className="flex-grow-1 overflow-hidden">
            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
              {nom}
            </p>
          </div>
          <div className="flex-shrink-0">
            {getTendanceIcon()}
          </div>
        </div>
        
        <div className="d-flex align-items-end justify-content-between mt-4">
          <div>
            <h4 className={`fs-22 fw-semibold ff-secondary mb-2 text-${couleur}`}>
              <span className="counter-value">
                {valeur.toLocaleString()}
              </span>
              <small className="text-muted ms-1 fs-12">{unite}</small>
            </h4>
            {description && (
              <p className="text-muted mb-0 fs-12 text-truncate" title={description}>{description}</p>
            )}
          </div>
          <div className="avatar-sm flex-shrink-0">
            <span className={`avatar-title bg-${couleur}-subtle rounded fs-3`}>
              <i className={`${icone} text-${couleur}`}></i>
            </span>
          </div>
        </div>

        {objectif && (
          <div className="mt-3">
            <div className="progress animated-progress custom-progress progress-sm">
              <div 
                className={`progress-bar bg-${couleur}`}
                role="progressbar" 
                style={{ width: `${Math.min(pourcentageObjectif, 100)}%` }}
                aria-valuenow={pourcentageObjectif}
                aria-valuemin={0}
                aria-valuemax={100}
              >
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <p className="text-muted mb-0 fs-11">
                Objectif : {objectif.toLocaleString()} {unite}
              </p>
              <div className="d-flex align-items-center">
                <span className="text-muted fs-11 me-2">{pourcentageObjectif}%</span>
                {objectifAtteint && (
                  <Badge bg="success-subtle" className="text-success border border-success-subtle">
                    <i className="ri-check-line me-1"></i>
                    Atteint
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
