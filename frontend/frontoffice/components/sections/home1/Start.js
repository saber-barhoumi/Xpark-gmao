import Link from "next/link"
export default function Start() {
    return (
        <>
            {/*Why Are We Start*/}
            <section className="why-are-we">
                <div className="container">
                <div className="row">
                    <div className="col-xl-4">
                    <div className="why-are-we__left">
                        <div className="why-are-we__img">
                        <img src="assets/images/resources/why-are-we-img-1.jpg" alt="" />
                        </div>
                    </div>
                    </div>
                    <div className="col-xl-8">
                    <div className="why-are-we__right">
                        <div className="section-title text-left">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">Why are we best</span>
                        </div>
                        <h2 className="section-title__title">
                            Efficiency at its best with our
                            <br /> logistics services
                        </h2>
                        </div>
                        <ul className="why-are-we__list list-unstyled">
                        <li>
                            <div className="why-are-we__icon">
                            <span className="icon-arrow-down-left" />
                            </div>
                            <div className="icon">
                            <span className="icon-location why-are-we__location" />
                            </div>
                            <div className="content">
                            <h3>Real Time tracking</h3>
                            <p>Logistic service involves the ntation and control </p>
                            </div>
                        </li>
                        <li>
                            <div className="why-are-we__icon-2">
                            <span className="icon-arrow-down-right" />
                            </div>
                            <div className="icon">
                            <span className="icon-shopping-cart why-are-we__cart" />
                            </div>
                            <div className="content">
                            <h3>On time delivary</h3>
                            <p>Logistic service involves the ntation and control </p>
                            </div>
                        </li>
                        <li>
                            <div className="icon">
                            <span className="icon-call why-are-we__call" />
                            </div>
                            <div className="content">
                            <h3>24/7 online support</h3>
                            <p>Logistic service involves the ntation and control </p>
                            </div>
                        </li>
                        </ul>
                        <div className="why-are-we__img-2">
                        <img src="assets/images/resources/why-are-we-img-2.jpg" alt="" />
                        <div
                            className="why-are-we__year wow fadeInLeft"
                            data-wow-delay="300ms"
                        >
                            <h3>Since 1920</h3>
                            <p>
                            Logistic service involves the planning, implementation, and
                            control of the efficient and effective movement and storage
                            </p>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </section>
            {/*Why Are We End*/}
        </>

    )
}
