import Link from "next/link"

export default function Footer1() {
    return (
        <>
        {/*Site Footer Start*/}
        <footer className="site-footer">
            <div className="site-footer__shape-1 float-bob-y">
            <img src="assets/images/shapes/footer-shape-1.png" alt="" />
            </div>
            <div className="site-footer__top">
            <div className="container">
                <div className="site-footer__top-inner">
                <div className="row">
                    <div
                    className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                    data-wow-delay="100ms"
                    >
                    <div className="footer-widget__column footer-widget__about">
                        <div className="footer-widget__logo">
                        <Link href="/">
                            <img
                            src="assets/images/resources/footer-logo-1.png"
                            alt=""
                            />
                        </Link>
                        </div>
                        <p className="footer-widget__about-text">
                        XPARK, spécialiste du transport de marchandises avec une
                        flotte adaptée aux besoins des professionnels.
                        </p>
                        <ul className="footer-widget__about-contact list-unstyled">
                        <li>
                            <div className="icon">
                            <span className="icon-envolop email-icon" />
                            </div>
                            <p>
                            <Link href="mailto:contact@xpark.tn">
                                contact@xpark.tn
                            </Link>
                            </p>
                        </li>
                        <li>
                            <div className="icon">
                            <span className="icon-location location-icon" />
                            </div>
                            <p>Zone industrielle, Tunis, Tunisie</p>
                        </li>
                        <li>
                            <div className="icon">
                            <span className="icon-call phone-call" />
                            </div>
                            <p>
                            <Link href="tel:+21670000000">+216 70 000 000</Link>
                            </p>
                        </li>
                        </ul>
                    </div>
                    </div>
                    <div
                    className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                    data-wow-delay="200ms"
                    >
                    <div className="footer-widget__column footer-widget__company">
                        <div className="footer-widget__title-box">
                        <h3 className="footer-widget__title">L'entreprise</h3>
                        </div>
                        <ul className="footer-widget__company-list list-unstyled">
                        <li>
                            <Link href="/about">À propos</Link>
                        </li>
                        <li>
                            <Link href="/services">Nos services</Link>
                        </li>
                        <li>
                            <Link href="/contact">Contact</Link>
                        </li>
                        <li>
                            <Link href="/account">Espace client</Link>
                        </li>
                        <li>
                            <Link href="/account/reserver">Demander un devis</Link>
                        </li>
                        </ul>
                    </div>
                    </div>
                    <div
                    className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                    data-wow-delay="300ms"
                    >
                    <div className="footer-widget__column footer-widget__services">
                        <div className="footer-widget__title-box">
                        <h3 className="footer-widget__title">Services</h3>
                        </div>
                        <ul className="footer-widget__services-list list-unstyled">
                        <li>
                            <Link href="/express-freight-solutions">
                            <span className="icon-angle-left" />
                            Transport de marchandises
                            </Link>
                        </li>
                        <li>
                            <Link href="/quick-move-logistics">
                            <span className="icon-angle-left" />
                            Gestion de flotte
                            </Link>
                        </li>
                        <li>
                            <Link href="/speedy-dispatch">
                            <span className="icon-angle-left" />
                            Livraison et distribution
                            </Link>
                        </li>
                        <li>
                            <Link href="/swift-supply-chain">
                            <span className="icon-angle-left" />
                            Transport personnalisé
                            </Link>
                        </li>
                        <li>
                            <Link href="/on-point-distribution">
                            <span className="icon-angle-left" />
                            Transport local et régional
                            </Link>
                        </li>
                        </ul>
                    </div>
                    </div>
                    <div
                    className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                    data-wow-delay="400ms"
                    >
                    <div className="footer-widget__column footer-widget__newsletter">
                        <div className="footer-widget__title-box">
                        <h3 className="footer-widget__title">Newsletter</h3>
                        </div>
                        <p className="footer-widget__newsletter-text">
                        Recevez nos actualités et nos offres de transport.
                        </p>
                        <form
                        className="footer-widget__newsletter-form mc-form"
                        data-url="MC_FORM_URL"
                        noValidate="novalidate"
                        >
                        <div className="footer-widget__newsletter-form-input-box">
                            <input
                            type="email"
                            placeholder="Votre email"
                            name="EMAIL"
                            />
                            <button
                            type="submit"
                            className="footer-widget__newsletter-btn"
                            >
                            <span className="icon-paper-plane" />
                            </button>
                        </div>
                        </form>
                        <div className="mc-form__response" />
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
            <div className="site-footer__bottom">
            <div className="container">
                <div className="site-footer__bottom-inner">
                <p className="site-footer__bottom-text">
                    © XPARK 2026 | Tous droits réservés
                </p>
                <ul className="list-unstyled site-footer__bottom-menu">
                    <li>
                    <Link href="/about">Conditions générales</Link>
                    </li>
                    <li>
                    <Link href="/about">Politique de confidentialité</Link>
                    </li>
                    <li>
                    <Link href="/contact">Contact</Link>
                    </li>
                </ul>
                </div>
            </div>
            </div>
        </footer>
        {/*Site Footer End*/}
        </>
    )
}
