'use client'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useState } from 'react'
export default function Home() {
   

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="NOS SERVICES">
                <div>
                    {/*Services Page Start*/}
                    <section className="services-page">
                        <div className="container">
                        <div className="row">
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-postbox" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/express-freight-solutions">
                                    Transport de marchandises
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/express-freight-solutions"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-customer-service" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/quick-move-logistics">
                                    Gestion de flotte
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/quick-move-logistics"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-container" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/speedy-dispatch">
                                    Livraison et distribution
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/speedy-dispatch"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-shipping" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/swift-supply-chain">
                                    Transport personnalisé
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/swift-supply-chain"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-crane" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/on-point-distribution">
                                    Transport local et régional
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/on-point-distribution"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-conveyor-1" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/express-freight-solutions">
                                    Livraison sécurisée et respect des délais
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/express-freight-solutions"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-postbox" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/quick-move-logistics">
                                    Suivi des livraisons en temps réel
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/quick-move-logistics"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-clock" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/speedy-dispatch">
                                    Organisation et optimisation des trajets
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/speedy-dispatch"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                            {/*Services One Single Start*/}
                            <div className="col-xl-4 col-lg-4">
                            <div className="services-one__single">
                                <div className="services-one__icon">
                                <span className="icon-fragile" />
                                </div>
                                <h3 className="services-one__title">
                                <Link href="/swift-supply-chain">
                                    Étude du besoin et accompagnement personnalisé
                                </Link>
                                </h3>
                                <div className="services-one__btn-box">
                                <Link
                                    href="/swift-supply-chain"
                                    className="thm-btn services-one__btn"
                                >
                                    En savoir plus
                                    <span />
                                </Link>
                                </div>
                            </div>
                            </div>
                            {/*Services One Single End*/}
                        </div>
                        </div>
                    </section>
                    {/*Services Page End*/}

                    
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
                                Besoin d'un transport ?
                                <br /> Contactez-nous !
                            </h3>
                            <div className="cta-one__contact-box">
                                <div className="icon">
                                <span className="icon-phone" />
                                </div>
                                <div className="content">
                                <p>Notre équipe est disponible</p>
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