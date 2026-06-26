import Link from "next/link"


export default function WhyChooseTwo() {
    return (
        <>
            {/*Why Choose Two Start*/}
            <section className="why-choose-two">
                <div
                className="why-choose-two__bg"
                style={{
                    backgroundImage: "url(assets/images/backgrounds/why-choose-two-bg.jpg)"
                }}
                >
                <div className="why-choose-two__need-help">
                    <div className="icon">
                    <span className="icon-phone" />
                    </div>
                    <div className="content">
                    <p>Need help?</p>
                    <h3>
                        <Link href="tel:01959701730">01959701730</Link>
                    </h3>
                    </div>
                </div>
                </div>
                <div className="container">
                <div className="row">
                    <div className="col-xl-6">
                    <div className="why-choose-two__left">
                        <div className="section-title text-left">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">Why Chose us</span>
                        </div>
                        <h2 className="section-title__title">
                            Delivering excellence
                            <br /> every a time Express
                            <br />
                            Logistics
                        </h2>
                        </div>
                        <p className="why-choose-two__text">
                        Construction is an essential industry that involves building
                        <br />
                        adesigning the an structures such as buildings roads, bridges{" "}
                        <br />
                        Construction is an essent industry that involves building
                        <br /> adesigning the a structures such{" "}
                        </p>
                        <div className="why-choose-two__btn-box">
                        <Link href="/about" className="thm-btn why-choose-two__btn">
                            Read more
                            <span />
                        </Link>
                        </div>
                        <h3 className="why-choose-two__big-text">Since 1920</h3>
                    </div>
                    </div>
                </div>
                </div>
            </section>
            {/*Why Choose Two End*/}
        </>

      
    )
}
