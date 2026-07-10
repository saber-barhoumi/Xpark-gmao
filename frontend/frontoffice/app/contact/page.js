
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="CONTACT">
                <div>

                    {/*Contact One Start*/}
                    <section className="contact-one">
                        <div className="container">
                        <div className="section-title text-center">
                            <div className="section-title__tagline-box">
                            <span className="section-title__tagline">Contactez-nous</span>
                            </div>
                            <h2 className="section-title__title">Contactez XPARK</h2>
                        </div>
                        <div className="contact-one__inner">
                            <ul className="contact-one__contact-list list-unstyled">
                            <li>
                                <div className="icon">
                                <span className="icon-call" />
                                </div>
                                <div className="content">
                                <h3>Appelez-nous</h3>
                                <p>
                                    Téléphone : <a href="tel:+21670000000">+216 70 000 000</a>
                                </p>
                                <p>
                                    Mobile : <a href="tel:+21620000000">+216 20 000 000</a>
                                </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-location location-icon" />
                                </div>
                                <div className="content">
                                <h3>Adresse</h3>
                                <p>
                                    Zone industrielle
                                    <br /> Tunis, Tunisie
                                </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-envolop email-icon" />
                                </div>
                                <div className="content">
                                <h3>Écrivez-nous</h3>
                                <p>
                                    <a href="mailto:contact@xpark.tn">
                                    contact@xpark.tn
                                    </a>
                                </p>
                                <p>
                                    <a href="mailto:devis@xpark.tn">devis@xpark.tn</a>
                                </p>
                                </div>
                            </li>
                            </ul>
                        </div>
                        </div>
                    </section>
                    {/*Contact One End*/}


                    {/*Contact Two Start*/}
                    <section className="contact-two">
                        <div className="container">
                        <div className="row">
                            <div className="col-xl-7">
                            <div className="contact-two__left">
                                <div className="section-title text-left">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Demande de transport</span>
                                </div>
                                <h2 className="section-title__title">Besoin d'un service de transport ?</h2>
                                </div>
                                <p style={{ marginBottom: 30 }}>
                                    Notre équipe est disponible pour étudier votre demande et vous
                                    proposer une solution adaptée dans les meilleurs délais.
                                </p>
                                <form
                                className="contact-form-validated contact-two__form"
                                action="assets/inc/sendemail.php"
                                method="post"
                                noValidate="novalidate"
                                >
                                <div className="row">
                                    <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="text"
                                        name="name"
                                        placeholder="Nom"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="text"
                                        name="company"
                                        placeholder="Société"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Téléphone"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-12 col-lg-12">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="text"
                                        name="subject"
                                        placeholder="Votre demande de transport (marchandises, trajet, date...)"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-12">
                                    <div className="contact-two__input-box text-message-box">
                                        <textarea
                                        name="message"
                                        placeholder="Votre message"
                                        defaultValue={""}
                                        />
                                    </div>
                                    </div>
                                    <div className=" col-xl-12">
                                    <div className="contact-two__btn-box">
                                        <button type="submit" className="thm-btn contact-two__btn">
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
                            <div className="col-xl-5">
                            <div className="contact-two__right">
                                <div className="contact-two__img">
                                <img src="assets/images/resources/contact-two-img-1.jpg" alt="" />
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*Contact Two End*/}
                   
                    {/*Google Map Start*/}
                    <section className="google-map-one google-map-two">
                        <iframe
                        src="https://maps.google.com/maps?q=Tunis%2C%20Tunisie&t=&z=11&ie=UTF8&iwloc=&output=embed"
                        className="google-map__one"
                        allowFullScreen=""
                        />
                    </section>
                    {/*Google Map End*/}

                    {/*CTA One Start*/}
                    <section className="cta-one">
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
                                <p>Nous contacter</p>
                                <h3>
                                    <a href="tel:+21670000000">+216 70 000 000</a>
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