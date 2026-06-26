import Link from "next/link"
export default function Cta() {
    return (
        <>
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
        </>

    )
}
