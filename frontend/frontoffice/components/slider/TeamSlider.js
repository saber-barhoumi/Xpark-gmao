'use client'
import Link from "next/link"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 2,
    spaceBetween: 30,
    speed: 2000,
    autoplay: {
        delay: 9000,
        disableOnInteraction: false,
    },
    loop: true,

    // Navigation
    navigation: {
        nextEl: ".swiper-button-prev1",
        prevEl: ".swiper-button-next1"
    },

    // Pagination
    pagination: {
        el: ".swiper-dot-style1",
        type: "bullets",
        clickable: true
    },

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
            slidesPerView: 2
        },
        1200: {
            spaceBetween: 30,
            slidesPerView:3
        },
        1320: {
            spaceBetween: 30,
            slidesPerView:3
        }
    }
}
export default function TeamSlider() {
    return (
        <> 
        
        <Swiper {...swiperOptions} className="thm-swiper__slider swiper-container">
            <div className="swiper-wrapper">
                {/*Team One Single Start*/}
                <SwiperSlide className="swiper-slide">
                <div className="team-one__single">
                    <div className="team-one__img">
                    <img src="assets/images/team/team-1-1.jpg" alt="" />
                    </div>
                    <div className="team-one__content">
                    <h3 className="team-one__title">
                        <Link href="/team-details">Brooklyn Simmons</Link>
                    </h3>
                    <p className="team-one__sub-title">Quick Cargo</p>
                    <div className="team-one__social">
                        <Link href="#">
                        <span className="icon-instagram" />
                        </Link>
                        <Link href="#">
                        <span className="icon-linkedin-in" />
                        </Link>
                        <Link href="#">
                        <span className="icon-Vector" />
                        </Link>
                        <Link href="#">
                        <span className="icon-facebook-f" />
                        </Link>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
                {/*Team One Single End*/}
                {/*Team One Single Start*/}
                <SwiperSlide className="swiper-slide">
                <div className="team-one__single">
                    <div className="team-one__img">
                    <img src="assets/images/team/team-1-2.jpg" alt="" />
                    </div>
                    <div className="team-one__content">
                    <h3 className="team-one__title">
                        <Link href="/team-details">Sakib Hasan</Link>
                    </h3>
                    <p className="team-one__sub-title">Speedy Trans</p>
                    <div className="team-one__social">
                        <Link href="#">
                        <span className="icon-instagram" />
                        </Link>
                        <Link href="#">
                        <span className="icon-linkedin-in" />
                        </Link>
                        <Link href="#">
                        <span className="icon-Vector" />
                        </Link>
                        <Link href="#">
                        <span className="icon-facebook-f" />
                        </Link>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
                {/*Team One Single End*/}
                {/*Team One Single Start*/}
                <SwiperSlide className="swiper-slide">
                <div className="team-one__single">
                    <div className="team-one__img">
                    <img src="assets/images/team/team-1-3.jpg" alt="" />
                    </div>
                    <div className="team-one__content">
                    <h3 className="team-one__title">
                        <Link href="/team-details">Fahda Hossain</Link>
                    </h3>
                    <p className="team-one__sub-title">Efficient Transport</p>
                    <div className="team-one__social">
                        <Link href="#">
                        <span className="icon-instagram" />
                        </Link>
                        <Link href="#">
                        <span className="icon-linkedin-in" />
                        </Link>
                        <Link href="#">
                        <span className="icon-Vector" />
                        </Link>
                        <Link href="#">
                        <span className="icon-facebook-f" />
                        </Link>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
                {/*Team One Single End*/}
                {/*Team One Single Start*/}
                <SwiperSlide className="swiper-slide">
                <div className="team-one__single">
                    <div className="team-one__img">
                    <img src="assets/images/team/team-1-1.jpg" alt="" />
                    </div>
                    <div className="team-one__content">
                    <h3 className="team-one__title">
                        <Link href="/team-details">Brooklyn Simmons</Link>
                    </h3>
                    <p className="team-one__sub-title">Quick Cargo</p>
                    <div className="team-one__social">
                        <Link href="#">
                        <span className="icon-instagram" />
                        </Link>
                        <Link href="#">
                        <span className="icon-linkedin-in" />
                        </Link>
                        <Link href="#">
                        <span className="icon-Vector" />
                        </Link>
                        <Link href="#">
                        <span className="icon-facebook-f" />
                        </Link>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
                {/*Team One Single End*/}
                {/*Team One Single Start*/}
                <SwiperSlide className="swiper-slide">
                <div className="team-one__single">
                    <div className="team-one__img">
                    <img src="assets/images/team/team-1-2.jpg" alt="" />
                    </div>
                    <div className="team-one__content">
                    <h3 className="team-one__title">
                        <Link href="/team-details">Sakib Hasan</Link>
                    </h3>
                    <p className="team-one__sub-title">Speedy Trans</p>
                    <div className="team-one__social">
                        <Link href="#">
                        <span className="icon-instagram" />
                        </Link>
                        <Link href="#">
                        <span className="icon-linkedin-in" />
                        </Link>
                        <Link href="#">
                        <span className="icon-Vector" />
                        </Link>
                        <Link href="#">
                        <span className="icon-facebook-f" />
                        </Link>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
                {/*Team One Single End*/}
                {/*Team One Single Start*/}
                <SwiperSlide className="swiper-slide">
                <div className="team-one__single">
                    <div className="team-one__img">
                    <img src="assets/images/team/team-1-3.jpg" alt="" />
                    </div>
                    <div className="team-one__content">
                    <h3 className="team-one__title">
                        <Link href="/team-details">Fahda Hossain</Link>
                    </h3>
                    <p className="team-one__sub-title">Efficient Transport</p>
                    <div className="team-one__social">
                        <Link href="#">
                        <span className="icon-instagram" />
                        </Link>
                        <Link href="#">
                        <span className="icon-linkedin-in" />
                        </Link>
                        <Link href="#">
                        <span className="icon-Vector" />
                        </Link>
                        <Link href="#">
                        <span className="icon-facebook-f" />
                        </Link>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
                {/*Team One Single End*/}
            </div>
        </Swiper>
      </>
      
    )
}
