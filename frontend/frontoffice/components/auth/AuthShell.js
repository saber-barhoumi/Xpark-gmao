"use client"

import Link from "next/link"

/**
 * Coquille des pages d'authentification — SANS header ni footer du site :
 * plein écran centré, logo cliquable vers l'accueil, carte blanche.
 * Conserve le thème onpoint (classes contact-two, thm-btn, typo globale).
 */
export default function AuthShell({ tagline = "Espace Client XPARK", title, wide = false, children }) {
    return (
        <section className="contact-two" style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #f6f8fb 0%, #eef1f6 100%)",
            padding: "40px 15px",
        }}>
            <Link href="/" style={{ marginBottom: 30 }}>
                <img src="/assets/images/resources/logo-1.png" alt="XPARK" style={{ maxHeight: 54 }} />
            </Link>

            <div style={{
                width: "100%",
                maxWidth: wide ? 720 : 520,
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 10px 40px rgba(16, 24, 40, 0.08)",
                padding: "40px 35px",
            }}>
                <div className="section-title text-center" style={{ marginBottom: 25 }}>
                    <div className="section-title__tagline-box">
                        <span className="section-title__tagline">{tagline}</span>
                    </div>
                    <h2 className="section-title__title" style={{ fontSize: 30 }}>{title}</h2>
                </div>
                {children}
            </div>

            <p style={{ marginTop: 25, color: "#6b7280", fontSize: 13 }}>
                © XPARK GMAO — <Link href="/" style={{ color: "#6b7280" }}>Retour au site</Link>
            </p>
        </section>
    )
}
