// src/app/(admin)/apps/email/components/EmailArea.tsx
'use client';

import { useState } from 'react';
import { Card, CardBody, Col, Offcanvas, OffcanvasBody, OffcanvasHeader,
         OverlayTrigger, Row, Spinner, Tooltip } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import useToggle from '@/hooks/useToggle';
import { useQuery } from '@tanstack/react-query';

import { EmailListItem } from '../types/email.types';
import emailService from '../services/emailService';
import EmailNavigationMenu from './EmailNavigationMenu';
import ComposeEmailModal from './ComposeEmailModal';
import { useEmail } from '../hooks/useEmail';

// ── Helper taille fichier ────────────────────────────────────────────
const fmtTaille = (bytes: number) => {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ── Helper date ──────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const EmailArea = () => {
  const {
    boites, boitesLoading,
    emails, emailsLoading, isFetching,
    totalEmails, nonLus, totalPages,
    boiteActive, changerBoite,
    page, setPage, search, setSearch,
    marquerLu, etoiler, supprimer, envoyer,
  } = useEmail('INBOX');

  // ── Offcanvas détail ─────────────────────────────────────────────
  const { isTrue: detailOpen, toggle: toggleDetail } = useToggle();
  const [emailSelectionne, setEmailSelectionne] = useState<string | null>(null);
  const { isTrue: isOpenCompose, toggle: toggleCompose } = useToggle();
  const [replyData, setReplyData] = useState<{ a: string; sujet: string } | null>(null);

  // ── Charger le détail d'un email ──────────────────────────────────
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey:  ['email', 'detail', boiteActive, emailSelectionne],
    queryFn:   () => emailService.getEmailDetail(boiteActive, emailSelectionne!),
    enabled:   !!emailSelectionne && detailOpen,
    staleTime: 60_000,
  });

  const ouvrirEmail = (email: EmailListItem) => {
    setEmailSelectionne(email.id);
    toggleDetail();
    if (!email.lu) marquerLu(email.id, true);
  };

  const cleanOpenCompose = () => {
    setReplyData(null);
    toggleCompose();
  };

  const handleReply = () => {
    if (!detail) return;
    setReplyData({ a: detail.de, sujet: detail.sujet });
    toggleDetail();
    toggleCompose();
  };

  const handleForward = () => {
    if (!detail) return;
    setReplyData({ a: '', sujet: `Tr: ${detail.sujet}` });
    toggleDetail();
    toggleCompose();
  };

  return (
    <>
      <EmailNavigationMenu
        boites={boites ?? []}
        boitesLoading={boitesLoading}
        boiteActive={boiteActive}
        onBoiteChange={changerBoite}
        isOpenCompose={isOpenCompose}
        toggleCompose={cleanOpenCompose}
        envoyer={envoyer}
      />

      <Card className="flex-grow-1">
        <div className="border-start border-light h-100">
          <CardBody className="py-2">
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light d-xxl-none d-flex p-1"
                data-bs-toggle="offcanvas" data-bs-target="#email-sidebar">
                <IconifyIcon icon='tabler:menu-2' className="fs-17" />
              </button>

              {/* Actions rapides */}
              <div className="d-flex align-items-center">
                <OverlayTrigger placement="top" overlay={<Tooltip>Rafraîchir</Tooltip>}>
                   <button 
                    type="button" 
                    className="btn btn-sm btn-icon btn-ghost-light text-dark rounded-circle"
                    onClick={() => changerBoite(boiteActive)}
                  >
                    <IconifyIcon icon='tabler:refresh' className={`fs-18 ${isFetching ? 'spin' : ''}`} />
                  </button>
                </OverlayTrigger>
              </div>

              {/* Barre de recherche */}
              <div className="ms-auto d-xl-flex d-none">
                <div className="app-search">
                  <input
                    type="text"
                    className="form-control rounded-pill"
                    placeholder="Rechercher un email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                  <IconifyIcon icon='ri:search-line' className="fs-18 app-search-icon text-muted" />
                </div>
              </div>

              {/* Spinner rafraîchissement */}
              {isFetching && <Spinner size="sm" className="ms-2 text-muted" />}

              {/* Compteur */}
              <span className="text-muted fs-12 ms-2">
                {nonLus > 0 && boiteActive === 'INBOX' && <span className="badge bg-danger me-1">{nonLus} non lus</span>}
                {totalEmails} emails
              </span>
            </div>
          </CardBody>

          <div className="border-top border-light">
            {emailsLoading ? (
              <div className="text-center py-5">
                <Spinner />
                <p className="text-muted mt-2 fs-13">Chargement des emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <IconifyIcon icon="solar:inbox-outline" style={{ fontSize: 48 }} className="mb-3 d-block mx-auto opacity-25" />
                <p className="fs-14">Aucun email dans cette boîte</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mail-list mb-0">
                  <tbody>
                    {emails.map((email) => (
                      <tr
                        key={email.id}
                        className={`position-relative ${!email.lu ? 'fw-semibold' : ''}`}
                        onClick={() => ouvrirEmail(email)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="ps-3" style={{ width: 40 }}>
                          <input
                            className="form-check-input position-relative z-2"
                            type="checkbox"
                            onClick={e => e.stopPropagation()}
                          />
                        </td>

                        {/* Étoile */}
                        <td style={{ width: 40 }}>
                          <button
                            className={`btn p-0 fs-16 flex-shrink-0 ${email.etoile ? 'text-warning' : 'text-muted'}`}
                            onClick={e => { e.stopPropagation(); etoiler(email.id, !email.etoile); }}
                          >
                            <IconifyIcon icon={email.etoile ? "tabler:star-filled" : "tabler:star"} />
                          </button>
                        </td>

                        {/* Expéditeur */}
                        <td style={{ width: 200 }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-sm rounded-circle bg-soft-primary d-flex align-items-center justify-content-center fw-bold text-primary" style={{ width: 32, height: 32 }}>
                              {(email.deNom || email.de)[0].toUpperCase()}
                            </div>
                            <h5 className="fs-14 mb-0 fw-medium text-truncate" style={{ maxWidth: 150 }}>
                              {email.deNom || email.de}
                            </h5>
                          </div>
                        </td>

                        {/* Sujet */}
                        <td>
                          <span className={`fs-14 text-truncate d-inline-block ${!email.lu ? 'fw-semibold text-dark' : 'text-muted'}`} style={{ maxWidth: 400 }}>
                            {email.sujet}
                          </span>
                        </td>

                        {/* Pièce jointe */}
                        <td style={{ width: 60 }}>
                          {email.aPieceJointe && (
                            <span className="text-muted">
                              <IconifyIcon icon="tabler:paperclip" />
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ width: 100 }}>
                          <p className="fs-12 text-muted mb-0 text-end text-nowrap">
                            {fmtDate(email.dateUtc)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 py-3 border-top">
                <button
                  className="btn btn-sm btn-light"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Préc.
                </button>
                <span className="text-muted fs-13">
                  Page {page} / {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-light"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suiv. →
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Offcanvas détail email ── */}
      <Offcanvas
        show={detailOpen}
        onHide={toggleDetail}
        placement="end"
        className="offcanvas-end"
        style={{ width: '40%' }}
      >
        <OffcanvasHeader className="d-flex flex-wrap gap-2 align-items-start border-bottom py-2">
          {detail && (
            <>
              <div className="avatar-md rounded-circle bg-soft-primary d-flex align-items-center justify-content-center fw-bold text-primary">
                {(detail.deNom || detail.de)[0].toUpperCase()}
              </div>
              <div className="flex-grow-1">
                <h6 className="fs-16 mb-1">{detail.deNom}</h6>
                <p className="text-muted mb-0 fs-12">De : {detail.de}</p>
              </div>
            </>
          )}
          <button type="button" className="btn-close" onClick={toggleDetail} />
        </OffcanvasHeader>

        <OffcanvasBody>
          {detailLoading ? (
            <div className="text-center py-5"><Spinner /></div>
          ) : detail ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                 <h5 className="fs-18 mb-0">{detail.sujet}</h5>
                 <span className="text-muted fs-12">{new Date(detail.dateUtc).toLocaleString('fr-FR')}</span>
              </div>
              <hr />
              {/* Corps HTML de l'email */}
              <div
                className="email-content"
                dangerouslySetInnerHTML={{ __html: detail.corps }}
                style={{ fontSize: 14, lineHeight: 1.6 }}
              />

              {/* Pièces jointes */}
              {detail.piecesJointes.length > 0 && (
                <>
                  <hr />
                  <h5 className="mb-3 fw-bold fs-14">
                    Pièces jointes ({detail.piecesJointes.length})
                  </h5>
                  <Row>
                    {detail.piecesJointes.map((pj, i) => {
                      const ext = pj.nom.split('.').pop()?.toUpperCase() ?? 'FILE';
                      const isImg = pj.type.startsWith('image/');
                      return (
                        <Col xl={12} key={i} className="mb-2">
                          <Card className="mb-0 shadow-none border border-light">
                            <div className="p-2">
                              <Row className="align-items-center">
                                <Col xs="auto">
                                  {isImg ? (
                                    <img
                                      src={`data:${pj.type};base64,${pj.contenu}`}
                                      className="avatar-sm rounded"
                                      alt={pj.nom}
                                      style={{ objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div className="avatar-sm">
                                      <span className="avatar-title bg-soft-primary text-primary rounded fs-10">
                                        .{ext}
                                      </span>
                                    </div>
                                  )}
                                </Col>
                                <Col className="ps-0">
                                  <span className="text-muted fw-bold fs-12 d-block text-truncate">
                                    {pj.nom}
                                  </span>
                                  <p className="mb-0 fs-11 text-muted">
                                    {fmtTaille(pj.taille)}
                                  </p>
                                </Col>
                                <Col xs="auto">
                                  <a
                                    href={`data:${pj.type};base64,${pj.contenu}`}
                                    download={pj.nom}
                                    className="btn btn-link btn-sm text-muted"
                                  >
                                    <IconifyIcon icon='ri:download-2-line' />
                                  </a>
                                </Col>
                              </Row>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </>
              )}
            </>
          ) : null}
        </OffcanvasBody>

        <div className="offcanvas-footer gap-1 p-2 d-flex justify-content-between border-top align-items-center">
          <button
            className="btn btn-sm btn-soft-danger"
            onClick={() => {
              if (emailSelectionne) {
                supprimer(emailSelectionne);
                toggleDetail();
              }
            }}
          >
            <IconifyIcon icon="tabler:trash" className="me-1" />
            Supprimer
          </button>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-primary" onClick={handleReply}>
              <IconifyIcon icon='ri:reply-line' className="me-1" />
              Répondre
            </button>
            <button className="btn btn-sm btn-outline-primary" onClick={handleForward}>
              <IconifyIcon icon='ri:share-forward-line' className="me-1" />
              Transférer
            </button>
          </div>
        </div>
      </Offcanvas>

      <ComposeEmailModal
        isOpen={isOpenCompose}
        toggleComposeModal={toggleCompose}
        envoyer={envoyer}
        replyData={replyData}
        onClose={() => setReplyData(null)}
      />
    </>
  );
};

export default EmailArea;