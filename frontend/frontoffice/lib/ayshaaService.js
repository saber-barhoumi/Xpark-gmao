"use client"

/**
 * ayshaaService — client du microservice Ayshaa RAG (:8010).
 *  - greeting(lang)  : message d'accueil + suggestions
 *  - chatStream(...) : POST /chat/stream en SSE, parsé manuellement depuis
 *    fetch (EventSource ne supporte pas POST) — callbacks onMeta/onToken/onDone.
 */

const AYSHAA_API = process.env.NEXT_PUBLIC_AYSHAA_API_URL || "http://localhost:8010"

export async function getGreeting(lang = "fr") {
    const res = await fetch(`${AYSHAA_API}/api/v1/greeting?lang=${lang}`)
    if (!res.ok) throw new Error("Ayshaa indisponible")
    return res.json()
}

/**
 * Stream une réponse. handlers: { onMeta(d), onToken(t), onDone(d), onError(e) }
 */
export async function chatStream(message, sessionId, handlers = {}) {
    try {
        // JWT du portail (s'il existe) : donne à Ayshaa les capacités de
        // l'utilisateur — « mes missions », « où est mon camion »… (Tool Calling)
        const token = typeof localStorage !== "undefined" ? localStorage.getItem("xpark_client_token") : null
        const res = await fetch(`${AYSHAA_API}/api/v1/chat/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ message, session_id: sessionId || null }),
        })
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            // Événements SSE séparés par une ligne vide
            let sep
            while ((sep = buffer.indexOf("\n\n")) !== -1) {
                const raw = buffer.slice(0, sep)
                buffer = buffer.slice(sep + 2)
                let event = "message", data = null
                for (const line of raw.split("\n")) {
                    if (line.startsWith("event: ")) event = line.slice(7).trim()
                    else if (line.startsWith("data: ")) data = JSON.parse(line.slice(6))
                }
                if (event === "meta") handlers.onMeta?.(data)
                else if (event === "token") handlers.onToken?.(data.t)
                else if (event === "done") handlers.onDone?.(data)
            }
        }
    } catch (err) {
        handlers.onError?.(err)
    }
}

export default { getGreeting, chatStream }
