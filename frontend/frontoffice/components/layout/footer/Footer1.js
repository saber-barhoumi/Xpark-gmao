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
                        It is a long established fact that a reader Empowering
                        Communities
                        </p>
                        <ul className="footer-widget__about-contact list-unstyled">
                        <li>
                            <div className="icon">
                            <span className="icon-envolop email-icon" />
                            </div>
                            <p>
                            <Link href="mailto:debra.holt@example.com">
                                debra.holt@example.com,
                            </Link>
                            </p>
                        </li>
                        <li>
                            <div className="icon">
                            <span className="icon-location location-icon" />
                            </div>
                            <p>3891 Ranchview Dr. Richardson</p>
                        </li>
                        <li>
                            <div className="icon">
                            <span className="icon-call phone-call" />
                            </div>
                            <p>
                            <Link href="tel:0192584341342">0192584341342</Link>
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
                        <h3 className="footer-widget__title">About Company</h3>
                        </div>
                        <ul className="footer-widget__company-list list-unstyled">
                        <li>
                            <Link href="/about">About Us</Link>
                        </li>
                        <li>
                            <Link href="/faq">FAQ</Link>
                        </li>
                        <li>
                            <Link href="/testimonials">Testimonial</Link>
                        </li>
                        <li>
                            <Link href="/services">Service</Link>
                        </li>
                        <li>
                            <Link href="/blog">Blog And News</Link>
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
                            Express Freight Solutions
                            </Link>
                        </li>
                        <li>
                            <Link href="/speedy-dispatch">
                            <span className="icon-angle-left" />
                            Rapid Delivery Services
                            </Link>
                        </li>
                        <li>
                            <Link href="/speedy-dispatch">
                            <span className="icon-angle-left" />
                            Speedy Haulage
                            </Link>
                        </li>
                        <li>
                            <Link href="/swift-supply-chain">
                            <span className="icon-angle-left" />
                            Reliable Transporters
                            </Link>
                        </li>
                        <li>
                            <Link href="/swift-supply-chain">
                            <span className="icon-angle-left" />
                            Swift Ship Solutions
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
                        <h3 className="footer-widget__title">Newslatter</h3>
                        </div>
                        <p className="footer-widget__newsletter-text">
                        Financial planners help people to gain knowledge aboutw
                        </p>
                        <form
                        className="footer-widget__newsletter-form mc-form"
                        data-url="MC_FORM_URL"
                        noValidate="novalidate"
                        >
                        <div className="footer-widget__newsletter-form-input-box">
                            <input
                            type="email"
                            placeholder="Your e-mail"
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
                    © Yoursitename 2024 | All Rights Reserved
                </p>
                <ul className="list-unstyled site-footer__bottom-menu">
                    <li>
                    <Link href="/about">Trams &amp; Condition</Link>
                    </li>
                    <li>
                    <Link href="/about">Privacy Policy</Link>
                    </li>
                    <li>
                    <Link href="/contact">Contact Us</Link>
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
