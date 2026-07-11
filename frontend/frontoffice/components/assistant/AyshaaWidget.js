"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { chatStream, getGreeting } from "@/lib/ayshaaService"

/**
 * Ayshaa — widget de chat flottant du site vitrine XPARK (bas-gauche).
 *  - accueil automatique à l'arrivée sur le site (bulle + message d'accueil) ;
 *  - texte OU voix en entrée (Web Speech API), texte + voix en sortie (au choix) ;
 *  - trilingue : français / anglais / tounsi (RTL automatique pour l'arabe) ;
 *  - réponses en streaming (SSE) depuis le microservice AyshaaRAG (:8010).
 * Masqué sur /account et /auth : le portail client a son propre assistant.
 */

const LANGS = [
    { code: "fr", label: "FR", stt: "fr-FR" },
    { code: "en", label: "EN", stt: "en-US" },
    { code: "ar", label: "تونسي", stt: "ar-TN" },
]

const UI_TEXT = {
    fr: { placeholder: "Écrivez votre message…", listening: "Je vous écoute…", send: "Envoyer" },
    en: { placeholder: "Type your message…", listening: "Listening…", send: "Send" },
    ar: { placeholder: "اكتب رسالتك…", listening: "نسمع فيك…", send: "ابعث" },
}

const isArabic = (t) => /[؀-ۿ]/.test(t || "")

