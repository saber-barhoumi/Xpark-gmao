
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Blog_Details">

            {/*Blog Details Start*/}
            <section className="blog-details">
                <div className="container">
                <div className="row">
                    <div className="col-xl-8 col-lg-7">
                    <div className="blog-details__left">
                        <div className="blog-details__img">
                        <img src="assets/images/blog/blog-details-img-1.jpg" alt="" />
                        </div>
                        <div className="blog-details__content">
                        <ul className="blog-details__meta list-unstyled">
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
                        <h3 className="blog-details__title-1">
                            Efficiently moving your goods
                        </h3>
                        <p className="blog-details__text-1">
                            Construction is an essential industry that involves building and
                            designing structures such as buildings r bridges, and more. It
                            requires skilled workers, materials, and careful planning to
                            ensure successful{" "}
                        </p>
                        <p className="blog-details__text-2">
                            Construction is an essential industry that involves building and
                            designing structures such as buildings bridges, and more. It
                            requires skilled workers, materials, and careful planning to
                            ensure successful Construction is an the a essential industry
                            that involves building and designing structures such as
                            buildings roa bridge
                        </p>
                        <div className="blog-details__client-box">
                            <div className="blog-details__quote">
                            <span className="icon-quote" />
                            </div>
                            <p className="blog-details__client-text">
                            Construction is an essential industry that involves building
                            and designing structures such as buildings r bridges, and
                            more. It requires skilled workers, materials
                            </p>
                            <h4 className="blog-details__client-name">SHAkib Al Hasan</h4>
                            <p className="blog-details__client-sub-title">
                            Logistics Solutions
                            </p>
                            <div className="blog-details__client-ratting">
                            <span className="icon-star" />
                            <span className="icon-star" />
                            <span className="icon-star" />
                            <span className="icon-star" />
                            <span className="icon-star icon-star-two" />
                            </div>
                        </div>
                        <h3 className="blog-details__title-2">
                            Keep your free time free!
                        </h3>
                        <p className="blog-details__text-3">
                            Construction is an essential industry that involves building and
                            designing structures such as buildings roa bridges, and more. It
                            requires skilled workers, materials, and careful planning to
                            ensure successful{" "}
                        </p>
                        <div className="blog-details__points-box">
                            <ul className="blog-details__points-list list-unstyled">
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Efficiently moving your goods, every time.</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Streamline your supply chain with our logistics</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Trust us for reliable and cost-effective logistics</p>
                            </li>
                            </ul>
                            <ul className="blog-details__points-list list-unstyled">
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Delivering your goods with precision</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Optimize your logistics with our expertise.</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>our one-stop solution for logistics</p>
                            </li>
                            </ul>
                        </div>
                        <div className="blog-details__img-box">
                            <div className="blog-details__img-box-img">
                            <img
                                src="assets/images/blog/blog-details-img-box-img-1.jpg"
                                alt=""
                            />
                            </div>
                            <div className="blog-details__img-box-img">
                            <img
                                src="assets/images/blog/blog-details-img-box-img-2.jpg"
                                alt=""
                            />
                            </div>
                            <div className="blog-details__img-box-img">
                            <img
                                src="assets/images/blog/blog-details-img-box-img-3.jpg"
                                alt=""
                            />
                            </div>
                        </div>
                        <p className="blog-details__text-4">
                            Logistics service involves the planning, implementation, and
                            control of the efficient and effective the a ama the
                            transportation, storage, and distribution of goods and materials
                        </p>
                        <div className="blog-details__tag-and-social">
                            <div className="blog-details__tag-box">
                            <span>Tags:</span>
                            <Link href="/blog-details">Swift Supply Chain</Link>
                            <Link href="/blog-details">Speedy Dispatch</Link>
                            </div>
                            <div className="blog-details__social">
                            <Link href="/blog-details">
                                <span className="icon-facebook-f" />
                            </Link>
                            <Link href="/blog-details">
                                <span className="icon-instagram" />
                            </Link>
                            <Link href="/blog-details">
                                <span className="icon-Vector" />
                            </Link>
                            <Link href="/blog-details">
                                <span className="icon-linkedin-in" />
                            </Link>
                            </div>
                        </div>
                        <div className="blog-details__pagenation-box">
                            <ul className="list-unstyled blog-details__pagenation">
                            <li>
                                <div className="icon">
                                <Link href="#">
                                    <span className="icon-arrow-left" />
                                </Link>
                                </div>
                                <p>
                                More Care
                                <br /> places
                                </p>
                            </li>
                            <li>
                                <p>
                                Mastering
                                <br /> the Art
                                </p>
                                <div className="icon">
                                <Link href="#">
                                    <span className="icon-arrow-right" />
                                </Link>
                                </div>
                            </li>
                            </ul>
                        </div>
                        </div>
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
            {/*Blog Details End*/}


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


            </Layout>
        </>
    )
}
