// src/app/(admin)/apps/email/components/ComposeEmailModal.tsx

import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Spinner } from 'react-bootstrap';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { EnvoyerEmailDto } from '../types/email.types';

interface Props {
  isOpen:              boolean;
  toggleComposeModal:  () => void;
  envoyer:             (dto: EnvoyerEmailDto) => Promise<any>;
  replyData?:          { a: string; sujet: string } | null;
  onClose?:            () => void;
}

const ComposeEmailModal = ({
  isOpen, toggleComposeModal, envoyer, replyData, onClose
}: Props) => {
  const [to,      setTo]      = useState('');
  const [cc,      setCc]      = useState('');
  const [sujet,   setSujet]   = useState('');
  const [corps,   setCorps]   = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pré-remplir si c'est une réponse
  useEffect(() => {
    if (replyData) {
      setTo(replyData.a);
      setSujet(replyData.sujet.startsWith('Re:') ? replyData.sujet : `Re: ${replyData.sujet}`);
    }
  }, [replyData, isOpen]);

  const handleClose = () => {
    setTo(''); setCc(''); setSujet(''); setCorps('');
    setError(null); setSuccess(false);
    onClose?.();
    toggleComposeModal();
  };

  const handleSend = async () => {
    if (!to.trim() || !sujet.trim()) {
      setError('Le destinataire et le sujet sont obligatoires.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await envoyer({
        a:     to.split(',').map(s => s.trim()).filter(Boolean),
        cc:    cc.split(',').map(s => s.trim()).filter(Boolean),
        sujet,
        corps,
      });
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (err: any) {
      setError('Impossible d\'envoyer l\'email. Détails: ' + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal size="lg" show={isOpen} onHide={handleClose} centered>
      <ModalHeader className="py-2">
        <ModalTitle as="h4">
          {replyData ? 'Répondre' : 'Nouveau message'}
        </ModalTitle>
        <button type="button" className="btn-close" onClick={handleClose} />
      </ModalHeader>

      <ModalBody>
        {success ? (
          <div className="text-center py-4">
            <div className="fs-48 mb-2">✅</div>
            <h6 className="text-success">Email envoyé avec succès !</h6>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSend(); }}>
            {error && (
              <div className="alert alert-danger py-2 fs-13 mb-3">
                {error}
              </div>
            )}

            <div className="mb-2">
              <label className="form-label">À *</label>
              <input
                type="text"
                className="form-control"
                placeholder="email@exemple.com (séparer par virgule)"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Cc</label>
              <input
                type="text"
                className="form-control"
                placeholder="email@exemple.com"
                value={cc}
                onChange={e => setCc(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Sujet *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Objet du message"
                value={sujet}
                onChange={e => setSujet(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Message</label>
              <ReactQuill
                theme="snow"
                value={corps}
                onChange={setCorps}
                style={{ height: 150 }}
                className="mb-4"
              />
            </div>
          </form>
        )}
      </ModalBody>

      {!success && (
        <ModalFooter className="py-2 gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? <><Spinner size="sm" className="me-2" />Envoi...</> : 'Envoyer'}
          </button>
          <button type="button" className="btn btn-light" onClick={handleClose}>
            Annuler
          </button>
        </ModalFooter>
      )}
    </Modal>
  );
};

export default ComposeEmailModal;