export default function AyshaaWidget() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [teaser, setTeaser] = useState(false)          // bulle d'accueil auto
    const [lang, setLang] = useState("fr")
    const [messages, setMessages] = useState([])          // {from, text, suggestions?}
    const [input, setInput] = useState("")
    const [busy, setBusy] = useState(false)
    const [listening, setListening] = useState(false)
    const [voiceOut, setVoiceOut] = useState(false)        // réponse vocale on/off
    const sessionRef = useRef(null)
    const recognitionRef = useRef(null)
    const bottomRef = useRef(null)

    // ── Accueil automatique à l'arrivée sur le site ──────────────────────────
    useEffect(() => {
        const navLang = (navigator.language || "fr").slice(0, 2)
        setLang(["fr", "en", "ar"].includes(navLang) ? navLang : "fr")
        sessionRef.current = sessionStorage.getItem("ayshaa_session") || null
        if (!sessionStorage.getItem("ayshaa_greeted")) {
            const t = setTimeout(() => setTeaser(true), 2500)
            return () => clearTimeout(t)
        }
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, open])

    const loadGreeting = useCallback(async (l) => {
        try {
            const g = await getGreeting(l)
            setMessages([{ from: "bot", text: g.message, suggestions: g.suggestions }])
        } catch {
            setMessages([{ from: "bot", text: "⚠️ Ayshaa est momentanément indisponible. Réessayez dans un instant." }])
        }
    }, [])

    const openChat = () => {
        setOpen(true); setTeaser(false)
        sessionStorage.setItem("ayshaa_greeted", "1")
        if (messages.length === 0) loadGreeting(lang)
    }

    const changeLang = (l) => {
        setLang(l)
        if (messages.length <= 1) loadGreeting(l)
    }

    // ── Synthèse vocale (réponse parlée) ─────────────────────────────────────
    const speak = useCallback((text, msgLang) => {
        if (!voiceOut || typeof window === "undefined" || !window.speechSynthesis) return
        window.speechSynthesis.cancel()
        const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/[*_#`>]/g, "")
        const utter = new SpeechSynthesisUtterance(clean)
        const target = msgLang === "ar" ? "ar" : msgLang === "en" ? "en" : "fr"
        utter.lang = LANGS.find(l => l.code === target)?.stt || "fr-FR"
        const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(target))
        if (voice) utter.voice = voice
        utter.rate = 1
        window.speechSynthesis.speak(utter)
    }, [voiceOut])

    // ── Envoi d'un message (texte ou dicté) ──────────────────────────────────
    const send = useCallback(async (raw) => {
        const text = (raw ?? input).trim()
        if (!text || busy) return
        setInput("")
        setBusy(true)
        setMessages(prev => [...prev, { from: "user", text }, { from: "bot", text: "", streaming: true }])

        let answerLang = lang
        await chatStream(text, sessionRef.current, {
            onMeta: (m) => {
                sessionRef.current = m.session_id
                sessionStorage.setItem("ayshaa_session", m.session_id)
                answerLang = m.lang
            },
            onToken: (t) => setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + t }
                return next
            }),
            onDone: (d) => setMessages(prev => {
                const next = [...prev]
                const last = { ...next[next.length - 1], streaming: false, suggestions: d.suggestions }
                next[next.length - 1] = last
                speak(last.text, answerLang)
                return next
            }),
            onError: () => setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = {
                    from: "bot", text: "⚠️ Connexion perdue avec Ayshaa. Vérifiez votre réseau et réessayez.",
                }
                return next
            }),
        })
        setBusy(false)
    }, [input, busy, lang, speak])

    // ── Reconnaissance vocale (entrée voix) ──────────────────────────────────
    const toggleMic = () => {
        const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)
        if (!SR) {
            setMessages(prev => [...prev, { from: "bot",
                text: "🎙️ La saisie vocale n'est pas supportée par ce navigateur (utilisez Chrome ou Edge)." }])
            return
        }
        if (listening) {
            recognitionRef.current?.stop()
            return
        }
        const rec = new SR()
        rec.lang = LANGS.find(l => l.code === lang)?.stt || "fr-FR"
        rec.interimResults = false
        rec.maxAlternatives = 1
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript
            setListening(false)
            send(transcript)
        }
        rec.onerror = () => setListening(false)
        rec.onend = () => setListening(false)
        recognitionRef.current = rec
        setListening(true)
        rec.start()
    }

    // Le portail client (/account) et l'auth ont leur propre contexte
    if (pathname?.startsWith("/account") || pathname?.startsWith("/auth")) return null

    const T = UI_TEXT[lang] || UI_TEXT.fr
    const lastSuggestions = [...messages].reverse().find(m => m.from === "bot" && m.suggestions)?.suggestions

    return (
        <>
            {/* ── Bouton flottant + bulle d'accueil (bas-gauche) ── */}
            <div className="ayshaa-root">
                {teaser && !open && (
                    <button type="button" className="ayshaa-teaser" onClick={openChat}>
                        👋 {lang === "en" ? "Hi! I'm Ayshaa, need help?"
                            : lang === "ar" ? "أهلا! أنا عيشة، نعاونك؟"
                            : "Bonjour ! Je suis Ayshaa, besoin d'aide ?"}
                    </button>
                )}
                {!open && (
                    <button type="button" className="ayshaa-fab" onClick={openChat} aria-label="Ouvrir l'assistant Ayshaa">
                        <span className="ayshaa-fab-icon">💬</span>
                        <span className="ayshaa-fab-dot" />
                    </button>
                )}

                {/* ── Fenêtre de chat ── */}
                {open && (
                    <div className="ayshaa-panel" role="dialog" aria-label="Assistant Ayshaa">
                        <div className="ayshaa-head">
                            <div className="ayshaa-avatar">A</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="ayshaa-name">Ayshaa</div>
                                <div className="ayshaa-status">● {lang === "en" ? "Online" : lang === "ar" ? "متصلة" : "En ligne"}</div>
                            </div>
                            <div className="ayshaa-langs">
                                {LANGS.map(l => (
                                    <button key={l.code} type="button" onClick={() => changeLang(l.code)}
                                        className={`ayshaa-lang ${lang === l.code ? "on" : ""}`}>{l.label}</button>
                                ))}
                            </div>
                            <button type="button" title="Réponse vocale" onClick={() => setVoiceOut(v => !v)}
                                className={`ayshaa-iconbtn ${voiceOut ? "on" : ""}`}>{voiceOut ? "🔊" : "🔇"}</button>
                            <button type="button" onClick={() => setOpen(false)} className="ayshaa-iconbtn" aria-label="Fermer">✕</button>
                        </div>

                        <div className="ayshaa-body">
                            {messages.map((m, i) => (
                                <div key={i} className={`ayshaa-msg ${m.from}`}
                                    dir={isArabic(m.text) ? "rtl" : "ltr"}>
                                    {m.text}{m.streaming && <span className="ayshaa-caret">▌</span>}
                                </div>
                            ))}
                            {lastSuggestions && !busy && (
                                <div className="ayshaa-sugg">
                                    {lastSuggestions.map(s => (
                                        <button key={s} type="button" onClick={() => send(s)}
                                            dir={isArabic(s) ? "rtl" : "ltr"}>{s}</button>
                                    ))}
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <form className="ayshaa-inputrow" onSubmit={(e) => { e.preventDefault(); send() }}>
                            <button type="button" onClick={toggleMic}
                                className={`ayshaa-mic ${listening ? "rec" : ""}`}
                                title={lang === "en" ? "Speak" : lang === "ar" ? "احكي" : "Parler"}>
                                🎙️
                            </button>
                            <input value={listening ? "" : input} onChange={(e) => setInput(e.target.value)}
                                placeholder={listening ? T.listening : T.placeholder}
                                dir={isArabic(input) || lang === "ar" ? "rtl" : "ltr"}
                                disabled={busy && !listening} />
                            <button type="submit" className="ayshaa-send" disabled={busy || !input.trim()}>➤</button>
                        </form>
                        <div className="ayshaa-foot">Ayshaa · Assistante virtuelle XPARK</div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .ayshaa-root { position: fixed; left: 22px; bottom: 22px; z-index: 99990;
                    font-family: 'Jost', 'Segoe UI', sans-serif; }
                .ayshaa-fab { position: relative; width: 62px; height: 62px; border-radius: 50%;
                    border: none; cursor: pointer; background: #C11425; color: #fff;
                    box-shadow: 0 10px 30px rgba(193,20,37,.45); font-size: 26px;
                    display: flex; align-items: center; justify-content: center;
                    animation: ayshaa-pulse 2.6s infinite; }
                .ayshaa-fab:hover { transform: scale(1.06); }
                .ayshaa-fab-dot { position: absolute; top: 4px; right: 4px; width: 13px; height: 13px;
                    border-radius: 50%; background: #22c55e; border: 2px solid #fff; }
                @keyframes ayshaa-pulse {
                    0% { box-shadow: 0 10px 30px rgba(193,20,37,.45), 0 0 0 0 rgba(193,20,37,.35); }
                    70% { box-shadow: 0 10px 30px rgba(193,20,37,.45), 0 0 0 16px rgba(193,20,37,0); }
                    100% { box-shadow: 0 10px 30px rgba(193,20,37,.45), 0 0 0 0 rgba(193,20,37,0); }
                }
                .ayshaa-teaser { position: absolute; left: 0; bottom: 74px; white-space: nowrap;
                    background: #0F1B24; color: #fff; border: none; cursor: pointer;
                    padding: 12px 18px; border-radius: 14px 14px 14px 4px; font-size: 14px;
                    box-shadow: 0 12px 32px rgba(15,27,36,.35); animation: ayshaa-in .35s ease; }
                @keyframes ayshaa-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }

                .ayshaa-panel { width: 372px; max-width: calc(100vw - 34px); height: 560px;
                    max-height: calc(100vh - 60px); background: #fff; border-radius: 18px;
                    box-shadow: 0 24px 70px rgba(15,27,36,.35); display: flex; flex-direction: column;
                    overflow: hidden; animation: ayshaa-in .3s ease; }
                .ayshaa-head { display: flex; align-items: center; gap: 10px; padding: 13px 14px;
                    background: #0F1B24; color: #fff; }
                .ayshaa-avatar { width: 40px; height: 40px; border-radius: 50%; background: #C11425;
                    display: flex; align-items: center; justify-content: center; font-weight: 800;
                    font-size: 19px; flex-shrink: 0; }
                .ayshaa-name { font-weight: 700; font-size: 15.5px; line-height: 1.1; }
                .ayshaa-status { font-size: 11.5px; color: #4ade80; }
                .ayshaa-langs { display: flex; gap: 4px; }
                .ayshaa-lang { border: 1px solid rgba(255,255,255,.25); background: transparent;
                    color: rgba(255,255,255,.75); border-radius: 8px; padding: 3px 8px; font-size: 11px;
                    cursor: pointer; }
                .ayshaa-lang.on { background: #C11425; border-color: #C11425; color: #fff; font-weight: 700; }
                .ayshaa-iconbtn { border: none; background: transparent; color: rgba(255,255,255,.8);
                    font-size: 15px; cursor: pointer; padding: 4px; }
                .ayshaa-iconbtn.on { color: #4ade80; }

                .ayshaa-body { flex: 1; overflow-y: auto; padding: 16px 14px; background: #f4f6f9;
                    display: flex; flex-direction: column; gap: 10px; }
                .ayshaa-msg { max-width: 84%; padding: 10px 14px; font-size: 14px; line-height: 1.55;
                    white-space: pre-line; word-break: break-word; }
                .ayshaa-msg.bot { align-self: flex-start; background: #fff; color: #1f2b38;
                    border: 1px solid #e6e9ee; border-radius: 14px 14px 14px 4px; }
                .ayshaa-msg.user { align-self: flex-end; background: #C11425; color: #fff;
                    border-radius: 14px 14px 4px 14px; }
                .ayshaa-msg[dir="rtl"] { text-align: right; }
                .ayshaa-caret { animation: ayshaa-blink 1s infinite; }
                @keyframes ayshaa-blink { 50% { opacity: 0; } }
                .ayshaa-sugg { display: flex; flex-wrap: wrap; gap: 7px; }
                .ayshaa-sugg button { border: 1px solid #C11425; color: #C11425; background: #fff;
                    border-radius: 18px; padding: 6px 13px; font-size: 12.5px; cursor: pointer; }
                .ayshaa-sugg button:hover { background: #C11425; color: #fff; }

                .ayshaa-inputrow { display: flex; align-items: center; gap: 8px; padding: 11px 12px;
                    border-top: 1px solid #e6e9ee; background: #fff; }
                .ayshaa-inputrow input { flex: 1; border: 1px solid #e6e9ee; border-radius: 22px;
                    padding: 10px 16px; font-size: 14px; outline: none; min-width: 0; }
                .ayshaa-inputrow input:focus { border-color: #C11425; }
                .ayshaa-mic { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #e6e9ee;
                    background: #f4f6f9; cursor: pointer; font-size: 16px; flex-shrink: 0; }
                .ayshaa-mic.rec { background: #C11425; border-color: #C11425;
                    animation: ayshaa-pulse 1.2s infinite; }
                .ayshaa-send { width: 40px; height: 40px; border-radius: 50%; border: none;
                    background: #C11425; color: #fff; font-size: 15px; cursor: pointer; flex-shrink: 0; }
                .ayshaa-send:disabled { opacity: .45; cursor: default; }
                .ayshaa-foot { text-align: center; font-size: 10.5px; color: #9aa3ad;
                    padding: 5px 0 8px; background: #fff; }

                @media (max-width: 480px) {
                    .ayshaa-root { left: 12px; bottom: 12px; }
                    .ayshaa-panel { height: 74vh; }
                    .ayshaa-teaser { white-space: normal; max-width: 260px; }
                }
            `}</style>
        </>
    )
}
