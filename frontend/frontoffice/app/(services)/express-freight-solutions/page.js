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
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="TRANSPORT DE MARCHANDISES">
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
                                            <p className="services-details__client-sub-title">
                                                Service commercial
                                            </p>
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
                                            <h3 className="services-details__services-list-title">
                                                Nos services
                                            </h3>
                                            <ul className="services-details__service-list list-unstyled">
                                                <li className="active">
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
                                                <li>
                                                    <div className="icon">
                                                        <span className="icon-dabble-arrow" />
                                                    </div>
                                                    <p>
                                                        <Link href="/on-point-distribution">
                                                        Transport local et régional
                                                        </Link>
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
                                            <p className="services-details__get-touch-sub-title">
                                                Une réponse rapide
                                            </p>
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
                                    Transport de marchandises
                                    </h3>
                                    <p className="services-details__text-1">
                                    XPARK prend en charge le transport de vos marchandises avec une flotte de véhicules adaptée à chaque type de chargement. Nous organisons des transports locaux et régionaux, avec une livraison sécurisée et le respect des délais convenus.
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
                                            <Link href="#">Transport local et régional</Link>
                                            </h3>
                                            <p className="services-details__service-text">
                                            Nous couvrons vos besoins de transport en ville comme entre les régions, partout en Tunisie.
                                            </p>
                                        </div>
                                        </div>
                                        <div className="col-xl-6 col-lg-6">
                                        <div className="services-details__service-single">
                                            <div className="services-details__service-icon">
                                            <span className="icon-lift-truck" />
                                            </div>
                                            <h3 className="services-details__service-title">
                                            <Link href="#">Livraison sécurisée</Link>
                                            </h3>
                                            <p className="services-details__service-text">
                                            Vos marchandises sont manipulees et transportees avec soin, de l'enlèvement à la livraison.
                                            </p>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                    <p className="services-details__text-2">
                                    Chaque demande de transport fait l'objet d'une étude précise : nature des marchandises, volume, itinéraire et délais. Nos chauffeurs expérimentés et nos véhicules régulièrement entretenus garantissent des livraisons fiables et dans les meilleurs délais, quelle que soit la destination.
                                    </p>
                                    <div className="services-details__faq">
                                    <div
                                        className="accrodion-grp faq-one-accrodion"
                                        data-grp-name="faq-one-accrodion-1"
                                    >
                                    <div className={isActive.key == 1 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(1)}>
                                        <div className="accrodion-count" />
                                        <div className="accrodion-title">
                                            <h4>Quels types de marchandises transportez-vous ?</h4>
                                        </div>
                                        <div className={isActive.key == 1 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                                <p>
                                                    Nous transportons tous types de marchandises générales : palettes, colis, équipements et matériel professionnel. Chaque demande est étudiée pour affecter le véhicule le plus adapté.
                                                </p>
                                            </div>
                                            {/* /.inner */}
                                        </div>
                                    </div>
                                    <div className={isActive.key == 2 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(2)}>
                                        <div className="accrodion-count" />
                                        <div className="accrodion-title">
                                            <h4>Quels sont les délais de livraison ?</h4>
                                        </div>
                                        <div className={isActive.key == 2 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                                <p>
                                                    Les délais dépendent de la destination et du type de transport. Ils sont définis avec vous des la validation du devis et nous nous engageons à les respecter.
                                                </p>
                                            </div>
                                            {/* /.inner */}
                                        </div>
                                    </div>
                                    <div className={isActive.key == 3 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(3)}>
                                        <div className="accrodion-count" />
                                        <div className="accrodion-title">
                                            <h4>Comment demander un devis ?</h4>
                                        </div>
                                        <div className={isActive.key == 3 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                            <p>
                                                Il vous suffit de remplir le formulaire de contact ou de nous appeler. Notre équipe étudie votre demande et vous répond dans les plus brefs délais.
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
                                            <p>Transport local et régional</p>
                                        </li>
                                        <li>
                                            <p>Gestion de flotte</p>
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