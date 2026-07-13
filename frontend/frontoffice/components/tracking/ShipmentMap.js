"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

/**
 * ShipmentMap — carte Leaflet impérative (animation fluide via requestAnimationFrame).
 *
 * La position du camion est recalculée à CHAQUE frame depuis le moteur
 * (fonction du temps) → mouvement continu, sans saccade. Le tracé parcouru
 * (rouge plein) et restant (pointillés) se mettent à jour en direct, et l'icône
 * camion pivote selon le cap. Aucun re-render React pendant l'animation :
 * tout passe par les API Leaflet (performant).
 *
 * Props :
 *   engine          moteur de suivi (route + snapshotAt)
 *   dark            thème sombre (tuiles adaptées)
 *   follow          recentrer en continu sur le camion
 *   recenterSignal  incrémenter pour recadrer sur tout l'itinéraire
 */

const TILES = {
    light: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: "abcd", maxZoom: 20,
    },
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: "abcd", maxZoom: 20,
    },
}

const truckSvg = () => `
  <div class="xpk-rot" style="transition:transform .25s linear;transform-origin:50% 50%;">
    <svg width="34" height="34" viewBox="0 0 34 34" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">
      <circle cx="17" cy="17" r="16" fill="#C11425" stroke="#fff" stroke-width="2.5"/>
      <g fill="#fff">
        <rect x="12" y="8" width="10" height="13" rx="1.5"/>
        <rect x="12.5" y="20.5" width="9" height="5" rx="1.2"/>
        <rect x="13.6" y="9.4" width="6.8" height="4" rx="1" fill="#C11425"/>
      </g>
      <polygon points="17,4.5 20,8.5 14,8.5" fill="#fff"/>
    </svg>
  </div>`

const pinIcon = (color, glyph) => L.divIcon({
    className: "",
    iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -34],
    html: `<div style="position:relative;width:30px;height:38px">
      <svg width="30" height="38" viewBox="0 0 30 38">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 23 15 23s15-13 15-23C30 6.7 23.3 0 15 0z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="15" cy="15" r="8" fill="#fff"/>
      </svg>
      <span style="position:absolute;top:6px;left:0;width:30px;text-align:center;font-size:14px">${glyph}</span>
    </div>`,
})

// Interpolation d'angle par le plus court chemin (gère le passage 359°→0°)
function easeAngle(from, to, k) {
    let d = ((to - from + 540) % 360) - 180
    return (from + d * k + 360) % 360
}

export default function ShipmentMap({ engine, dark, follow, recenterSignal, liveRef }) {
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const layersRef = useRef({})
    const followRef = useRef(follow)
    const lastPanRef = useRef(0)
    const lastRecenterRef = useRef(recenterSignal)

    useEffect(() => { followRef.current = follow }, [follow])

    // Recadrage sur tout l'itinéraire à la demande
    useEffect(() => {
        if (recenterSignal !== lastRecenterRef.current && mapRef.current && engine) {
            lastRecenterRef.current = recenterSignal
            mapRef.current.fitBounds(L.latLngBounds(engine.route.points), { padding: [40, 40] })
        }
    }, [recenterSignal, engine])

    useEffect(() => {
        if (!containerRef.current || !engine) return
        const { points } = engine.route

        const map = L.map(containerRef.current, {
            zoomControl: true, attributionControl: true, scrollWheelZoom: true,
        })
        mapRef.current = map

        const t = dark ? TILES.dark : TILES.light
        L.tileLayer(t.url, { attribution: t.attribution, subdomains: t.subdomains, maxZoom: t.maxZoom }).addTo(map)

        // Tracés : restant (pointillés) sous le parcouru (plein rouge)
        const remaining = L.polyline(points, { color: dark ? "#5b6570" : "#9aa3ad", weight: 5, opacity: 0.7, dashArray: "2 9" }).addTo(map)
        const traveled = L.polyline([], { color: "#C11425", weight: 6, opacity: 0.95 }).addTo(map)

        L.marker(points[0], { icon: pinIcon("#0F1B24", "📦") }).addTo(map).bindPopup("Enlèvement")
        L.marker(points[points.length - 1], { icon: pinIcon("#146c43", "🏁") }).addTo(map).bindPopup("Destination")

        const truck = L.marker(points[0], {
            icon: L.divIcon({ className: "", iconSize: [34, 34], iconAnchor: [17, 17], html: truckSvg() }),
            zIndexOffset: 1000,
        }).addTo(map)

        layersRef.current = { remaining, traveled, truck }
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
        setTimeout(() => map.invalidateSize(), 200)

        // ── Boucle d'animation : le camion suit une CIBLE (GPS réel si dispo,
        //    sinon simulation), avec lissage → mouvement fluide dans les 2 cas ──
        const init = engine.snapshotAt(Date.now())
        const cur = { pos: [...init.position], brng: init.bearing }
        const EASE = 0.12
        let raf
        const tick = () => {
            // Cible : fix GPS frais transmis par la page, sinon moteur (simulation)
            const live = liveRef?.current
            const target = live || engine.snapshotAt(Date.now())
            cur.pos = [
                cur.pos[0] + (target.position[0] - cur.pos[0]) * EASE,
                cur.pos[1] + (target.position[1] - cur.pos[1]) * EASE,
            ]
            cur.brng = easeAngle(cur.brng, target.bearing ?? cur.brng, EASE)

            truck.setLatLng(cur.pos)
            const rot = truck.getElement()?.querySelector(".xpk-rot")
            if (rot) rot.style.transform = `rotate(${cur.brng}deg)`

            const idx = target.index ?? 0
            traveled.setLatLngs([...points.slice(0, idx + 1), cur.pos])
            remaining.setLatLngs([cur.pos, ...points.slice(idx + 1)])

            if (followRef.current && Date.now() - lastPanRef.current > 1000) {
                lastPanRef.current = Date.now()
                map.panTo(cur.pos, { animate: true, duration: 0.6, noMoveStart: true })
            }
            raf = requestAnimationFrame(tick)
        }
        tick()

        const onResize = () => map.invalidateSize()
        window.addEventListener("resize", onResize)

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("resize", onResize)
            map.remove()
            mapRef.current = null
        }
        // Reconstruit la carte quand la mission (engine) ou le thème change
    }, [engine, dark])

    return (
        <div ref={containerRef}
            style={{ width: "100%", height: "clamp(360px, 55vh, 560px)", borderRadius: 14, overflow: "hidden", zIndex: 0 }} />
    )
}
