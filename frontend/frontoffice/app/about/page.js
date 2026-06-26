'use client'
import Link from "next/link"
import ModalVideo from 'react-modal-video';
import { useState } from 'react'
import CounterUp from "@/components/elements/CounterUp"
import Layout from "@/components/layout/Layout"
import TestimonialSlider1 from "@/components/slider/TestimonialSlider1"

export default function Home() {
    const [isOpen, setOpen] = useState(false);

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="About US">
                <div>

             
                    {/*About One Start*/}
                    <section className="about-one about-two">
                        <div className="container">
                        <div className="row">
                            <div className="col-xl-6">
                            <div className="about-one__left">
                                <div className="section-title text-left">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">About Us</span>
                                </div>
                                <h2 className="section-title__title">
                                    Seamless logistics for your <br /> business needs
                                </h2>
                                </div>
                                <p className="about-one__text">
                                Construction is an essential industry that involves building
                                adesigning the a structures such as buildings roads, bridges
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
                                        Delivering successthe <br /> through logistics
                                    </h3>
                                    </li>
                                    <li>
                                    <div className="about-one__icon">
                                        <span className="icon-clock" />
                                    </div>
                                    <h3>
                                        Logistics expertise for your
                                        <br /> competitive{" "}
                                    </h3>
                                    </li>
                                    <li>
                                    <div className="about-one__icon">
                                        <span className="icon-fragile" />
                                    </div>
                                    <h3>
                                        Streamliningm supply chain
                                        <br /> processes
                                    </h3>
                                    </li>
                                </ul>
                                </div>
                                <div className="about-one__btn-box">
                                <Link href="/about" className="thm-btn about-one__btn">
                                    Read more
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
                                    <p className="about-one__trust-text">Trusted Customer</p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*About One End*/}
  
                    {/*Counter One Start*/}
                    <section className="counter-one">
                        <div className="container">
                        <div className="row">
                            <div className="col-xl-5">
                            <div
                                className="counter-one__left wow slideInLeft"
                                data-wow-delay="100ms"
                                data-wow-duration="2500ms"
                            >
                                <div className="counter-one__img">
                                <img src="assets/images/resources/counter-one-img-1.jpg" alt="" />
                                <div className="counter-one__video-link">
                                    <a onClick={() => setOpen(true)} className="video-popup" data-fancybox="video-1" data-caption="">
                                        <div className="counter-one__video-icon">
                                            <span className="icon-play" />
                                            <i className="ripple" />
                                        </div>
                                    </a>
                                </div>
                                </div>
                            </div>
                            </div>
                            <div className="col-xl-7">
                            <div
                                className="counter-one__right wow slideInRight"
                                data-wow-delay="100ms"
                                data-wow-duration="2500ms"
                            >
                                <div className="section-title text-left">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Our Features</span>
                                </div>
                                <h2 className="section-title__title">
                                    Simplifying your logistics of <br />
                                    the challenges
                                </h2>
                                </div>
                                <p className="counter-one__right-text">
                                Logistic service involves the planning, implementation, and
                                control of the efficient and effective movement and storage of
                                goods and materials.
                                </p>
                                <ul className="counter-one__count-list list-unstyled">
                                <li>
                                    <div className="counter-one__icon-and-count">
                                    <div className="counter-one__icon">
                                        <span className="icon-schedule" />
                                    </div>
                                    <div className="counter-one__count count-box">
                                        <h3 className="count-text">
                                        <CounterUp end={100} />
                                        </h3>
                                        <span>+</span>
                                    </div>
                                    </div>
                                    <p className="counter-one__count-text">Our Happy Customer</p>
                                </li>
                                <li>
                                    <div className="counter-one__icon-and-count">
                                    <div className="counter-one__icon">
                                        <span className="icon-schedule" />
                                    </div>
                                    <div className="counter-one__count count-box">
                                        <h3 className="count-text">
                                            <CounterUp end={2} />
                                        </h3>
                                        <span>k</span>
                                        <span className="counter-one__count-plus">+</span>
                                    </div>
                                    </div>
                                    <p className="counter-one__count-text">Our Team Member</p>
                                </li>
                                <li>
                                    <div className="counter-one__icon-and-count">
                                    <div className="counter-one__icon">
                                        <span className="icon-schedule" />
                                    </div>
                                    <div className="counter-one__count count-box">
                                        <h3 className="count-text">
                                            <CounterUp end={3} />
                                        </h3>
                                        <span>k</span>
                                        <span className="counter-one__count-plus">+</span>
                                    </div>
                                    </div>
                                    <p className="counter-one__count-text">Our Clients Reviews</p>
                                </li>
                                </ul>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*Counter One End*/}

                    {/*Testimonial One Start*/}
                    <section className="testimonial-one">
                        <div className="container">
                        <div className="testimonial-one__inner">
                            <div className="testimonial-one__img-one">
                            <img
                                src="assets/images/testimonial/testimonial-one-img-1.jpg"
                                alt=""
                            />
                            </div>
                            <div className="section-title text-center">
                            <div className="section-title__tagline-box">
                                <span className="section-title__tagline">clients testimonial</span>
                            </div>
                            <h2 className="section-title__title">
                                Your supply chain partner
                                <br /> for success
                            </h2>
                            </div>
                            <div className="row">
                            <div className="col-xl-5" />
                            <div className="col-xl-7 col-lg-9">
                                <div className="testimonial-one__right">
                                <TestimonialSlider1/>
                                </div>
                            </div>
                            </div>
                            <div className="testimonial-one__dot-style">
                            <div className="swiper-dot-style1" />
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*Testimonial One End*/}

                    {/*Why Are We Start*/}
                    <section className="why-are-we">
                        <div className="container">
                        <div className="row">
                            <div className="col-xl-4">
                            <div className="why-are-we__left">
                                <div className="why-are-we__img">
                                <img src="assets/images/resources/why-are-we-img-1.jpg" alt="" />
                                </div>
                            </div>
                            </div>
                            <div className="col-xl-8">
                            <div className="why-are-we__right">
                                <div className="section-title text-left">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Why are we best</span>
                                </div>
                                <h2 className="section-title__title">
                                    Efficiency at its best with our
                                    <br /> logistics services
                                </h2>
                                </div>
                                <ul className="why-are-we__list list-unstyled">
                                <li>
                                    <div className="why-are-we__icon">
                                    <span className="icon-arrow-down-left" />
                                    </div>
                                    <div className="icon">
                                    <span className="icon-location why-are-we__location" />
                                    </div>
                                    <div className="content">
                                    <h3>Real Time tracking</h3>
                                    <p>Logistic service involves the ntation and control </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="why-are-we__icon-2">
                                    <span className="icon-arrow-down-right" />
                                    </div>
                                    <div className="icon">
                                    <span className="icon-shopping-cart why-are-we__cart" />
                                    </div>
                                    <div className="content">
                                    <h3>On time delivary</h3>
                                    <p>Logistic service involves the ntation and control </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="icon">
                                    <span className="icon-call why-are-we__call" />
                                    </div>
                                    <div className="content">
                                    <h3>24/7 online support</h3>
                                    <p>Logistic service involves the ntation and control </p>
                                    </div>
                                </li>
                                </ul>
                                <div className="why-are-we__img-2">
                                <img src="assets/images/resources/why-are-we-img-2.jpg" alt="" />
                                <div
                                    className="why-are-we__year wow fadeInLeft"
                                    data-wow-delay="300ms"
                                >
                                    <h3>Since 1920</h3>
                                    <p>
                                    Logistic service involves the planning, implementation, and
                                    control of the efficient and effective movement and storage
                                    </p>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*Why Are We End*/}

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
                    <ModalVideo channel='youtube' autoplay isOpen={isOpen} videoId="vfhzo499OeA" onClose={() => setOpen(false)} /> 
                </div>
            </Layout>
        </>
    )
}