import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * 🛡️ ERROR BOUNDARY — XPARK GMAO
 * Intercepte les crashs JavaScript fatals pour éviter l'écran blanc.
 * Redirige vers la page d'erreur 500 professionnelle.
 */

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    // Prochaine passe de rendu → affichera le fallback ou redirigera
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log technique pour le développeur (optionnel : envoyer vers Sentry)
    console.error('[ErrorBoundary] Crash applicatif intercepté :', error, info);

    // Stockage en session pour diagnostic ultérieur
    sessionStorage.setItem('lastCrash', JSON.stringify({
      message:   error.message,
      stack:     error.stack?.split('\n').slice(0, 5).join('\n'),
      component: info.componentStack?.split('\n')[1]?.trim(),
      timestamp: new Date().toISOString(),
    }));

    // Redirection immédiate vers la page d'erreur 500 personnalisée
    if (!window.location.pathname.includes('/errors/error-500')) {
        window.location.href = '/errors/error-500';
    }
  }

  render() {
    if (this.state.hasError) {
      // On affiche un écran vide temporaire car la redirection est en cours dans componentDidCatch
      return null;
    }
    return this.props.children;
  }
}

/**
 * 🧱 SECTION ERROR BOUNDARY
 * Pour les widgets (Dashboard, Stats, etc.). 
 * Empêche qu'une erreur locale ne fasse planter TOUTE l'application.
 */

interface SectionProps {
  children:    ReactNode;
  sectionName: string;
}

interface SectionState {
  hasError: boolean;
  error:    string;
}

export class SectionErrorBoundary extends Component<SectionProps, SectionState> {
  constructor(props: SectionProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): SectionState {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card shadow-none border border-danger bg-soft-danger m-2 p-4 text-center rounded-3">
          <div className="avatar-md bg-danger text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
             <i className="ri-error-warning-line fs-24"></i>
          </div>
          <h5 className="text-danger fw-bold">Erreur : {this.props.sectionName}</h5>
          <p className="text-muted small">Ce module a rencontré un problème. Le reste de l'application demeure fonctionnel.</p>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
