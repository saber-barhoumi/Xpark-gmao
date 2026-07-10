import "@/node_modules/react-modal-video/css/modal-video.css"
import "../public/assets/css/onpoint.css"
import 'swiper/css'
// import "swiper/css/navigation"
import "swiper/css/pagination"
// import 'owl.carousel'
import 'swiper/css/free-mode';
import { jost, rajdhani } from '@/lib/font'
export const metadata = {
    title: 'XPARK — Transport de marchandises',
    description: 'XPARK, entreprise spécialisée dans le transport de marchandises avec une flotte de véhicules adaptée aux besoins des professionnels.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr" className={`${jost.variable} ${rajdhani.variable}`}>
            <body>{children}</body>
        </html>
    )
}
