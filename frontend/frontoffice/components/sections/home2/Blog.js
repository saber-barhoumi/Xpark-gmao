import Link from "next/link"


export default function Blog() {
    return (
        <>
            {/*Blog Two Start*/}
            <section className="blog-two">
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
                    {/*Blog Two Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInLeft"
                    data-wow-delay="100ms"
                    >
                    <div className="blog-two__single">
                        <div className="blog-two__img-box">
                        <div className="blog-two__img">
                            <img src="assets/images/blog/blog-2-1.jpg" alt="" />
                        </div>
                        <div className="blog-two__date">
                            <p>
                            09
                            <br />
                            <span>Apr</span>
                            </p>
                        </div>
                        </div>
                        <div className="blog-two__content-inner">
                        <div className="blog-two__content">
                            <ul className="blog-two__meta list-unstyled">
                            <li>
                                <Link href="/blog-details">
                                <span className="icon-user" />
                                By admin
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog-details">
                                <span className="icon-comments" />
                                Comments (05)
                                </Link>
                            </li>
                            </ul>
                            <h3 className="blog-two__title">
                            <Link href="/blog-details">
                                Your trusted the provider Express Logistics
                            </Link>
                            </h3>
                        </div>
                        <div className="blog-two__btn-box">
                            <Link href="/blog-details" className="thm-btn blog-two__btn">
                            Read more
                            <span />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                    {/*Blog Two Single End*/}
                    {/*Blog Two Single Start*/}
                    <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                    <div className="blog-two__single">
                        <div className="blog-two__img-box">
                        <div className="blog-two__img">
                            <img src="assets/images/blog/blog-2-2.jpg" alt="" />
                        </div>
                        <div className="blog-two__date">
                            <p>
                            09
                            <br />
                            <span>Apr</span>
                            </p>
                        </div>
                        </div>
                        <div className="blog-two__content-inner">
                        <div className="blog-two__content">
                            <ul className="blog-two__meta list-unstyled">
                            <li>
                                <Link href="/blog-details">
                                <span className="icon-user" />
                                By admin
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog-details">
                                <span className="icon-comments" />
                                Comments (05)
                                </Link>
                            </li>
                            </ul>
                            <h3 className="blog-two__title">
                            <Link href="/blog-details">
                                Delivering success through logistics Logistics
                            </Link>
                            </h3>
                        </div>
                        <div className="blog-two__btn-box">
                            <Link href="/blog-details" className="thm-btn blog-two__btn">
                            Read more
                            <span />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                    {/*Blog Two Single End*/}
                    {/*Blog Two Single Start*/}
                    <div
                    className="col-xl-4 col-lg-4 wow fadeInRight"
                    data-wow-delay="300ms"
                    >
                    <div className="blog-two__single">
                        <div className="blog-two__img-box">
                        <div className="blog-two__img">
                            <img src="assets/images/blog/blog-2-3.jpg" alt="" />
                        </div>
                        <div className="blog-two__date">
                            <p>
                            09
                            <br />
                            <span>Apr</span>
                            </p>
                        </div>
                        </div>
                        <div className="blog-two__content-inner">
                        <div className="blog-two__content">
                            <ul className="blog-two__meta list-unstyled">
                            <li>
                                <Link href="/blog-details">
                                <span className="icon-user" />
                                By admin
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog-details">
                                <span className="icon-comments" />
                                Comments (05)
                                </Link>
                            </li>
                            </ul>
                            <h3 className="blog-two__title">
                            <Link href="/blog-details">
                                Streamlining your supply Your provider
                            </Link>
                            </h3>
                        </div>
                        <div className="blog-two__btn-box">
                            <Link href="/blog-details" className="thm-btn blog-two__btn">
                            Read more
                            <span />
                            </Link>
                        </div>
                        </div>
                    </div>
                    </div>
                    {/*Blog Two Single End*/}
                </div>
                </div>
            </section>
            {/*Blog Two End*/}
        </>


    )
}
