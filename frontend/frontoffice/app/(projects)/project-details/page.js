
import Layout from "@/components/layout/Layout"
import Link from "next/link"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Project_Details">

            <div>
                {/*Project Details Start*/}
                <section className="project-details">
                    <div className="container">
                    <div className="row">
                        <div className="col-xl-4">
                        <div className="project-details__left">
                            <div className="project-details__information">
                            <h3 className="project-details__information-title">
                                Project Information
                            </h3>
                            <ul className="project-details__information-list list-unstyled">
                                <li>
                                <span>Category:</span>
                                <p>Logistics</p>
                                </li>
                                <li>
                                <span>Customer:</span>
                                <p>Starline shimlasi</p>
                                </li>
                                <li>
                                <span>Start date: </span>
                                <p>1 March 2024</p>
                                </li>
                                <li>
                                <span>End date:</span>
                                <p>28 September 2025</p>
                                </li>
                                <li>
                                <span>Rating:</span>
                                <p>
                                    <i className="icon-star" />
                                    <i className="icon-star" />
                                    <i className="icon-star" />
                                    <i className="icon-star" />
                                    <i className="icon-star last-icon" />
                                </p>
                                </li>
                            </ul>
                            <div className="project-details__social">
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
                            <ul className="project-details__contact-list list-unstyled">
                            <li>
                                <div className="icon">
                                <span className="icon-location icon-1" />
                                </div>
                                <div className="content">
                                <h3>Address</h3>
                                <p>
                                    Dhaka 102, 8000 sent behaibior
                                    <br /> road 45 house of street
                                </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-call icon-2" />
                                </div>
                                <div className="content">
                                <h3>Lets Talk us</h3>
                                <p>
                                    Phone number:{" "}
                                    <Link href="tel:32566800890">+32566 - 800 - 890</Link>
                                </p>
                                <p>
                                    Fax: <Link href="tel:123458963007">1234 -58963 - 007</Link>
                                </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-envolop icon-3" />
                                </div>
                                <div className="content">
                                <h3>Send us email</h3>
                                <p>
                                    <Link href="mailto:nafiz1223@gmail.com">nafiz1223@gmail.com</Link>
                                    <Link href="nafiz1223@gmail.com">
                                    {" "}
                                    fahad
                                    <br /> demo23yourmail.com
                                    </Link>
                                </p>
                                </div>
                            </li>
                            </ul>
                        </div>
                        </div>
                        <div className="col-xl-8">
                        <div className="project-details__right">
                            <div className="project-details__img">
                            <img
                                src="assets/images/project/project-details-img-1.jpg"
                                alt=""
                            />
                            </div>
                            <h3 className="project-details__title-1">
                            Cultivate Success with Agriculture
                            </h3>
                            <p className="project-details__text-1">
                            Logistics service involves the planning, implementation, and
                            control of the efficient and effective transportation, storage,
                            and distribution of goods and materials Logistics service involves
                            the planning
                            </p>
                            <p className="project-details__text-2">
                            Logistics service involves the planning, implementation, and
                            control of the efficient and effective transportation, storage,
                            and distribution of goods and materials Logistics service involves
                            the planning Logistics servi involves the planning,
                            implementation, and control of the efficient and effective
                            transportation
                            </p>
                            <ul className="project-details__points list-unstyled">
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>
                                Trust us for reliable and cost-effective logistics solutions
                                </p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p> Delivering your goods with precision and care.</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Your one-stop solution for logistics services.</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>We make logistics easy for your business.</p>
                            </li>
                            <li>
                                <div className="icon">
                                <span className="icon-dabble-arrow" />
                                </div>
                                <p>Optimize your logistics with our expertise.</p>
                            </li>
                            </ul>
                            <div className="project-details__img-box">
                            <div className="row">
                                <div className="col-xl-6">
                                <div className="project-details__img-box-img">
                                    <img
                                    src="assets/images/project/project-details-img-box-img-1.jpg"
                                    alt=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6">
                                <div className="project-details__img-box-img">
                                    <img
                                    src="assets/images/project/project-details-img-box-img-2.jpg"
                                    alt=""
                                    />
                                </div>
                                </div>
                            </div>
                            </div>
                            <p className="project-details__text-3">
                            Logistics service involves the planning, implementation, and
                            control of the efficient and effective transportation, storage,
                            and distribution of goods and materials Logistics service involves
                            the planning
                            </p>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>
                {/*Project Details End*/}

               
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
