import React from 'react';
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Team Details">

            <div>
                {/*Team Details Info Start*/}
                <section className="team-details-info">
                    <div className="container">
                    <div className="team-details-info__inner">
                        <div className="row">
                        <div className="col-xl-6 col-lg-6 col-md-6">
                            <div className="team-details-info__left">
                            <div className="team-details-info__img">
                                <img
                                src="assets/images/team/team-details-info-img-1.jpg"
                                alt=""
                                />
                            </div>
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6 col-md-6">
                            <div className="team-details-info__content">
                            <div className="team-details-info__content-title-box">
                                <h3 className="team-details-info__content-title">
                                Trevis Head
                                </h3>
                                <p className="team-details-info__content-sub-title">
                                Backend Developer
                                </p>
                            </div>
                            <div className="team-details-info__details-box">
                                <ul className="list-unstyled team-details-info__details-list">
                                <li>
                                    <span>Department:</span> Web Design
                                </li>
                                <li>
                                    <span>Experience:</span> 15 Years
                                </li>
                                <li>
                                    <span>Email:</span>{" "}
                                    <a href="mailto:bondorhelp@gmail.com">
                                    bondorhelp@gmail.com
                                    </a>
                                </li>
                                <li>
                                    <span>Phone:</span>{" "}
                                    <a href="tel:1900938495743">+1-900-938-4957-43</a>
                                </li>
                                </ul>
                            </div>
                            <div className="team-details-info__social">
                                <a href="#">
                                <i className="fab fa-facebook-f" />
                                </a>
                                <a href="#">
                                <i className="fab fa-twitter" />
                                </a>
                                <a href="#">
                                <i className="fab fa-instagram" />
                                </a>
                                <a href="#">
                                <i className="fab fa-linkedin-in" />
                                </a>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    <div className="team-details__bottom">
                        <h3 className="team-details__title-1">Alen Walker’s Biography</h3>
                        <p className="team-details__text-1">
                        A vast majority of the app marketers mainly concentrate on the
                        post-launch app marketing techniques and measures while completely
                        missing on the pre-launch campaign. This prevents the app to create
                        buzz and hype just around the time when the app is launched. As and
                        when you launch the app, already a considerable number of people
                        should expectantly look forward to your app and this requires
                        long-drawn marketing
                        </p>
                        <p className="team-details__text-2">
                        To create pre-launch buzz and hype about the app a mobile app
                        development company has an array of marketing options like social
                        media campaign, search engine ads, video ads, email campaigns, etc.
                        Apart from online options, you can also reach out to the wider
                        audience with traditional marketing
                        </p>
                        <div className="team-details__progress-and-company">
                        <div className="row">
                            <div className="col-xl-6 col-lg-6">
                            <div className="team-details__progress-box">
                                <ul className="team-details__progress-list list-unstyled">
                                <li>
                                    <h4 className="team-details__progress-title">
                                    Web Development
                                    </h4>
                                    <div className="bar">
                                    <div className="bar-inner1 count-bar" data-percent="90%">
                                        <div className="count-text">90%</div>
                                    </div>
                                    </div>
                                </li>
                                <li>
                                    <h4 className="team-details__progress-title">
                                    Business Solution
                                    </h4>
                                    <div className="bar">
                                    <div className="bar-inner2 count-bar" data-percent="50%">
                                        <div className="count-text">50%</div>
                                    </div>
                                    </div>
                                </li>
                                <li>
                                    <h4 className="team-details__progress-title">
                                    Digital Marketing
                                    </h4>
                                    <div className="bar">
                                    <div className="bar-inner3 count-bar" data-percent="80%">
                                        <div className="count-text">80%</div>
                                    </div>
                                    </div>
                                </li>
                                </ul>
                            </div>
                            </div>
                            <div className="col-xl-6 col-lg-6">
                            <div className="team-details__company-box">
                                <div className="row">
                                <div className="col-xl-6">
                                    <ul className="team-details__company-list list-unstyled">
                                    <li>
                                        <h3 className="team-details__company-title">
                                        Azent Company
                                        </h3>
                                        <p className="team-details__company-sub-title">
                                        Web Designer, Figma
                                        </p>
                                    </li>
                                    <li>
                                        <h3 className="team-details__company-title">
                                        Moove Ux
                                        </h3>
                                        <p className="team-details__company-sub-title">
                                        Web Designer, Figma
                                        </p>
                                    </li>
                                    </ul>
                                </div>
                                <div className="col-xl-6">
                                    <ul className="team-details__company-list team-details__company-list--two list-unstyled">
                                    <li>
                                        <h3 className="team-details__company-title">
                                        Amazon Company
                                        </h3>
                                        <p className="team-details__company-sub-title">
                                        Web Designer, Figma
                                        </p>
                                    </li>
                                    <li>
                                        <h3 className="team-details__company-title">
                                        thememx Company
                                        </h3>
                                        <p className="team-details__company-sub-title">
                                        Web Designer, Figma
                                        </p>
                                    </li>
                                    </ul>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                        <h3 className="team-details__title-2">Best Skills</h3>
                        <p className="team-details__text-3">
                        A vast majority of the app marketers mainly concentrate on the
                        post-launch app marketing techniques and measures while completely
                        missing on the pre-launch campaign. This prevents the app to create
                        buzz and hype just around the time when the app is launched. As and
                        when you launch the app, already a considerable number of people
                        should expectantly look forward to your app and this requires
                        long-drawn marketing
                        </p>
                        <div className="team-details__contact-box">
                        <h3 className="team-details__contact-title">Let’s Get in Touch</h3>
                        <p className="team-details__contact-text">
                            Your email address will not be published. Required fields are marked
                            *
                        </p>
                        <form
                            action="assets/inc/sendemail.php"
                            className="team-details__form contact-form-validated"
                            noValidate="novalidate"
                        >
                            <div className="row">
                            <div className="col-xl-6 col-lg-6">
                                <div className="team-details__input-box">
                                <input type="text" placeholder="Your Name*" name="name" />
                                </div>
                            </div>
                            <div className="col-xl-6 col-lg-6">
                                <div className="team-details__input-box">
                                <input type="email" placeholder="Your Email*" name="email" />
                                </div>
                            </div>
                            <div className="col-xl-12">
                                <div className="team-details__input-box">
                                <input type="text" placeholder="Website*" name="email" />
                                </div>
                            </div>
                            </div>
                            <div className="row">
                            <div className="col-xl-12">
                                <div className="team-details__input-box text-message-box">
                                <textarea
                                    name="message"
                                    placeholder="Write Message*"
                                    defaultValue={""}
                                />
                                </div>
                                <div className="contact-two__btn-box">
                                <button type="submit" className="thm-btn team-details__btn">
                                    Send Your Message
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
                </section>
                {/*Team Details Info End*/}
                
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

