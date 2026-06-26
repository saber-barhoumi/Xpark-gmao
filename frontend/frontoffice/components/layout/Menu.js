import Link from "next/link"
// import { useRouter } from "next/router"

export default function Menu() {
    // const router = useRouter()

    return (
        <>
        <ul className="main-menu__list">
            <li className="dropdown">
                <Link href="/">Home </Link>
                <ul>
                <li>
                    <Link href="/">Home One</Link>
                </li>
                <li>
                    <Link href="/index-2">Home Two</Link>
                </li>
                <li className="dropdown">
                    <a href="#">Header Styles</a>
                    <ul>
                    <li>
                        <Link href="/">Header One</Link>
                    </li>
                    <li>
                        <Link href="/index-2">Header Two</Link>
                    </li>
                    </ul>
                </li>
                </ul>
            </li>
            <li>
                <Link href="/about">About</Link>
            </li>
            <li className="dropdown">
                <Link href="#">Pages</Link>
                <ul>
                <li>
                    <Link href="/team">Team</Link>
                </li>
                <li>
                    <Link href="/team-carousel">Team Carousel</Link>
                </li>
                <li>
                    <Link href="/team-details">Team Details</Link>
                </li>
                <li>
                    <Link href="/testimonials">Testimonials</Link>
                </li>
                <li>
                    <Link href="/faq">Faq</Link>
                </li>
                <li>
                    <Link href="/404">404 Error</Link>
                </li>
                </ul>
            </li>
            <li className="dropdown">
                <Link href="#">Services</Link>
                <ul>
                <li>
                    <Link href="/services">Services</Link>
                </li>
                <li>
                    <Link href="/services-carousel">Services Carousel</Link>
                </li>
                <li>
                    <Link href="/express-freight-solutions">Express Freight Solutions</Link>
                </li>
                <li>
                    <Link href="/quick-move-logistics">Quick Move Logistics</Link>
                </li>
                <li>
                    <Link href="/speedy-dispatch">Speedy Dispatch</Link>
                </li>
                <li>
                    <Link href="/swift-supply-chain">Swift Supply Chain</Link>
                </li>
                <li>
                    <Link href="/on-point-distribution">On Point Distribution</Link>
                </li>
                </ul>
            </li>
            <li className="dropdown">
                <Link href="#">Projects</Link>
                <ul>
                <li>
                    <Link href="/projects">Projects</Link>
                </li>
                <li>
                    <Link href="/project-details">Project Details</Link>
                </li>
                </ul>
            </li>
            <li className="dropdown">
                <Link href="#">Blog</Link>
                <ul>
                <li>
                    <Link href="/blog">Blog</Link>
                </li>
                <li>
                    <Link href="/blog-details">Blog Details</Link>
                </li>
                </ul>
            </li>
            <li>
                <Link href="/contact">Contact</Link>
            </li>
        </ul>
        </>
    )
}
