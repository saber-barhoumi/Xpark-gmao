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
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Quic kMove Logistics">
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
                                        <h3 className="services-details__client-name">Sakib al hasan</h3>
                                        <p className="services-details__client-sub-title">Brand Abasador</p>
                                        <p className="services-details__client-text">
                                            Construction is an essential industry that the building and designing{" "}
                                        </p>
                                        <h3 className="services-details__client-number">
                                            <Link href="tel:888123456765">(+888) 123 456 765</Link>
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
                                        <h3 className="services-details__services-list-title">Our Services</h3>
                                        <ul className="services-details__service-list list-unstyled">
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/express-freight-solutions">
                                                Express Freight Solutions
                                                </Link>
                                            </p>
                                            </li>
                                            <li className="active">
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/quick-move-logistics">Quick Move Logistics</Link>
                                            </p>
                                            </li>
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/speedy-dispatch">Speedy Dispatch</Link>
                                            </p>
                                            </li>
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/swift-supply-chain">Swift Supply Chain</Link>
                                            </p>
                                            </li>
                                            <li>
                                            <div className="icon">
                                                <span className="icon-dabble-arrow" />
                                            </div>
                                            <p>
                                                <Link href="/on-point-distribution">On Point Distribution</Link>
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
                                        <h3 className="services-details__get-touch-title">GET TOUCH</h3>
                                        <p className="services-details__get-touch-sub-title">For fast service</p>
                                        <div className="services-details__get-touch-icon">
                                            <span className="icon-call" />
                                        </div>
                                        <h3 className="services-details__get-touch-number">
                                            <Link href="tel:888123456765">(+888) 123 456 765</Link>
                                        </h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-8 col-lg-7">
                                    <div className="services-details__right">
                                        <h3 className="services-details__title-1">
                                        Cultivate Success with Agriculture
                                        </h3>
                                        <p className="services-details__text-1">
                                        Logistics service involves the planning, implementation, and
                                        control of the efficient and effective transportation, storage,
                                        and distribution of goods and materials Logistics service involves
                                        the planning
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
                                                <Link href="#">Rapid Delivery Services</Link>
                                                </h3>
                                                <p className="services-details__service-text">
                                                Construction is an essential industry that an involves
                                                building and designing
                                                </p>
                                            </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6">
                                            <div className="services-details__service-single">
                                                <div className="services-details__service-icon">
                                                <span className="icon-lift-truck" />
                                                </div>
                                                <h3 className="services-details__service-title">
                                                <Link href="#">Quick Move Logistics</Link>
                                                </h3>
                                                <p className="services-details__service-text">
                                                Construction is an essential industry that an involves
                                                building and designing
                                                </p>
                                            </div>
                                            </div>
                                        </div>
                                        </div>
                                        <p className="services-details__text-2">
                                        Logistics service involves the planning, implementation, and
                                        control of the efficient and effective transportation, storage,
                                        and distribution of goods and materials Logistics service involves
                                        the planning Logistics servi involves the planning,
                                        implementation, and control of the efficient and effective
                                        transportation
                                        </p>
                                        <div className="services-details__faq">
                                        <div
                                            className="accrodion-grp faq-one-accrodion"
                                            data-grp-name="faq-one-accrodion-1"
                                        >
                                        <div className={isActive.key == 1 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(1)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>What is a ProActive Transport?</h4>
                                            </div>
                                            <div className={isActive.key == 1 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                    <p>
                                                        It is a long established fact that a reader will be
                                                        distracted by the readable content of a p looking at its
                                                        a layout. The point of using Lorem Ipsum is that it has
                                                        a more-or-less normal distribution of a letter as
                                                        opposed to a using 'Content here, content here.It is a
                                                        long
                                                    </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        <div className={isActive.key == 2 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(2)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>How do I set up a Swift Warehousing Solutions?</h4>
                                            </div>
                                            <div className={isActive.key == 2 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                    <p>
                                                        It is a long established fact that a reader will be
                                                        distracted by the readable content of a p looking at its
                                                        a layout. The point of using Lorem Ipsum is that it has
                                                        a more-or-less normal distribution of a letter as
                                                        opposed to a using 'Content here, content here.It is a
                                                        long
                                                    </p>
                                                </div>
                                                {/* /.inner */}
                                            </div>
                                        </div>
                                        <div className={isActive.key == 3 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(3)}>
                                            <div className="accrodion-count" />
                                            <div className="accrodion-title">
                                                <h4>How do I set up a Efficient Freight Solutions?</h4>
                                            </div>
                                            <div className={isActive.key == 3 ? "accrodion-content current" : "accrodion-content"}>
                                                <div className="inner">
                                                <p>
                                                    It is a long established fact that a reader will be
                                                    distracted by the readable content of a p looking at its
                                                    a layout. The point of using Lorem Ipsum is that it has
                                                    a more-or-less normal distribution of a letter as
                                                    opposed to a using 'Content here, content here.It is a
                                                    long
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
                                                <p>Road Flight</p>
                                            </li>
                                            <li>
                                                <p>Air Flight</p>
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
                                    <Link href="tel:3075550133">(307) 555-0133</Link>
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