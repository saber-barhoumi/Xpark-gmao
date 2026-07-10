import Link from "next/link"
// import { useRouter } from "next/router"

export default function Menu() {
    // const router = useRouter()

    return (
        <>
        <ul className="main-menu__list">
            <li>
                <Link href="/">Accueil</Link>
            </li>
            <li>
                <Link href="/about">À propos</Link>
            </li>
            <li className="dropdown">
                <Link href="/services">Services</Link>
                <ul>
                <li>
                    <Link href="/services">Tous nos services</Link>
                </li>
                <li>
                    <Link href="/express-freight-solutions">Transport de marchandises</Link>
                </li>
                <li>
                    <Link href="/quick-move-logistics">Gestion de flotte</Link>
                </li>
                <li>
                    <Link href="/speedy-dispatch">Livraison et distribution</Link>
                </li>
                <li>
                    <Link href="/swift-supply-chain">Transport personnalisé</Link>
                </li>
                <li>
                    <Link href="/on-point-distribution">Transport local et régional</Link>
                </li>
                </ul>
            </li>
            <li>
                <Link href="/contact">Contact</Link>
            </li>
            <li className="dropdown">
                <Link href="/account">Espace Client</Link>
                <ul>
                <li>
                    <Link href="/auth/login">Connexion</Link>
                </li>
                <li>
                    <Link href="/auth/register">Inscription</Link>
                </li>
                <li>
                    <Link href="/account">Mon Compte</Link>
                </li>
                <li>
                    <Link href="/account/reserver">Réserver un véhicule</Link>
                </li>
                <li>
                    <Link href="/account/missions">Mes Missions</Link>
                </li>
                <li>
                    <Link href="/account/security">Sécurité (MFA)</Link>
                </li>
                <li>
                    <Link href="/auth/logout">Déconnexion</Link>
                </li>
                </ul>
            </li>
            <li className="dropdown">
                <a href="#">FR</a>
                <ul>
                <li>
                    <a href="#">Français</a>
                </li>
                <li>
                    <a href="#" title="Bientôt disponible">English (bientôt)</a>
                </li>
                </ul>
            </li>
        </ul>
        </>
    )
}
