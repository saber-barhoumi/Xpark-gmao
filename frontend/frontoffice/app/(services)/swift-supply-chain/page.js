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
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="TRANSPORT PERSONNALISÉ">
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
                                            <li className="active">
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/swift-supply-chain">Transport personnalisé</Link>
                                            </p>
                                            </li>
                                            <li>
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
                                        Transport personnalisé
                                        </h3>
                                        <p className="services-details__text-1">
                                        Chaque entreprise a des besoins de transport spécifiques. XPARK étudie votre demande en détail et construit avec vous une solution de transport sur mesure : type de véhicule, fréquence, itinéraires et accompagnement dédié.
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
                                                <Link href="#">Étude du besoin</Link>
                                                </h3>
                                                <p className="services-details__service-text">
                                                Une analyse précise de votre demande pour proposer la solution la plus adaptée.
                                                </p>
                                            </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6">
                                            <div className="services-details__service-single">
                                                <div className="services-details__service-icon">
                                                <span className="icon-lift-truck" />
                                                </div>
                                                <h3 className="services-details__service-title">
                                                <Link href="#">Accompagnement personnalisé</Link>
                                                </h3>
                                                <p className="services-details__service-text">
                                                Un interlocuteur dédié vous accompagne tout au long de la prestation.
                                                </p>
                                            </div>
                                            </div>
                                        </div>
                                        </div>
                                        <p className="services-details__text-2">
                                        De l'étude initiale à la réalisation du transport, nous planifions chaque étape avec vous. Cette approche personnalisée garantit une prestation parfaitement alignée sur vos contraintes de volume, de délais et de budget.
                                        </p>
                                        <div className="services-details__faq">
                                        <div
                                            className="accrodion-grp faq-one-accrodion"
                                            data-grp-name="faq-one-accrodion-1"
                                        >
                                        <div className={isActive.key == 1 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(1)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>Comment se déroule l'étude de mon besoin ?</h4>
                                            </div>
                                            <div className={isActive.key == 1 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                    <p>
                                                        Notre équipe analyse votre demande : nature des marchandises, volumes, destinations et fréquence. Nous vous proposons ensuite une solution adaptée avec un devis détaillé.
                                                    </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        <div className={isActive.key == 2 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(2)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>Puis-je mettre en place un transport récurrent ?</h4>
                                            </div>
                                            <div className={isActive.key == 2 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                    <p>
                                                        Oui, nous mettons en place des prestations régulières adaptées à votre activité, avec une planification définie ensemble à l'avance.
                                                    </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        <div className={isActive.key == 3 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(3)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>Ai-je un interlocuteur dédié ?</h4>
                                            </div>
                                            <div className={isActive.key == 3 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                <p>
                                                    Oui, un interlocuteur dédié suit votre dossier et reste disponible pour ajuster la prestation à l'évolution de vos besoins.
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
                                                <p>Livraison et distribution</p>
                                            </li>
                                            <li>
                                                <p>Transport local et régional</p>
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