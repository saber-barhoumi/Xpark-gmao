'use client'
import Link from "next/link"


export default function ServicesTwo() {
    
    return (
        <>
            {/*Services Two Start*/}
            <section className="services-two">
                <div className="container">
                <div className="section-title text-center">
                    <div className="section-title__tagline-box">
                    <span className="section-title__tagline">lATEST sERVICE</span>
                    </div>
                    <h2 className="section-title__title">
                    Your supply chain partner
                    <br /> the for success
                    </h2>
                </div>
                <div className="row">
                    {/*Services Two Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInLeft"
                    data-wow-delay="100ms"
                    >
                    <div className="services-two__single">
                        <div className="services-two__icon">
                        <span className="icon-postbox" />
                        </div>
                        <h3 className="services-two__title">
                        <Link href="/express-freight-solutions">
                            Fast and reliable logistics the solutions
                        </Link>
                        </h3>
                        <p className="services-two__text">
                        Logistic service involves of implementation and control of the
                        efficient
                        </p>
                    </div>
                    </div>
                    {/*Services Two Single End*/}
                    {/*Services Two Single Start*/}
                    <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                    <div className="services-two__single">
                        <div className="services-two__icon">
                        <span className="icon-container" />
                        </div>
                        <h3 className="services-two__title">
                        <Link href="/speedy-dispatch">
                            Bridges Construction is an essen industry
                        </Link>
                        </h3>
                        <p className="services-two__text">
                        Logistic service involves of implementation and control of the
                        efficient
                        </p>
                    </div>
                    </div>
                    {/*Services Two Single End*/}
                    {/*Services Two Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInRight"
                    data-wow-delay="300ms"
                    >
                    <div className="services-two__single">
                        <div className="services-two__icon">
                        <span className="icon-crane" />
                        </div>
                        <h3 className="services-two__title">
                        <Link href="/quick-move-logistics">
                            {" "}
                            That involves building adesig the a structures
                        </Link>
                        </h3>
                        <p className="services-two__text">
                        Logistic service involves of implementation and control of the
                        efficient
                        </p>
                    </div>
                    </div>
                    {/*Services Two Single End*/}
                </div>
                </div>
            </section>
            {/*Services Two End*/}
        </>


    )
}
