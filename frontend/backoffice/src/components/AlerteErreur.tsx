import React from 'react';
import { Alert } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

/**
 * ⚠️ ALERTE ERREUR — XPARK GMAO
 * Composant réutilisable pour afficher des messages d'erreur inline
 * (formulaire, liste, widget) avec icônes et variantes adaptées.
 */

interface Props {
  status?:    number;
  message:    React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<number, { variant: string; icon: string; titre: string }> = {
  400: { variant: 'warning',  icon: 'tabler:alert-triangle',     titre: 'Données invalides' },
  403: { variant: 'danger',   icon: 'tabler:lock',               titre: 'Accès refusé' },
  404: { variant: 'info',     icon: 'tabler:search-off',         titre: 'Ressource introuvable' },
  409: { variant: 'warning',  icon: 'tabler:copy-off',           titre: 'Conflit de données' },
  422: { variant: 'warning',  icon: 'tabler:forms',              titre: 'Formulaire incorrect' },
  429: { variant: 'warning',  icon: 'tabler:clock-pause',        titre: 'Trop de requêtes' },
  500: { variant: 'danger',   icon: 'tabler:server-off',         titre: 'Erreur serveur' },
  503: { variant: 'danger',   icon: 'tabler:cloud-off',          titre: 'Service indisponible' },
};

export const AlerteErreur: React.FC<Props> = ({
  status = 500, message, onDismiss, className
}) => {
  const cfg = STATUS_CONFIG[status] ?? {
    variant: 'danger',
    icon: 'lucide:circle-alert',
    titre: 'Une erreur est survenue',
  };

  return (
    <Alert
      variant={cfg.variant}
      dismissible={!!onDismiss}
      onClose={onDismiss}
      className={`d-flex align-items-start gap-2 shadow-sm border-0 py-2 px-3 rounded-2 ${className ?? ''}`}
    >
      <div className={`text-${cfg.variant} flex-shrink-0 mt-1`}>
         <IconifyIcon icon={cfg.icon} className="fs-20" />
      </div>
      <div className="flex-grow-1">
        <div className={`fw-bold fs-14 mb-0 text-${cfg.variant}`}>{cfg.titre}</div>
        <div className="fs-13 text-muted">{message}</div>
      </div>
    </Alert>
  );
};

export default AlerteErreur;
