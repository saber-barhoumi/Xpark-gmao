import Link from "next/link"
export default function Blog() {
    return (
        <>
            {/*Blog One Start*/}
            <section className="blog-one">
                <div className="container">
                <div className="section-title text-center">
                    <div className="section-title__tagline-box">
                    <span className="section-title__tagline">Latests Blog</span>
                    </div>
                    <h2 className="section-title__title">
                    Streamlining your supply
                    <br /> chain processes
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
                            <p>24 March</p>
                        </div>
                        </div>
                        <div className="blog-one__content">
                        <h3 className="blog-one__title">
                            <Link href="/blog-details">
                            Your trusted logistics provider Express Logistics
                            </Link>
                        </h3>
                        <p className="blog-one__text">
                            It is a long established fact that a reader will williljl be
                            distracted{" "}
                        </p>
                        <div className="blog-one__read-more">
                            <Link href="/blog-details">
                            Read More
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
                            <p>24 March</p>
                        </div>
                        </div>
                        <div className="blog-one__content">
                        <h3 className="blog-one__title">
                            <Link href="/blog-details">
                            Logistics expertise for your the competitive advantage
                            </Link>
                        </h3>
                        <p className="blog-one__text">
                            It is a long established fact that a reader will williljl be
                            distracted{" "}
                        </p>
                        <div className="blog-one__read-more">
                            <Link href="/blog-details">
                            Read More
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
                            <p>24 March</p>
                        </div>
                        </div>
                        <div className="blog-one__content">
                        <h3 className="blog-one__title">
                            <Link href="/blog-details">
                            Streamlining your supply chain processes Express{" "}
                            </Link>
                        </h3>
                        <p className="blog-one__text">
                            It is a long established fact that a reader will williljl be
                            distracted{" "}
                        </p>
                        <div className="blog-one__read-more">
                            <Link href="/blog-details">
                            Read More
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
