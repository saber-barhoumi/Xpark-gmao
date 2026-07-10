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
                        Besoin d'un transport ?
                        <br /> Contactez-nous !
                    </h3>
                    <div className="cta-one__contact-box">
                        <div className="icon">
                        <span className="icon-phone" />
                        </div>
                        <div className="content">
                        <p>Notre équipe est disponible</p>
                        <h3>
                            <a href="tel:+21670000000">+216 70 000 000</a>
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
