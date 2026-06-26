import Link from "next/link"
export default function ServicesOne() {
    return (
        <>
            {/*Services One Start*/}
            <section className="services-one">
                <div className="container">
                <div className="section-title text-center">
                    <div className="section-title__tagline-box">
                    <span className="section-title__tagline">LATEST SERVICE</span>
                    </div>
                    <h2 className="section-title__title">
                    Your supply chain partner
                    <br /> for success
                    </h2>
                </div>
                <div className="row">
                    {/*Services One Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInLeft"
                    data-wow-delay="100ms"
                    >
                    <div className="services-one__single">
                        <div className="services-one__icon">
                        <span className="icon-postbox" />
                        </div>
                        <h3 className="services-one__title">
                        <Link href="/express-freight-solutions">
                            Fast and reliable logistics the solutions
                        </Link>
                        </h3>
                        <div className="services-one__btn-box">
                        <Link
                            href="/express-freight-solutions"
                            className="thm-btn services-one__btn"
                        >
                            Read more
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                    {/*Services One Single End*/}
                    {/*Services One Single Start*/}
                    <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                    <div className="services-one__single">
                        <div className="services-one__icon">
                        <span className="icon-customer-service" />
                        </div>
                        <h3 className="services-one__title">
                        <Link href="/quick-move-logistics">
                            Bridges Construction is an essen industry
                        </Link>
                        </h3>
                        <div className="services-one__btn-box">
                        <Link
                            href="/quick-move-logistics"
                            className="thm-btn services-one__btn"
                        >
                            Read more
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                    {/*Services One Single End*/}
                    {/*Services One Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInRight"
                    data-wow-delay="300ms"
                    >
                    <div className="services-one__single">
                        <div className="services-one__icon">
                        <span className="icon-container" />
                        </div>
                        <h3 className="services-one__title">
                        <Link href="/speedy-dispatch">
                            That involves building adesig the a structures
                        </Link>
                        </h3>
                        <div className="services-one__btn-box">
                        <Link
                            href="/speedy-dispatch"
                            className="thm-btn services-one__btn"
                        >
                            Read more
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                    {/*Services One Single End*/}
                </div>
                </div>
            </section>
            {/*Services One End*/}
        </>


    )
}
