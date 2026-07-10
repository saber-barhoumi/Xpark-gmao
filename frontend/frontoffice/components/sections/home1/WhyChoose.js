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
                            <span className="section-title__tagline">Pourquoi choisir XPARK</span>
                        </div>
                        <h2 className="section-title__title">
                            Sécurité et fiabilité à chaque transport
                        </h2>
                        </div>
                        <p className="why-choose-one__text">
                        XPARK garantit une gestion professionnelle des opérations de
                        transport. Nos véhicules sont entretenus et suivis en permanence
                        pour répondre aux différents besoins de transport avec sécurité,
                        fiabilité et respect des délais.{" "}
                        </p>
                        <div className="why-choose-one__btn-box">
                        <Link href="/about" className="thm-btn why-choose-one__btn">
                            En savoir plus
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
                            LIVRAISON
                            <br /> DANS LES DÉLAIS
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
