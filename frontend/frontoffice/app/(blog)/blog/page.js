
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Blog">
                <div>

                    {/*Blog Page Start*/}
                    <section className="blog-page">
                        <div className="container">
                        <div className="row">
                            <div className="col-xl-8 col-lg-7">
                            {/*Blog Page Single Start*/}
                            <div className="blog-page__single">
                                <div className="blog-page__img">
                                <img src="assets/images/blog/blog-page-1-1.jpg" alt="" />
                                <div className="blog-page__date">
                                    <p>29 jan 2024</p>
                                </div>
                                </div>
                                <div className="blog-page__content">
                                <ul className="blog-page__meta list-unstyled">
                                    <li>
                                    <Link href="#">
                                        <span className="icon-comments-2" />
                                        Comments (05)
                                    </Link>
                                    </li>
                                    <li>
                                    <Link href="#">
                                        <span className="icon-user-2" />
                                        By admin
                                    </Link>
                                    </li>
                                </ul>
                                <h3 className="blog-page__title">
                                    <Link href="/blog-details">Creating Lasting Impressions</Link>
                                </h3>
                                <p className="blog-page__text">
                                    Construction is an essential industry that involves building and
                                    designing structures such as buildings roads, bridges, and more.
                                    It requires skilled workers, materials, and careful
                                </p>
                                <div className="blog-page__btn-box">
                                    <Link href="/blog-details" className="thm-btn blog-page__btn">
                                    Read more
                                    <span />
                                    </Link>
                                </div>
                                <div className="blog-page__social">
                                    <Link href="/blog-details">
                                    <span className="icon-instagram" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-facebook-f" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-Vector" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-linkedin-in" />
                                    </Link>
                                </div>
                                </div>
                            </div>
                            {/*Blog Page Single End*/}
                            {/*Blog Page Single Start*/}
                            <div className="blog-page__single">
                                <div className="blog-page__img">
                                <img src="assets/images/blog/blog-page-1-2.jpg" alt="" />
                                <div className="blog-page__date">
                                    <p>29 jan 2024</p>
                                </div>
                                </div>
                                <div className="blog-page__content">
                                <ul className="blog-page__meta list-unstyled">
                                    <li>
                                    <Link href="#">
                                        <span className="icon-comments-2" />
                                        Comments (05)
                                    </Link>
                                    </li>
                                    <li>
                                    <Link href="#">
                                        <span className="icon-user-2" />
                                        By admin
                                    </Link>
                                    </li>
                                </ul>
                                <h3 className="blog-page__title">
                                    <Link href="/blog-details">Efficiently moving your goods</Link>
                                </h3>
                                <p className="blog-page__text">
                                    Construction is an essential industry that involves building and
                                    designing structures such as buildings roads, bridges, and more.
                                    It requires skilled workers, materials, and careful
                                </p>
                                <div className="blog-page__btn-box">
                                    <Link href="/blog-details" className="thm-btn blog-page__btn">
                                    Read more
                                    <span />
                                    </Link>
                                </div>
                                <div className="blog-page__social">
                                    <Link href="/blog-details">
                                    <span className="icon-instagram" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-facebook-f" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-Vector" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-linkedin-in" />
                                    </Link>
                                </div>
                                </div>
                            </div>
                            {/*Blog Page Single End*/}
                            {/*Blog Page Single Start*/}
                            <div className="blog-page__single">
                                <div className="blog-page__img">
                                <img src="assets/images/blog/blog-page-1-3.jpg" alt="" />
                                <div className="blog-page__date">
                                    <p>29 jan 2024</p>
                                </div>
                                </div>
                                <div className="blog-page__content">
                                <ul className="blog-page__meta list-unstyled">
                                    <li>
                                    <Link href="#">
                                        <span className="icon-comments-2" />
                                        Comments (05)
                                    </Link>
                                    </li>
                                    <li>
                                    <Link href="#">
                                        <span className="icon-user-2" />
                                        By admin
                                    </Link>
                                    </li>
                                </ul>
                                <h3 className="blog-page__title">
                                    <Link href="/blog-details">
                                    Cultivate Success with Agriculture
                                    </Link>
                                </h3>
                                <p className="blog-page__text">
                                    Construction is an essential industry that involves building and
                                    designing structures such as buildings roads, bridges, and more.
                                    It requires skilled workers, materials, and careful
                                </p>
                                <div className="blog-page__btn-box">
                                    <Link href="/blog-details" className="thm-btn blog-page__btn">
                                    Read more
                                    <span />
                                    </Link>
                                </div>
                                <div className="blog-page__social">
                                    <Link href="/blog-details">
                                    <span className="icon-instagram" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-facebook-f" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-Vector" />
                                    </Link>
                                    <Link href="/blog-details">
                                    <span className="icon-linkedin-in" />
                                    </Link>
                                </div>
                                </div>
                            </div>
                            {/*Blog Page Single End*/}
                            <div className="blog-page__pagination">
                                <ul className="pg-pagination list-unstyled">
                                <li className="count">
                                    <Link href="/blog-details">1</Link>
                                </li>
                                <li className="count">
                                    <Link href="/blog-details">2</Link>
                                </li>
                                <li className="count">
                                    <Link href="/blog-details">3</Link>
                                </li>
                                <li className="next">
                                    <Link href="#" aria-label="Next">
                                    <i className="icon-dabble-arrow" />
                                    </Link>
                                </li>
                                </ul>
                            </div>
                            </div>
                            <div className="col-xl-4 col-lg-5">
                            <div className="sidebar">
                                <div className="sidebar__single sidebar__search">
                                <h3 className="sidebar__title">Search</h3>
                                <form action="#" className="sidebar__search-form">
                                    <input type="search" placeholder="Search.." />
                                    <button type="submit">
                                    <i className="fas fa-search" />
                                    </button>
                                </form>
                                </div>
                                <div className="sidebar__single sidebar__post">
                                <h3 className="sidebar__title">Latest Blogs</h3>
                                <ul className="sidebar__post-list list-unstyled">
                                    <li>
                                    <div className="sidebar__post-image">
                                        <img src="assets/images/blog/lp-1-1.jpg" alt="" />
                                    </div>
                                    <div className="sidebar__post-content">
                                        <p className="sidebar__post-date">
                                        <i className="icon-calender" />
                                        Jan 10,2022
                                        </p>
                                        <h3>
                                        <Link href="/blog-details">
                                            Optimize your logistics with our expertise
                                        </Link>
                                        </h3>
                                    </div>
                                    </li>
                                    <li>
                                    <div className="sidebar__post-image">
                                        <img src="assets/images/blog/lp-1-2.jpg" alt="" />
                                    </div>
                                    <div className="sidebar__post-content">
                                        <p className="sidebar__post-date">
                                        <i className="icon-calender" />
                                        Jan 10,2022
                                        </p>
                                        <h3>
                                        <Link href="/blog-details">
                                            We make logistics easy for your business
                                        </Link>
                                        </h3>
                                    </div>
                                    </li>
                                    <li>
                                    <div className="sidebar__post-image">
                                        <img src="assets/images/blog/lp-1-3.jpg" alt="" />
                                    </div>
                                    <div className="sidebar__post-content">
                                        <p className="sidebar__post-date">
                                        <i className="icon-calender" />
                                        Jan 10,2022
                                        </p>
                                        <h3>
                                        <Link href="/blog-details">
                                            Your one-stop solution for services
                                        </Link>
                                        </h3>
                                    </div>
                                    </li>
                                </ul>
                                </div>
                                <div className="sidebar__single sidebar__category">
                                <h3 className="sidebar__title">Category</h3>
                                <ul className="sidebar__category-list list-unstyled">
                                    <li>
                                    <div className="icon">
                                        <span className="icon-dabble-arrow" />
                                    </div>
                                    <Link href="#">
                                        Express Freight Solutions<span>(02)</span>
                                    </Link>
                                    </li>
                                    <li>
                                    <div className="icon">
                                        <span className="icon-dabble-arrow" />
                                    </div>
                                    <Link href="#">
                                        QuickMove Logistics<span>(02)</span>
                                    </Link>
                                    </li>
                                    <li>
                                    <div className="icon">
                                        <span className="icon-dabble-arrow" />
                                    </div>
                                    <Link href="#">
                                        Speedy Dispatch<span>(02)</span>
                                    </Link>
                                    </li>
                                    <li>
                                    <div className="icon">
                                        <span className="icon-dabble-arrow" />
                                    </div>
                                    <Link href="#">
                                        Swift Supply Chain<span>(02)</span>
                                    </Link>
                                    </li>
                                </ul>
                                </div>
                                <div className="sidebar__single sidebar__tags">
                                <h3 className="sidebar__title">Tags</h3>
                                <div className="sidebar__tags-list">
                                    <Link href="#">Prime Movers</Link>
                                    <Link href="#">Dispatch</Link>
                                    <Link href="#">Logistics</Link>
                                    <Link href="#">Shipping</Link>
                                    <Link href="#">Cargo</Link>
                                    <Link href="#">Reliable Third</Link>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*Blog Page End*/}

                  
                    {/*CTA One Start*/}
                    <section className="cta-one cta-two">
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
                                    <Link href="tel:3075550133">(307) 555-0133</Link>
                                </h3>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                    {/*CTA One End*/}



                </div>

            </Layout>
        </>
    )
}