
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Projects">
                <div>
               
                    {/*Project Two Start*/}
                    <section className="project-one">
                        <div className="container">
                        <div className="row">
                            {/*Project Two Single Start*/}
                            <div
                            className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                            data-wow-delay="100ms"
                            >
                            <div className="project-two__single">
                                <div className="project-two__content-box">
                                <div className="section-title text-left">
                                    <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">latest project</span>
                                    </div>
                                    <h2 className="section-title__title">
                                    Seamless logistics for your logo
                                    </h2>
                                </div>
                                <div className="project-two__btn-box">
                                    <Link
                                    href="/project-details"
                                    className="thm-btn project-two__btn"
                                    >
                                    more project
                                    <span />
                                    </Link>
                                </div>
                                </div>
                            </div>
                            </div>
                            {/*Project Two Single End*/}
                            {/*Project Two Single Start*/}
                            <div
                            className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                            data-wow-delay="300ms"
                            >
                            <div className="project-two__single">
                                <div className="project-two__img">
                                <img src="assets/images/project/project-2-1.jpg" alt="" />
                                <div className="project-two__content">
                                    <p className="project-two__sub-title">Express Logistics</p>
                                    <h3 className="project-two__title">
                                    <Link href="/project-details">
                                        Delivering success through logistics
                                    </Link>
                                    </h3>
                                </div>
                                </div>
                            </div>
                            </div>
                            {/*Project Two Single End*/}
                            {/*Project Two Single Start*/}
                            <div
                            className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                            data-wow-delay="500ms"
                            >
                            <div className="project-two__single">
                                <div className="project-two__img">
                                <img src="assets/images/project/project-2-2.jpg" alt="" />
                                <div className="project-two__content">
                                    <p className="project-two__sub-title">Express Logistics</p>
                                    <h3 className="project-two__title">
                                    <Link href="/project-details">
                                        Delivering success through logistics
                                    </Link>
                                    </h3>
                                </div>
                                </div>
                            </div>
                            </div>
                            {/*Project Two Single End*/}
                            {/*Project Two Single Start*/}
                            <div
                            className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                            data-wow-delay="700ms"
                            >
                            <div className="project-two__single">
                                <div className="project-two__img">
                                <img src="assets/images/project/project-2-3.jpg" alt="" />
                                <div className="project-two__content">
                                    <p className="project-two__sub-title">Express Logistics</p>
                                    <h3 className="project-two__title">
                                    <Link href="/project-details">
                                        Delivering success through logistics
                                    </Link>
                                    </h3>
                                </div>
                                </div>
                            </div>
                            </div>
                            {/*Project Two Single End*/}
                            {/*Project Two Single Start*/}
                            <div
                            className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                            data-wow-delay="900ms"
                            >
                            <div className="project-two__single">
                                <div className="project-two__img">
                                <img src="assets/images/project/project-2-4.jpg" alt="" />
                                <div className="project-two__content">
                                    <p className="project-two__sub-title">Express Logistics</p>
                                    <h3 className="project-two__title">
                                    <Link href="/project-details">
                                        Delivering success through logistics
                                    </Link>
                                    </h3>
                                </div>
                                </div>
                            </div>
                            </div>
                            {/*Project Two Single End*/}
                            {/*Project Two Single Start*/}
                            <div
                            className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp"
                            data-wow-delay="1100ms"
                            >
                            <div className="project-two__single">
                                <div className="project-two__img">
                                <img src="assets/images/project/project-2-5.jpg" alt="" />
                                <div className="project-two__content">
                                    <p className="project-two__sub-title">Express Logistics</p>
                                    <h3 className="project-two__title">
                                    <Link href="/project-details">
                                        Delivering success through logistics
                                    </Link>
                                    </h3>
                                </div>
                                </div>
                            </div>
                            </div>
                            {/*Project Two Single End*/}
                        </div>
                        </div>
                    </section>
                    {/*Project Two End*/}

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