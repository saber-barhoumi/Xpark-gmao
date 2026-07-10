'use client'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useState } from 'react'
export default function Home() {
    const [isActive, setIsActive] = useState({
        status: false,
        key: 1,
    })

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            })
        } else {
            setIsActive({
                status: true,
                key,
            })
        }
    }

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="TRANSPORT LOCAL ET RÉGIONAL">
                <div>
                    {/*Services Details Start*/}
                    <section className="services-details">
                        <div className="container">
                            <div className="row">
                                <div className="col-xl-4 col-lg-5">
                                    <div className="services-details__left">
                                        <div className="services-details__client-box">
                                        <div className="services-details__client-img">
                                            <img
                                            src="assets/images/services/services-details-client-img-1.jpg"
                                            alt=""
                                            />
                                        </div>
                                        <h3 className="services-details__client-name">Équipe XPARK</h3>
                                        <p className="services-details__client-sub-title">Service commercial</p>
                                        <p className="services-details__client-text">
                                            À votre écoute pour organiser tous vos transports de marchandises.{" "}
                                        </p>
                                        <h3 className="services-details__client-number">
                                            <Link href="tel:+21670000000">+216 70 000 000</Link>
                                        </h3>
                                        <div className="services-details__client-social">
                                            <Link href="/blog-details">
                                            <span className="icon-instagram" />
                                            </Link>
                                            <Link href="/blog-details">
                                            <span className="icon-facebook-f" />
                                            </Link>
                                            <Link href="/blog-details">
                                            <span className="icon-Vector" />
                                            </Link>
                                            <Link href="/blog-details">
                                            <span className="icon-linkedin-in" />
                                            </Link>
                                        </div>
                                        </div>
                                        <div className="services-details__services-box">
                                        <h3 className="services-details__services-list-title">Nos services</h3>
                                        <ul className="services-details__service-list list-unstyled">
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/express-freight-solutions">
                                                Transport de marchandises
                                                </Link>
                                            </p>
                                            </li>
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/quick-move-logistics">Gestion de flotte</Link>
                                            </p>
                                            </li>
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/speedy-dispatch">Livraison et distribution</Link>
                                            </p>
                                            </li>
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/swift-supply-chain">Transport personnalisé</Link>
                                            </p>
                                            </li>
                                            <li className="active">
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/on-point-distribution">Transport local et régional</Link>
                                            </p>
                                            </li>
                                        </ul>
                                        </div>
                                        <div className="services-details__get-touch">
                                        <div
                                            className="services-details__get-touch-bg"
                                            style={{
                                            backgroundImage:
                                                "url(assets/images/services/services-details-get-touch-bg-img.jpg)"
                                            }}
                                        ></div>
                                        <h3 className="services-details__get-touch-title">CONTACTEZ-NOUS</h3>
                                        <p className="services-details__get-touch-sub-title">Une réponse rapide</p>
                                        <div className="services-details__get-touch-icon">
                                            <span className="icon-call" />
                                        </div>
                                        <h3 className="services-details__get-touch-number">
                                            <Link href="tel:+21670000000">+216 70 000 000</Link>
                                        </h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-8 col-lg-7">
                                    <div className="services-details__right">
                                        <h3 className="services-details__title-1">
                                        Transport local et régional
                                        </h3>
                                        <p className="services-details__text-1">
                                        XPARK assure vos transports de marchandises en ville comme entre les régions. Notre connaissance du terrain et notre flotte adaptée nous permettent de vous offrir des livraisons rapides et fiables sur l'ensemble du territoire.
                                        </p>
                                        <div className="services-details__img-1">
                                        <img
                                            src="assets/images/services/services-details-img-1.jpg"
                                            alt=""
                                        />
                                        </div>
                                        <div className="services-details__service-box">
                                        <div className="row">
                                            <div className="col-xl-6 col-lg-6">
                                            <div className="services-details__service-single">
                                                <div className="services-details__service-icon">
                                                <span className="icon-airplane" />
                                                </div>
                                                <h3 className="services-details__service-title">
                                                <Link href="#">Couverture locale</Link>
                                                </h3>
                                                <p className="services-details__service-text">
                                                Des livraisons rapides en zone urbaine pour vos besoins quotidiens.
                                                </p>
                                            </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6">
                                            <div className="services-details__service-single">
                                                <div className="services-details__service-icon">
                                                <span className="icon-lift-truck" />
                                                </div>
                                                <h3 className="services-details__service-title">
                                                <Link href="#">Couverture régionale</Link>
                                                </h3>
                                                <p className="services-details__service-text">
                                                Des liaisons régulières entre les régions pour accompagner votre développement.
                                                </p>
                                            </div>
                                            </div>
                                        </div>
                                        </div>
                                        <p className="services-details__text-2">
                                        Que ce soit pour une livraison urgente en ville ou un acheminement entre régions, nos équipes organisent le transport le plus adapté. La proximité avec nos clients et la réactivité de notre flotte font de XPARK un partenaire de confiance pour vos flux locaux et régionaux.
                                        </p>
                                        <div className="services-details__faq">
                                        <div
                                            className="accrodion-grp faq-one-accrodion"
                                            data-grp-name="faq-one-accrodion-1"
                                        >
                                        <div className={isActive.key == 1 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(1)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>Quelles zones couvrez-vous ?</h4>
                                            </div>
                                            <div className={isActive.key == 1 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                    <p>
                                                        Nous intervenons en zone urbaine et entre les régions, sur l'ensemble du territoire tunisien, selon vos besoins.
                                                    </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        <div className={isActive.key == 2 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(2)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>Proposez-vous des livraisons urgentes ?</h4>
                                            </div>
                                            <div className={isActive.key == 2 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                    <p>
                                                        Oui, selon la disponibilité de la flotte, nous pouvons organiser des transports urgents avec un enlèvement rapide de vos marchandises.
                                                    </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        <div className={isActive.key == 3 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(3)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>Comment sont calculés les tarifs ?</h4>
                                            </div>
                                            <div className={isActive.key == 3 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                <p>
                                                    Les tarifs dépendent de la distance, du volume et du type de marchandises. Demandez un devis gratuit : notre équipe vous répond rapidement.
                                                </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        </div>
                                        <div className="blog-details__pagenation-box">
                                            <ul className="list-unstyled blog-details__pagenation">
                                            <li>
                                                <div className="icon">
                                                <Link href="#">
                                                    <span className="icon-arrow-left" />
                                                </Link>
                                                </div>
                                                <p>Transport personnalisé</p>
                                            </li>
                                            <li>
                                                <p>Transport de marchandises</p>
                                                <div className="icon">
                                                <Link href="#">
                                                    <span className="icon-arrow-right" />
                                                </Link>
                                                </div>
                                            </li>
                                            </ul>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/*Services Details End*/}
                    {/*CTA One Start*/}
                    <section className="cta-one cta-two">
                        <div className="container">
                        <div className="cta-one__inner">
                            <div
                            className="cta-one__bg-img"
                            style={{
                                backgroundImage: "url(assets/images/resources/cta-one-bg-img.jpg)"
                            }}
                            />
                            <div className="cta-one__content-box">
                            <div className="cta-one__icon">
                                <span className="icon-call" />
                                <div className="cta-one__shape-1">
                                <img src="assets/images/shapes/cta-one-shape-1.png" alt="" />
                                </div>
                            </div>
                            <h3 className="cta-one__title">
                                Besoin d'un transport ?<br /> Contactez-nous !
                            </h3>
                            <div className="cta-one__contact-box">
                                <div className="icon">
                                <span className="icon-phone" />
                                </div>
                                <div className="content">
                                <p>Nous contacter</p>
                                <h3>
                                    <Link href="tel:+21670000000">+216 70 000 000</Link>
                                </h3>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*CTA One End*/}
                </div>

            </Layout>
        </>
    )
}