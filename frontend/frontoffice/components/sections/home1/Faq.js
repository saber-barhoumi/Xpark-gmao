'use client'
import Link from "next/link"
import { useState } from 'react'
export default function Faq() {
    const [isActive, setIsActive] = useState({
        status: false,
        key: 1,
    })

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            })
        } else {
            setIsActive({
                status: true,
                key,
            })
        }
    }
    return (
        <>
            {/*FAQ One Start*/}
            <section className="faq-one">
                <div className="faq-one__bg-color" />
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6 col-lg-6">
                            <div className="faq-one__left">
                                <div className="section-title text-left">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">FAQ</span>
                                    </div>
                                    <h2 className="section-title__title">
                                        Do You Have Any
                                        <br /> Question Please?
                                    </h2>
                                </div>
                                <div
                                    className="accrodion-grp faq-one-accrodion"
                                    data-grp-name="faq-one-accrodion-1"
                                    >
                                    <div className={isActive.key == 1 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(1)}>
                                        <div className="accrodion-title">
                                        <h4>How can I track my shipment?</h4>
                                        </div>
                                        <div className={isActive.key == 1 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                            <p>
                                            It is a long established fact that a reader will be distr
                                            acted bioiiy the real ism dablea content of a page when
                                            looking at its layout{" "}
                                            </p>
                                        </div>
                                        </div>
                                        <div className="faq-page__count"></div>
                                    </div>
                                    <div className={isActive.key == 2 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(2)}>
                                        <div className="accrodion-title">
                                        <h4>What is the average delivery time?</h4>
                                        </div>
                                        <div className={isActive.key == 2 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                                <p>
                                                It is a long established fact that a reader will be distr
                                                acted bioiiy the real ism dablea content of a page when
                                                looking at its layout{" "}
                                                </p>
                                        </div>
                                        </div>
                                        <div className="faq-page__count"></div>
                                    </div>
                                    <div className={isActive.key == 3 ? "accrodion active" : "accrodion"} onClick={() => handleToggle(3)}>
                                        <div className="accrodion-title">
                                        <h4>Do you offer Smooth Running Supply?</h4>
                                        </div>
                                        <div className={isActive.key == 3 ? "accrodion-content current" : "accrodion-content"}>
                                            <div className="inner">
                                                <p>
                                                It is a long established fact that a reader will be distr
                                                acted bioiiy the real ism dablea content of a page when
                                                looking at its layout{" "}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="faq-page__count"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6">
                        <div
                            className="faq-one__right wow fadeInRight"
                            data-wow-delay="300ms"
                        >
                            <h3 className="faq-one__from-title">
                            Our One-Stop Car Repair Shop
                            </h3>
                            <form
                            className="contact-form-validated faq-one__form"
                            action="assets/inc/sendemail.php"
                            method="post"
                            noValidate="novalidate"
                            >
                            <div className="row">
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <input
                                    type="text"
                                    name="name"
                                    placeholder="Your Name"
                                    required=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <input
                                    type="email"
                                    name="email"
                                    placeholder="Your Email"
                                    required=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <input
                                    type="text"
                                    name="text"
                                    placeholder="Phone Number"
                                    required=""
                                    />
                                </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                <div className="faq-one__input-box">
                                    <div className="select-box">
                                        <select defaultValue="Choose a Option" className="selectmenu wide">
                                            <option>Choose a Option</option>
                                            <option>Type Of Service 01</option>
                                            <option>Type Of Service 02</option>
                                            <option>Type Of Service 03</option>
                                            <option>Type Of Service 04</option>
                                            <option>Type Of Service 05</option>
                                            <option>Type Of Service 06</option>
                                        </select>
                                    </div>
                                </div>
                                </div>
                                <div className="col-xl-12">
                                <div className="faq-one__input-box text-message-box">
                                    <textarea
                                    name="message"
                                    placeholder="Message here.."
                                    defaultValue={""}
                                    />
                                </div>
                                </div>
                                <div className=" col-xl-12">
                                <div className="faq-one__btn-box">
                                    <button type="submit" className="thm-btn faq-one__btn">
                                    Submit Now
                                    <span />
                                    </button>
                                </div>
                                </div>
                            </div>
                            </form>
                            <div className="result" />
                        </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*FAQ One End*/}
        </>


    )
}
