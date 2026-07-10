import Link from "next/link"
export default function Blog() {
    return (
        <>
            {/*Blog One Start*/}
            <section className="blog-one">
                <div className="container">
                <div className="section-title text-center">
                    <div className="section-title__tagline-box">
                    <span className="section-title__tagline">Actualités</span>
                    </div>
                    <h2 className="section-title__title">
                    Les dernières actualités
                    <br /> de XPARK
                    </h2>
                </div>
                <div className="row">
                    {/*Blog One Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInLeft"
                    data-wow-delay="100ms"
                    >
                    <div className="blog-one__single">
                        <div className="blog-one__img-box">
                        <div className="blog-one__img">
                            <img src="assets/images/blog/blog-1-1.jpg" alt="" />
                        </div>
                        <div className="blog-one__date">
                            <p>12 Juin</p>
                        </div>
                        </div>
                        <div className="blog-one__content">
                        <h3 className="blog-one__title">
                            <Link href="/blog-details">
                            XPARK renforce sa flotte avec de nouveaux véhicules
                            </Link>
                        </h3>
                        <p className="blog-one__text">
                            Notre flotte s'agrandit pour mieux répondre à vos besoins de transport.{" "}
                        </p>
                        <div className="blog-one__read-more">
                            <Link href="/blog-details">
                            Lire la suite
                            <span className="icon-arrow-right" />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                    {/*Blog One Single End*/}
                    {/*Blog One Single Start*/}
                    <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                    <div className="blog-one__single">
                        <div className="blog-one__img-box">
                        <div className="blog-one__img">
                            <img src="assets/images/blog/blog-1-2.jpg" alt="" />
                        </div>
                        <div className="blog-one__date">
                            <p>28 Mai</p>
                        </div>
                        </div>
                        <div className="blog-one__content">
                        <h3 className="blog-one__title">
                            <Link href="/blog-details">
                            Le suivi des opérations au service de vos livraisons
                            </Link>
                        </h3>
                        <p className="blog-one__text">
                            Comment notre organisation garantit des livraisons fiables et dans les délais.{" "}
                        </p>
                        <div className="blog-one__read-more">
                            <Link href="/blog-details">
                            Lire la suite
                            <span className="icon-arrow-right" />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                    {/*Blog One Single End*/}
                    {/*Blog One Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInRight"
                    data-wow-delay="300ms"
                    >
                    <div className="blog-one__single">
                        <div className="blog-one__img-box">
                        <div className="blog-one__img">
                            <img src="assets/images/blog/blog-1-3.jpg" alt="" />
                        </div>
                        <div className="blog-one__date">
                            <p>15 Mai</p>
                        </div>
                        </div>
                        <div className="blog-one__content">
                        <h3 className="blog-one__title">
                            <Link href="/blog-details">
                            Optimisation des trajets : nos engagements qualité{" "}
                            </Link>
                        </h3>
                        <p className="blog-one__text">
                            Des itinéraires étudiés pour des livraisons plus rapides et plus économiques.{" "}
                        </p>
                        <div className="blog-one__read-more">
                            <Link href="/blog-details">
                            Lire la suite
                            <span className="icon-arrow-right" />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                    {/*Blog One Single End*/}
                </div>
                </div>
            </section>
            {/*Blog One End*/}
        </>

    )
}
