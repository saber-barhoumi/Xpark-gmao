'use client'
import Link from "next/link"
import { useState } from 'react'
export default function Faq() {
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
            {/*FAQ One Start*/}
            <section className="faq-one">
                <div className="faq-one__bg-color" />
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6 col-lg-6">
                            <div className="faq-one__left">
                                <div className="section-title text-left">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">FAQ</span>
                                    </div>
                                    <h2 className="section-title__title">
                                        Des questions sur
                                        <br /> nos services ?
                                    </h2>
                                </div>
                                <div
                                    className="accrodion-grp faq-one-accrodion"
                                    data-grp-name="faq-one-accrodion-1"
                                    >
                                    <div className={isActive.key == 1 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(1)}>
                                        <div className="accrodion-title">
                                        <h4>Comment suivre ma demande de transport ?</h4>
                                        </div>
                                        <div className={isActive.key == 1 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                            <p>
                                            Depuis votre espace client XPARK, suivez chaque demande de
                                            transport et restez informé sur l'avancement de vos
                                            livraisons en temps réel.{" "}
                                            </p>
                                        </div>
                                        </div>
                                        <div className="faq-page__count"></div>
                                    </div>
                                    <div className={isActive.key == 2 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(2)}>
                                        <div className="accrodion-title">
                                        <h4>Quels sont les délais de livraison ?</h4>
                                        </div>
                                        <div className={isActive.key == 2 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                                <p>
                                                Les délais dépendent de la destination et du type de marchandise.
                                                Chaque demande est planifiée pour garantir une livraison
                                                dans les meilleurs délais.{" "}
                                                </p>
                                        </div>
                                        </div>
                                        <div className="faq-page__count"></div>
                                    </div>
                                    <div className={isActive.key == 3 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(3)}>
                                        <div className="accrodion-title">
                                        <h4>Quels types de marchandises transportez-vous ?</h4>
                                        </div>
                                        <div className={isActive.key == 3 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                                <p>
                                                Notre flotte est adaptée à différents types de marchandises :
                                                produits d'entreprise, colis volumineux, fret local et
                                                régional. Contactez-nous pour étudier votre besoin.{" "}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="faq-page__count"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6">
                        <div
                            className="faq-one__right wow fadeInRight"
                            data-wow-delay="300ms"
                        >
                            <h3 className="faq-one__from-title">
                            Demandez votre devis gratuit
                            </h3>
                            <form
                            className="contact-form-validated faq-one__form"
                            action="assets/inc/sendemail.php"
                            method="post"
                            noValidate="novalidate"
                            >
                            <div className="row">
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <input
                                    type="text"
                                    name="name"
                                    placeholder="Votre nom"
                                    required=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <input
                                    type="email"
                                    name="email"
                                    placeholder="Votre email"
                                    required=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <input
                                    type="text"
                                    name="text"
                                    placeholder="Téléphone"
                                    required=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <div className="select-box">
                                        <select defaultValue="Choisir un service" className="selectmenu wide">
                                            <option>Choisir un service</option>
                                            <option>Transport de marchandises</option>
                                            <option>Gestion de flotte</option>
                                            <option>Livraison et distribution</option>
                                            <option>Transport personnalisé</option>
                                            <option>Transport local et régional</option>
                                            <option>Autre demande</option>
                                        </select>
                                    </div>
                                </div>
                                </div>
                                <div className="col-xl-12">
                                <div className="faq-one__input-box text-message-box">
                                    <textarea
                                    name="message"
                                    placeholder="Votre demande de transport..."
                                    defaultValue={""}
                                    />
                                </div>
                                </div>
                                <div className=" col-xl-12">
                                <div className="faq-one__btn-box">
                                    <button type="submit" className="thm-btn faq-one__btn">
                                    Envoyer la demande
                                    <span />
                                    </button>
                                </div>
                                </div>
                            </div>
                            </form>
                            <div className="result" />
                        </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*FAQ One End*/}
        </>


    )
}
