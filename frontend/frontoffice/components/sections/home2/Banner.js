import Link from "next/link"


export default function Banner() {
    return (
        <>
            {/*Banner One Start*/}
            <section className="banner-one">
                <div
                className="banner-one__shape-1 float-bob-y"
                style={{
                    backgroundImage: "url(assets/images/shapes/banner-one-shape-1.png)"
                }}
                />
                <div className="container">
                <div className="row">
                    <div className="col-xl-7">
                    <div
                        className="banner-one__left wow fadeInLeft"
                        data-wow-delay="300ms"
                    >
                        <div className="banner-one__sub-title-box">
                        <div className="banner-one__sub-title-icon">
                            <img
                            src="assets/images/icon/banner-one-sub-title-icon.png"
                            alt=""
                            />
                        </div>
                        <h5 className="banner-one__sub-title">Best Cargo</h5>
                        </div>
                        <h2 className="banner-one__title">
                        Transport Goods <br /> Priority{" "}
                        <span>
                            Logistics <br />
                            Simplified
                        </span>
                        </h2>
                        <div className="banner-one__btn-box">
                        <Link href="/about" className="thm-btn banner-one__btn">
                            Read more
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                    <div className="col-xl-5">
                    <div
                        className="banner-one__right wow fadeInRight"
                        data-wow-delay="400ms"
                    >
                        <div className="banner-one__img-box">
                        <div className="banner-one__img">
                            <img
                            src="assets/images/resources/banner-one-img-1.jpg"
                            alt=""
                            />
                        </div>
                        <div className="banner-one__content">
                            <div className="banner-one__call">
                            <div className="banner-one__call-icon">
                                <span className="icon-phone" />
                            </div>
                            <div className="banner-one__call-number">
                                <p>Need help?</p>
                                <h5>
                                <Link href="tel:307555-0133">(307) 555-0133</Link>
                                </h5>
                            </div>
                            </div>
                        </div>
                        <div className="banner-one__img-two">
                            <img
                            src="assets/images/resources/banner-one-img-2.jpg"
                            alt=""
                            />
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </section>
            {/*Banner One End*/}
        </>

    )
}
