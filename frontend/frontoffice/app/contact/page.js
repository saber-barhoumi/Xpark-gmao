
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="CONTACT US">
                <div>

                    {/*Contact One Start*/}
                    <section className="contact-one">
                        <div className="container">
                        <div className="section-title text-center">
                            <div className="section-title__tagline-box">
                            <span className="section-title__tagline">Contact us</span>
                            </div>
                            <h2 className="section-title__title">Get in Touch With Us</h2>
                        </div>
                        <div className="contact-one__inner">
                            <ul className="contact-one__contact-list list-unstyled">
                            <li>
                                <div className="icon">
                                <span className="icon-call" />
                                </div>
                                <div className="content">
                                <h3>Lets Talk us</h3>
                                <p>
                                    Phone number: <a href="tel:32566800890">+32566 - 800 - 890</a>
                                </p>
                                <p>
                                    Fax: <a href="tel:123458963007">1234 -58963 - 007</a>
                                </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-location location-icon" />
                                </div>
                                <div className="content">
                                <h3>Address</h3>
                                <p>
                                    Dhaka 102, 8000 sent behaibior
                                    <br /> road 45 house of street
                                </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-envolop email-icon" />
                                </div>
                                <div className="content">
                                <h3>Send us email</h3>
                                <p>
                                    <a href="mailto:nafizislam1223@gmail.com">
                                    nafizislam1223@gmail.com
                                    </a>
                                </p>
                                <p>
                                    <a href="mailto:demo23gmail.com">demo23gmail.com</a>
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
                                    <span className="section-title__tagline">Contact</span>
                                </div>
                                <h2 className="section-title__title">Get Touch Here</h2>
                                </div>
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
                                        placeholder="Name"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="email"
                                        name="email"
                                        placeholder="E-mail"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-12 col-lg-12">
                                    <div className="contact-two__input-box">
                                        <input
                                        type="text"
                                        name="text"
                                        placeholder="Subject"
                                        required=""
                                        />
                                    </div>
                                    </div>
                                    <div className="col-xl-12">
                                    <div className="contact-two__input-box text-message-box">
                                        <textarea
                                        name="message"
                                        placeholder="Message"
                                        defaultValue={""}
                                        />
                                    </div>
                                    </div>
                                    <div className=" col-xl-12">
                                    <div className="contact-two__btn-box">
                                        <button type="submit" className="thm-btn contact-two__btn">
                                        Submit Now
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
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4562.753041141002!2d-118.80123790098536!3d34.152323469614075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80e82469c2162619%3A0xba03efb7998eef6d!2sCostco+Wholesale!5e0!3m2!1sbn!2sbd!4v1562518641290!5m2!1sbn!2sbd"
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
                                Need any help?
                                <br /> contact us!
                            </h3>
                            <div className="cta-one__contact-box">
                                <div className="icon">
                                <span className="icon-phone" />
                                </div>
                                <div className="content">
                                <p>Need help?</p>
                                <h3>
                                    <a href="tel:3075550133">(307) 555-0133</a>
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