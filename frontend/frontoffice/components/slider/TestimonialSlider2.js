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
export default function TestimonialSlider2() {
    return (
        <>
            <Swiper {...swiperOptions} className="thm-swiper__slider swiper-container">
                
                <div className="swiper-wrapper">
                {/*Testimonial Two Single Start*/}
                <SwiperSlide className="swiper-slide">
                  <div className="testimonial-two__single">
                    <div className="testimonial-two__quote">
                      <span className="icon-quote" />
                    </div>
                    <h3 className="testimonial-two__client-name">Sakib Hasan</h3>
                    <p className="testimonial-two__sub-title">Developer</p>
                    <p className="testimonial-two__text">
                      This category Dantal his category Danta Their product exceeded
                      expectationsa a quality a attention to moutstandin an and it
                      has essential most design man Billboard advertising is a power
                      marketing tool that he businesBillboard advertising is a
                      powerful marketing tool business and reach their target
                      audienceses gain{" "}
                    </p>
                    <div className="testimonial-two__client-img">
                      <img
                        src="assets/images/testimonial/testimonial-2-1.jpg"
                        alt=""
                      />
                    </div>
                    <div className="testimonial-two__ratting">
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star last-icon" />
                    </div>
                  </div>
                </SwiperSlide>
                {/*Testimonial Two Single End*/}
                {/*Testimonial Two Single Start*/}
                <SwiperSlide className="swiper-slide">
                  <div className="testimonial-two__single">
                    <div className="testimonial-two__quote">
                      <span className="icon-quote" />
                    </div>
                    <h3 className="testimonial-two__client-name">Sakib Hasan</h3>
                    <p className="testimonial-two__sub-title">Developer</p>
                    <p className="testimonial-two__text">
                      This category Dantal his category Danta Their product exceeded
                      expectationsa a quality a attention to moutstandin an and it
                      has essential most design man Billboard advertising is a power
                      marketing tool that he businesBillboard advertising is a
                      powerful marketing tool business and reach their target
                      audienceses gain{" "}
                    </p>
                    <div className="testimonial-two__client-img">
                      <img
                        src="assets/images/testimonial/testimonial-2-1.jpg"
                        alt=""
                      />
                    </div>
                    <div className="testimonial-two__ratting">
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star last-icon" />
                    </div>
                  </div>
                </SwiperSlide>
                {/*Testimonial Two Single End*/}
                {/*Testimonial Two Single Start*/}
                <SwiperSlide className="swiper-slide">
                  <div className="testimonial-two__single">
                    <div className="testimonial-two__quote">
                      <span className="icon-quote" />
                    </div>
                    <h3 className="testimonial-two__client-name">Sakib Hasan</h3>
                    <p className="testimonial-two__sub-title">Developer</p>
                    <p className="testimonial-two__text">
                      This category Dantal his category Danta Their product exceeded
                      expectationsa a quality a attention to moutstandin an and it
                      has essential most design man Billboard advertising is a power
                      marketing tool that he businesBillboard advertising is a
                      powerful marketing tool business and reach their target
                      audienceses gain{" "}
                    </p>
                    <div className="testimonial-two__client-img">
                      <img
                        src="assets/images/testimonial/testimonial-2-1.jpg"
                        alt=""
                      />
                    </div>
                    <div className="testimonial-two__ratting">
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star" />
                      <span className="icon-star last-icon" />
                    </div>
                  </div>
                </SwiperSlide>
                {/*Testimonial Two Single End*/}
              </div>
            </Swiper>
        </>
    )
}
