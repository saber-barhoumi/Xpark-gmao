// src/app/(admin)/apps/email/components/EmailNavigationMenu.tsx

import IconifyIcon from '@/components/wrappers/IconifyIcon';
import useToggle from '@/hooks/useToggle';
import { Link } from 'react-router-dom';
import { CardBody, Collapse, Spinner } from 'react-bootstrap';
import ComposeEmailModal from './ComposeEmailModal';
import { EmailBoite, EnvoyerEmailDto } from '../types/email.types';

type Props = {
  boites:          EmailBoite[];
  boitesLoading:   boolean;
  boiteActive:     string;
  onBoiteChange:   (boite: string) => void;
  isOpenCompose:   boolean;
  toggleCompose:   () => void;
  envoyer:         (dto: EnvoyerEmailDto) => Promise<any>;
};

// Mapping boite → clé interne
const BOITES_CONFIG = [
  { cle: 'INBOX',   nom: 'Inbox',      icone: 'solar:inbox-outline' },
  { cle: 'Sent',    nom: 'Envoyés',    icone: 'solar:map-arrow-right-outline' },
  { cle: 'Starred', nom: 'Étoilés',    icone: 'solar:star-outline' },
  { cle: 'Drafts',  nom: 'Brouillons', icone: 'solar:clapperboard-edit-outline' },
  { cle: 'Spam',    nom: 'Spam',       icone: 'solar:info-square-outline' },
  { cle: 'Trash',   nom: 'Corbeille',  icone: 'solar:trash-bin-trash-outline' },
  { cle: 'All',     nom: 'Tous',       icone: 'solar:mailbox-outline' },
];

const EmailNavigationMenu = ({
  boites, boitesLoading, boiteActive, onBoiteChange,
  isOpenCompose, toggleCompose, envoyer
}: Props) => {
  const { isTrue, toggle } = useToggle(true);

  // Trouver le compteur d'une boîte
  const getBoiteInfo = (nom: string) =>
    boites.find(b => b.nom === nom || b.nom === BOITES_CONFIG.find(c => c.cle === nom)?.nom);

  const boitesPrincipales = BOITES_CONFIG.slice(0, 4);  // Inbox, Envoyés, Étoilés, Brouillons
  const boitesAutres      = BOITES_CONFIG.slice(4);      // Spam, Corbeille, Tous

  return (
    <div className="card email-sidebar">
      <div className="offcanvas-xxl offcanvas-start" tabIndex={-1} id="email-sidebar">
        <CardBody>
          <div className="d-flex justify-content-between gap-2 align-items-center mb-2">
            <button
              type="button"
              onClick={toggleCompose}
              className="btn btn-danger fw-semibold w-100"
            >
              Composer
            </button>
            <button
              type="button"
              className="btn btn-sm btn-icon btn-soft-danger ms-auto d-xl-none"
              data-bs-dismiss="offcanvas"
              data-bs-target="#email-sidebar"
            >
              <IconifyIcon icon="tabler:x" />
            </button>
          </div>

          {boitesLoading ? (
            <div className="text-center py-3">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="email-menu-list d-flex flex-column gap-1">
              {boitesPrincipales.map(b => {
                const info   = getBoiteInfo(b.cle);
                const active = boiteActive === b.cle;
                return (
                  <Link
                    key={b.cle}
                    to=""
                    onClick={e => { e.preventDefault(); onBoiteChange(b.cle); }}
                    className={active ? 'active fw-semibold' : ''}
                  >
                    <IconifyIcon icon={b.icone} className="me-2 fs-18 text-muted" />
                    <span>{b.nom}</span>
                    {/* Badge non lus — seulement pour Inbox */}
                    {info && info.nonLus > 0 && b.cle === 'INBOX' && (
                      <span className="badge bg-danger-subtle fs-12 text-danger ms-auto">
                        {info.nonLus}
                      </span>
                    )}
                    {/* Total pour les autres */}
                    {info && info.total > 0 && b.cle !== 'Starred' && b.cle !== 'INBOX' && (
                      <span className="badge bg-light text-muted ms-auto fs-11">
                        {info.total}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>

        <CardBody className="border-top border-light">
          <div
            onClick={toggle}
            className="btn-link d-flex align-items-center text-muted fw-bold fs-12 text-uppercase mb-0"
            style={{ cursor: 'pointer' }}
          >
            Autres <IconifyIcon icon='tabler:chevron-down' className="ms-auto" />
          </div>
          <Collapse in={isTrue}>
            <div>
              <div className="email-menu-list d-flex flex-column gap-1 mt-2">
                {boitesAutres.map(b => {
                  const info   = getBoiteInfo(b.cle);
                  const active = boiteActive === b.cle;
                  return (
                    <Link
                      key={b.cle}
                      to=""
                      onClick={e => { e.preventDefault(); onBoiteChange(b.cle); }}
                      className={active ? 'active fw-semibold' : ''}
                    >
                      <IconifyIcon icon={b.icone} className="me-2 fs-18 text-muted" />
                      <span>{b.nom}</span>
                      {info && info.total > 0 && (
                        <span className="badge bg-light text-muted ms-auto fs-11">
                          {info.total}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </Collapse>
        </CardBody>
      </div>

      <ComposeEmailModal isOpen={isOpenCompose} toggleComposeModal={toggleCompose} envoyer={envoyer} />
    </div>
  );
};

export default EmailNavigationMenu;