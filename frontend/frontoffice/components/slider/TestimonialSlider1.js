'use client'
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 1, 
    spaceBetween: 0,
    speed: 2000,
    loop: true,
    pagination: {
        el: ".swiper-dot-style1",
        type: "bullets",
        clickable: true
    },

    

    navigation: {
        nextEl: ".swiper-button-prev1",
        prevEl: ".swiper-button-next1"
    },
    autoplay: { delay: 9000 },
    breakpoints: {
            0: {
                spaceBetween: 0,
                slidesPerView: 1
            },
            375: {
                spaceBetween: 0,
                slidesPerView: 1
            },
            575: {
                spaceBetween: 0,
                slidesPerView: 1
            },
            768: {
                spaceBetween: 30,
                slidesPerView: 1
            },
            992: {
                spaceBetween: 30,
                slidesPerView: 1
            },
            1200: {
                spaceBetween: 30,
                slidesPerView:1
            },
            1320: {
                spaceBetween: 30,
                slidesPerView:1
            }
                                        
    }
}
export default function TestimonialSlider1() {
    return (
        <> 
        
        <Swiper {...swiperOptions} className="thm-swiper__slider swiper-container">
            <div className="swiper-wrapper">
            {/*Testimonial One Single Start*/}
            <SwiperSlide className="swiper-slide">
                <div className="testimonial-one__single">
                <div className="testimonial-one__quote">
                    <span className="icon-quote" />
                </div>
                <div className="testimonial-one__client-img">
                    <img
                    src="assets/images/testimonial/testimonial-1-1.jpg"
                    alt=""
                    />
                </div>
                <div className="testimonial-one__ratting">
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star last-star" />
                </div>
                <h3 className="testimonial-one__client-name">
                    Nafiz Bhuiyan
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Manegar
                </p>
                <p className="testimonial-one__text">
                    Logistic service involves the planning implementation an
                    and control of the efficient and effective movement and
                    storage of goods and materials Logistic service involves
                    the planning implementation and control
                </p>
                </div>
            </SwiperSlide>
            {/*Testimonial One Single End*/}
            {/*Testimonial One Single Start*/}
            <SwiperSlide className="swiper-slide">
                <div className="testimonial-one__single">
                <div className="testimonial-one__quote">
                    <span className="icon-quote" />
                </div>
                <div className="testimonial-one__client-img">
                    <img
                    src="assets/images/testimonial/testimonial-1-2.jpg"
                    alt=""
                    />
                </div>
                <div className="testimonial-one__ratting">
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star last-star" />
                </div>
                <h3 className="testimonial-one__client-name">
                    Robert Son
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Manegar
                </p>
                <p className="testimonial-one__text">
                    Logistic service involves the planning implementation an
                    and control of the efficient and effective movement and
                    storage of goods and materials Logistic service involves
                    the planning implementation and control
                </p>
                </div>
            </SwiperSlide>
            {/*Testimonial One Single End*/}
            {/*Testimonial One Single Start*/}
            <SwiperSlide className="swiper-slide">
                <div className="testimonial-one__single">
                <div className="testimonial-one__quote">
                    <span className="icon-quote" />
                </div>
                <div className="testimonial-one__client-img">
                    <img
                    src="assets/images/testimonial/testimonial-1-3.jpg"
                    alt=""
                    />
                </div>
                <div className="testimonial-one__ratting">
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star last-star" />
                </div>
                <h3 className="testimonial-one__client-name">
                    Harbert Spin
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Manegar
                </p>
                <p className="testimonial-one__text">
                    Logistic service involves the planning implementation an
                    and control of the efficient and effective movement and
                    storage of goods and materials Logistic service involves
                    the planning implementation and control
                </p>
                </div>
            </SwiperSlide>
            {/*Testimonial One Single End*/}
            {/*Testimonial One Single Start*/}
            <SwiperSlide className="swiper-slide">
                <div className="testimonial-one__single">
                <div className="testimonial-one__quote">
                    <span className="icon-quote" />
                </div>
                <div className="testimonial-one__client-img">
                    <img
                    src="assets/images/testimonial/testimonial-1-4.jpg"
                    alt=""
                    />
                </div>
                <div className="testimonial-one__ratting">
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star" />
                    <span className="icon-star last-star" />
                </div>
                <h3 className="testimonial-one__client-name">
                    Mainto Vula
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Manegar
                </p>
                <p className="testimonial-one__text">
                    Logistic service involves the planning implementation an
                    and control of the efficient and effective movement and
                    storage of goods and materials Logistic service involves
                    the planning implementation and control
                </p>
                </div>
            </SwiperSlide>
            {/*Testimonial One Single End*/}
            </div>
        </Swiper>
      </>
      
    )
}
