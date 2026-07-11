"use client"

/**
 * Avatar d'Ayshaa — illustration SVG vectorielle (aucune image externe).
 * Femme professionnelle avec casque micro, charte XPARK (#C11425 / #0F1B24).
 * Utilisé dans le bouton flottant, l'en-tête du chat et les bulles bot.
 */
export default function AyshaaAvatar({ size = 44 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Ayshaa"
            style={{ display: "block", flexShrink: 0 }}>
            <defs>
                <linearGradient id="ayshaa-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1c2f3f" />
                    <stop offset="100%" stopColor="#0F1B24" />
                </linearGradient>
            </defs>

            {/* Fond */}
            <circle cx="32" cy="32" r="32" fill="url(#ayshaa-bg)" />

            {/* Buste (blazer rouge) */}
            <path d="M12 64c1-12 9-17 20-17s19 5 20 17z" fill="#C11425" />
            {/* Col chemise */}
            <path d="M26 48l6 7 6-7-3-3h-6z" fill="#fff" />

            {/* Cou */}
            <rect x="27.5" y="38" width="9" height="9" rx="4" fill="#e8b08c" />

            {/* Cheveux (arrière) */}
            <path d="M15.5 30c0-11.5 7.5-18.5 16.5-18.5S48.5 18.5 48.5 30c0 5 .8 8.5 2.5 11-3.5 1.6-7 2-9.5.5l-19 .1c-2.6 1.4-6 1-9.5-.6 1.7-2.5 2.5-6 2.5-11z" fill="#2a1c14" />

            {/* Visage */}
            <ellipse cx="32" cy="29.5" rx="11.5" ry="12.5" fill="#f2c19a" />
            {/* Mèche / frange */}
            <path d="M21 26c1.5-7 5.5-10.5 11-10.5S41.5 19 43 26c-2.5-2.5-5-3.6-11-3.6S23.5 23.5 21 26z" fill="#2a1c14" />

            {/* Yeux */}
            <ellipse cx="27.4" cy="29.5" rx="1.7" ry="2.1" fill="#2a1c14" />
            <ellipse cx="36.6" cy="29.5" rx="1.7" ry="2.1" fill="#2a1c14" />
            {/* Sourcils */}
            <path d="M25 25.6c1.4-1 3.4-1 4.8-.3" stroke="#2a1c14" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M34.2 25.3c1.4-.7 3.4-.7 4.8.3" stroke="#2a1c14" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            {/* Sourire */}
            <path d="M28 35.2c2.4 2.2 5.6 2.2 8 0" stroke="#b5654a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            {/* Boucles d'oreilles */}
            <circle cx="20.6" cy="32.5" r="1.2" fill="#C11425" />
            <circle cx="43.4" cy="32.5" r="1.2" fill="#C11425" />

            {/* Casque micro */}
            <path d="M19.5 29c-.8-8.5 4.5-15.5 12.5-15.5S45.3 20.5 44.5 29" stroke="#C11425" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <rect x="17.6" y="27.5" width="4.4" height="7.5" rx="2.2" fill="#C11425" />
            <rect x="42" y="27.5" width="4.4" height="7.5" rx="2.2" fill="#C11425" />
            <path d="M20 35c0 4.5 3.5 7.5 8 8" stroke="#C11425" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <circle cx="29.5" cy="43.3" r="2" fill="#C11425" />

            {/* Point statut en ligne */}
            <circle cx="52" cy="52" r="6.5" fill="#22c55e" stroke="#0F1B24" strokeWidth="2.5" />
        </svg>
    )
}
