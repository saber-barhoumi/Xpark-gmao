

import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Error404() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="404 Error">
          
            <div>
                {/*Error Page Start*/}
                <section className="error-page">
                    <div className="error-page-shape-one float-bob-x">
                    <img src="assets/images/shapes/error-page-shape-1.png" alt="" />
                    </div>
                    <div className="container">
                    <div className="row">
                        <div className="col-xl-12">
                        <div className="error-page__inner">
                            <div className="error-page__title-box">
                            <h2 className="error-page__title">404</h2>
                            </div>
                            <h3 className="error-page__tagline">
                            Sorry we can't find that page!
                            </h3>
                            <p className="error-page__text">
                            The page you are looking for was never existed.
                            </p>
                            <form className="error-page__form">
                            <div className="error-page__form-input">
                                <input type="search" placeholder="Search here" />
                                <button type="submit">
                                <i className="fas fa-search" />
                                </button>
                            </div>
                            </form>
                            <Link href="/" className="thm-btn error-page__btn">
                            Back to home <span />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>
                {/*Error Page End*/}
                
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
