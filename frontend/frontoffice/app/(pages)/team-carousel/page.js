import Layout from "@/components/layout/Layout"
import TeamSlider from "@/components/slider/TeamSlider"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Team Carousel">
                <div>
                    {/*Team One Start*/}
                    <section className="team-carousel-page">
                        <div className="container">
                        <div className="team-one__top">
                            <div className="section-title text-left">
                            <div className="section-title__tagline-box">
                                <span className="section-title__tagline">Our Team</span>
                            </div>
                            <h2 className="section-title__title">
                                Simplifying your logistics of <br />
                                the challenges
                            </h2>
                            </div>
                            <div className="team-one__nav">
                            <div className="swiper-button-next1">
                                <i className="icon-arrow-left" />
                            </div>
                            <div className="swiper-button-prev1">
                                <i className="icon-arrow-right" />
                            </div>
                            </div>
                        </div>
                        <div className="team-one__bottom">
                            
                            <TeamSlider/>

                        </div>
                        </div>
                    </section>
                    {/*Team One End*/}

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