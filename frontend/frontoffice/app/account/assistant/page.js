"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card } from "@/components/portal/ui"
import { reply, WELCOME } from "@/lib/assistantEngine"

/**
 * 🤖 Assistant IA — chat du portail client.
 * L'intelligence vit dans lib/assistantEngine.js (estimation de prix via
 * CalculateurPrixTrajetIA + réponses guidées) ; cette page ne gère que l'UI.
 * L'historique est conservé en localStorage.
 */

const STORAGE_KEY = "xpark_assistant_history"

export default function AssistantPage() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [typing, setTyping] = useState(false)
    const bottomRef = useRef(null)

    // Historique persistant (ou message d'accueil)
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
            setMessages(saved.length ? saved : [{ from: "bot", ...WELCOME }])
        } catch {
            setMessages([{ from: "bot", ...WELCOME }])
        }
    }, [])

    useEffect(() => {
        if (messages.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)))
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const send = async (text) => {
        const content = (text ?? input).trim()
        if (!content || typing) return
        setInput("")
        setMessages(prev => [...prev, { from: "user", text: content }])
        setTyping(true)
        try {
            const r = await reply(content)
            setMessages(prev => [...prev, { from: "bot", ...r }])
        } finally {
            setTyping(false)
        }
    }

    const clear = () => {
        localStorage.removeItem(STORAGE_KEY)
        setMessages([{ from: "bot", ...WELCOME }])
    }

    const lastQuickReplies = [...messages].reverse().find(m => m.from === "bot" && m.quickReplies)?.quickReplies

    return (
        <ClientPortalLayout title="🤖 Assistant IA">
            <div style={{ ...card, padding: 0, display: "flex", flexDirection: "column",
                height: "calc(100vh - 210px)", minHeight: 420 }}>

                {/* En-tête du chat */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                    borderBottom: "1px solid var(--pborder)" }}>
                    <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#C11425",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Assistant XPARK</div>
                        <div style={{ fontSize: 12, color: "#146c43", fontWeight: 600 }}>● En ligne</div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={clear}
                        style={{ border: "1px solid var(--pborder)", background: "var(--pbg)", color: "var(--pmuted)",
                            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12.5 }}>
                        🗑️ Effacer
                    </button>
                </div>

                {/* Fil de discussion */}
                <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex",
                    flexDirection: "column", gap: 14 }}>
                    {messages.map((m, i) => <Bubble key={i} m={m} />)}
                    {typing && (
                        <div style={{ alignSelf: "flex-start", background: "var(--pbg)", border: "1px solid var(--pborder)",
                            borderRadius: "14px 14px 14px 4px", padding: "10px 16px", color: "var(--pmuted)", fontSize: 14 }}>
                            L'assistant écrit…
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Suggestions rapides */}
                {lastQuickReplies && !typing && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 20px 12px" }}>
                        {lastQuickReplies.map(q => (
                            <button key={q} type="button" onClick={() => send(q)}
                                style={{ border: "1px solid var(--pborder)", background: "var(--pbg)", color: "var(--ptext)",
                                    borderRadius: 20, padding: "7px 14px", cursor: "pointer", fontSize: 12.5 }}>
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Saisie */}
                <form onSubmit={(e) => { e.preventDefault(); send() }}
                    style={{ display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--pborder)" }}>
                    <input value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder="Posez votre question… (ex : Combien coûte Tunis → Sfax ?)"
                        style={{ flex: 1, border: "1px solid var(--pborder)", background: "var(--pbg)",
                            color: "var(--ptext)", borderRadius: 10, padding: "12px 16px", outline: "none", fontSize: 14 }} />
                    <button type="submit" disabled={typing || !input.trim()} className="thm-btn"
                        style={{ padding: "12px 22px", opacity: typing || !input.trim() ? 0.6 : 1 }}>
                        Envoyer<span />
                    </button>
                </form>
            </div>
        </ClientPortalLayout>
    )
}

/** Bulle de message (user à droite, bot à gauche + liens d'action) */
function Bubble({ m }) {
    const isUser = m.from === "user"
    return (
        <div style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "78%" }}>
            <div style={{
                background: isUser ? "#C11425" : "var(--pbg)",
                color: isUser ? "#fff" : "var(--ptext)",
                border: isUser ? "none" : "1px solid var(--pborder)",
                borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "11px 16px", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-line" }}>
                {m.text}
            </div>
            {m.links && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {m.links.map(l => (
                        <Link key={l.href + l.label} href={l.href}
                            style={{ background: "var(--pcard)", border: "1px solid #C11425", color: "#C11425",
                                borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600 }}>
                            {l.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
