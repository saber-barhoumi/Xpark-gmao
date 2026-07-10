import Link from "next/link";
import CounterUp from "@/components/elements/CounterUp"

export default function About() {
    return (
        <>
            {/*About One Start*/}
            <section className="about-one">
                <div className="container">
                <div className="row">
                    <div className="col-xl-6">
                    <div className="about-one__left">
                        <div className="section-title text-left">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">À propos de XPARK</span>
                        </div>
                        <h2 className="section-title__title">
                            Le transport de marchandises <br /> au service des professionnels
                        </h2>
                        </div>
                        <p className="about-one__text">
                        XPARK est une entreprise spécialisée dans le transport de marchandises
                        grâce à une flotte de véhicules adaptée aux besoins des professionnels.
                        </p>
                        <div className="about-one__list-box">
                        <div className="about-one__shape-1">
                            <img src="assets/images/shapes/about-one-shape-1.png" alt="" />
                        </div>
                        <ul className="about-one__list list-unstyled">
                            <li>
                            <div className="about-one__icon">
                                <span className="icon-conveyor-1" />
                            </div>
                            <h3>
                                Transport local <br /> et régional
                            </h3>
                            </li>
                            <li>
                            <div className="about-one__icon">
                                <span className="icon-clock" />
                            </div>
                            <h3>
                                Respect des délais
                                <br /> de livraison{" "}
                            </h3>
                            </li>
                            <li>
                            <div className="about-one__icon">
                                <span className="icon-fragile" />
                            </div>
                            <h3>
                                Marchandises transportées
                                <br /> en toute sécurité
                            </h3>
                            </li>
                        </ul>
                        </div>
                        <div className="about-one__btn-box">
                        <Link href="/about" className="thm-btn about-one__btn">
                            En savoir plus
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                    <div className="col-xl-6">
                    <div
                        className="about-one__right wow fadeInRight"
                        data-wow-delay="300ms"
                    >
                        <div className="about-one__img-box">
                        <div className="about-one__img-1">
                            <img src="assets/images/resources/about-one-img-1.jpg" alt="" />
                        </div>
                        <div className="about-one__img-2">
                            <img src="assets/images/resources/about-one-img-2.jpg" alt="" />
                        </div>
                        <div className="about-one__trusted-box">
                            <div className="about-one__trust-icon">
                            <span className="icon-ionic-ios-people" />
                            </div>
                            <div className="about-one__trust-content">
                            <div className="about-one__trust-count count-box">
                                <h3 className="count-text">
                                    <CounterUp end={6} />
                                </h3>
                                <span>k</span>
                                <span className="about-one__trust-plus">+</span>
                            </div>
                            <p className="about-one__trust-text">Clients satisfaits</p>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </section>
            {/*About One End--
            */}
        </>

    )
}
