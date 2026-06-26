import Link from "next/link"
export default function WhyChoose() {
    return (
        <>
            {/*Why Choose One Start*/}
            <section className="why-choose-one">
                <div className="container">
                <div className="row">
                    <div className="col-xl-6 col-lg-6">
                    <div className="why-choose-one__left">
                        <div className="section-title text-left">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">Why Chose us</span>
                        </div>
                        <h2 className="section-title__title">
                            Delivering excellence every a time Express Logistics
                        </h2>
                        </div>
                        <p className="why-choose-one__text">
                        Construction is an essential industry that involves building
                        adesigning the an structures such as buildings roads, bridges
                        Construction is an essent industry that involves building
                        adesigning the a structures such{" "}
                        </p>
                        <div className="why-choose-one__btn-box">
                        <Link href="/about" className="thm-btn why-choose-one__btn">
                            Read more
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                    <div className="col-xl-6 col-lg-6">
                    <div className="why-choose-one__right">
                        <div
                        className="why-choose-one__img wow slideInRight"
                        data-wow-delay="100ms"
                        data-wow-duration="2500ms"
                        >
                        <img
                            src="assets/images/resources/why-choose-one-img-1.jpg"
                            alt=""
                        />
                        <div className="why-choose-one__delivery-box">
                            <div className="icon">
                            <span className="icon-airplane" />
                            </div>
                            <p>
                            2 dAYS
                            <br /> DELIVARY
                            </p>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </section>
            {/*Why Choose One End*/}
        </>


    )
}
