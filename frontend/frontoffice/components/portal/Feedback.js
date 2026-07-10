"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Feedback — remplace les alert()/confirm() natifs du navigateur par des
 * dialogues et toasts à la charte XPARK (bonnes pratiques UI/UX).
 *
 *   const [confirm, confirmDialog] = useConfirm()
 *   const ok = await confirm({ title, message, confirmLabel, danger })
 *
 *   const [toast, toastNode] = useToast()
 *   toast("Réservation annulée.", "success" | "error" | "info")
 *
 * `confirmDialog` et `toastNode` se rendent une fois dans le JSX de la page.
 */

// ── Confirmation (promesse, à la place de window.confirm) ───────────────────

export function useConfirm() {
    const [state, setState] = useState(null)

    const confirm = useCallback((opts) =>
        new Promise((resolve) => setState({ ...opts, resolve })), [])

    const close = (answer) => {
        state?.resolve(answer)
        setState(null)
    }

    const dialog = state ? <ConfirmDialog {...state} onClose={close} /> : null
    return [confirm, dialog]
}

function ConfirmDialog({ title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler",
    danger = false, icon, onClose }) {

    // Échap = annuler, et focus piégé sur le dialogue
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(false) }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [onClose])

    return (
        <div role="dialog" aria-modal="true" aria-label={title}
            style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex",
                alignItems: "center", justifyContent: "center", padding: 20,
                background: "rgba(15,27,36,.55)", backdropFilter: "blur(2px)",
                animation: "xpkFadeIn .15s ease" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(false) }}>
            <div style={{ width: "100%", maxWidth: 430, background: "var(--pcard, #fff)",
                color: "var(--ptext, #1f2b38)", borderRadius: 16, overflow: "hidden",
                boxShadow: "0 24px 70px rgba(0,0,0,.35)", animation: "xpkPopIn .18s ease" }}>

                <div style={{ padding: "26px 28px 8px", textAlign: "center" }}>
                    <div style={{ width: 58, height: 58, borderRadius: "50%", margin: "0 auto 14px",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                        background: danger ? "rgba(193,20,37,.12)" : "rgba(13,110,253,.12)" }}>
                        {icon || (danger ? "⚠️" : "❓")}
                    </div>
                    <h3 style={{ fontSize: 17.5, fontWeight: 800, margin: "0 0 8px" }}>{title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--pmuted, #6b7280)", margin: 0 }}>
                        {message}
                    </p>
                </div>

                <div style={{ display: "flex", gap: 10, padding: "22px 28px 26px" }}>
                    <button type="button" onClick={() => onClose(false)} autoFocus
                        style={{ flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                            border: "1px solid var(--pborder, #e6e9ee)", background: "transparent",
                            color: "var(--ptext, #1f2b38)", fontSize: 14, fontWeight: 600 }}>
                        {cancelLabel}
                    </button>
                    <button type="button" onClick={() => onClose(true)}
                        style={{ flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                            border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                            background: danger ? "#C11425" : "#0d6efd" }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes xpkFadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes xpkPopIn  { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: scale(1) } }
            `}</style>
        </div>
    )
}

// ── Toast (à la place de window.alert pour l'information) ───────────────────

const TOAST_STYLES = {
    success: { bg: "#d1e7dd", fg: "#146c43", icon: "✅" },
    error:   { bg: "#f8d7da", fg: "#b02a37", icon: "⛔" },
    info:    { bg: "#cfe2ff", fg: "#084298", icon: "ℹ️" },
}

export function useToast() {
    const [toastState, setToastState] = useState(null)
    const timer = useRef(null)

    const toast = useCallback((text, type = "info", duration = 4500) => {
        clearTimeout(timer.current)
        setToastState({ text, type })
        timer.current = setTimeout(() => setToastState(null), duration)
    }, [])

    useEffect(() => () => clearTimeout(timer.current), [])

    const node = toastState ? (
        <div role="status" aria-live="polite"
            style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)",
                zIndex: 2100, display: "flex", alignItems: "center", gap: 10,
                background: TOAST_STYLES[toastState.type].bg, color: TOAST_STYLES[toastState.type].fg,
                padding: "13px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                boxShadow: "0 10px 34px rgba(0,0,0,.22)", maxWidth: "calc(100vw - 40px)",
                animation: "xpkToastIn .2s ease" }}>
            <span>{TOAST_STYLES[toastState.type].icon}</span>
            <span>{toastState.text}</span>
            <button type="button" onClick={() => setToastState(null)} aria-label="Fermer"
                style={{ border: "none", background: "transparent", color: "inherit",
                    cursor: "pointer", fontSize: 16, fontWeight: 700, padding: "0 0 0 6px" }}>✕</button>
            <style jsx global>{`
                @keyframes xpkToastIn { from { opacity: 0; transform: translate(-50%, 12px) }
                                        to   { opacity: 1; transform: translate(-50%, 0) } }
            `}</style>
        </div>
    ) : null

    return [toast, node]
}
