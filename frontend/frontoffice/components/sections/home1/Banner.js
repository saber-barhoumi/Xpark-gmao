
'use client'
import Link from "next/link"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 1,
    loop: true,
    effect: "fade",
    pagination: {
    el: "#main-slider-pagination",
    type: "bullets",
    clickable: true
    },
    navigation: {
    nextEl: "#main-slider__swiper-button-next",
    prevEl: "#main-slider__swiper-button-prev"
    },
    autoplay: {
        delay: 8000
    }
}

export default function Banner() {
    return (
       
        <>
        {/* banner-one */}
        <section className="main-slider">
            <Swiper {...swiperOptions} className="swiper-container thm-swiper__slider">
            <div className="swiper-wrapper">
              <SwiperSlide className="swiper-slide">
                <div
                  className="main-slider__bg"
                  style={{ backgroundImage: "url(assets/images/backgrounds/slider-1-1.jpg)" }}
                />
                <div className="main-slider__shape-1" />
                <div className="main-slider__shape-2" />
                <div className="main-slider__shape-3" />
                <div className="main-slider__shape-4" />
                <div className="container">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="main-slider__content">
                        <div className="main-slider__sub-title-box">
                          <div className="main-slider__sub-title-icon">
                            <img
                              src="assets/images/icon/main-slider-sub-title-icon.png"
                              alt=""
                            />
                          </div>
                          <p className="main-slider__sub-title">Transport &amp; Logistique</p>
                        </div>
                        <h2 className="main-slider__title">
                          Votre partenaire <span>de confiance</span> <br /> pour le transport de marchandises
                        </h2>
                        <p className="main-slider__text">
                          XPARK vous accompagne avec une flotte de véhicules performante pour transporter <br /> vos marchandises en toute sécurité et dans les meilleurs délais.
                        </p>
                        <div className="main-slider__btn-and-call-box">
                          <div className="main-slider__btn-box">
                            <Link href="/account/reserver" className="thm-btn main-slider__btn">
                              Demander un devis
                              <span />
                            </Link>
                          </div>
                          <div className="main-slider__call">
                            <div className="main-slider__call-icon">
                              <span className="icon-phone" />
                            </div>
                            <div className="main-slider__call-number">
                              <p>Nous contacter</p>
                              <h5>
                                <Link href="tel:+21670000000">+216 70 000 000</Link>
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>

              <SwiperSlide className="swiper-slide">
                <div
                  className="main-slider__bg"
                  style={{ backgroundImage: "url(assets/images/backgrounds/slider-1-2.jpg)" }}
                />
                <div className="main-slider__shape-1" />
                <div className="main-slider__shape-2" />
                <div className="main-slider__shape-3" />
                <div className="main-slider__shape-4" />
                <div className="container">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="main-slider__content">
                        <div className="main-slider__sub-title-box">
                          <div className="main-slider__sub-title-icon">
                            <img
                              src="assets/images/icon/main-slider-sub-title-icon.png"
                              alt=""
                            />
                          </div>
                          <p className="main-slider__sub-title">Transport &amp; Logistique</p>
                        </div>
                        <h2 className="main-slider__title">
                          Votre partenaire <span>de confiance</span> <br /> pour le transport de marchandises
                        </h2>
                        <p className="main-slider__text">
                          XPARK vous accompagne avec une flotte de véhicules performante pour transporter <br /> vos marchandises en toute sécurité et dans les meilleurs délais.
                        </p>
                        <div className="main-slider__btn-and-call-box">
                          <div className="main-slider__btn-box">
                            <Link href="/account/reserver" className="thm-btn main-slider__btn">
                              Demander un devis
                              <span />
                            </Link>
                          </div>
                          <div className="main-slider__call">
                            <div className="main-slider__call-icon">
                              <span className="icon-phone" />
                            </div>
                            <div className="main-slider__call-number">
                              <p>Nous contacter</p>
                              <h5>
                                <Link href="tel:+21670000000">+216 70 000 000</Link>
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>

              <SwiperSlide className="swiper-slide">
                <div
                  className="main-slider__bg"
                  style={{ backgroundImage: "url(assets/images/backgrounds/slider-1-3.jpg)" }}
                />
                <div className="main-slider__shape-1" />
                <div className="main-slider__shape-2" />
                <div className="main-slider__shape-3" />
                <div className="main-slider__shape-4" />
                <div className="container">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="main-slider__content">
                        <div className="main-slider__sub-title-box">
                          <div className="main-slider__sub-title-icon">
                            <img
                              src="assets/images/icon/main-slider-sub-title-icon.png"
                              alt=""
                            />
                          </div>
                          <p className="main-slider__sub-title">Transport &amp; Logistique</p>
                        </div>
                        <h2 className="main-slider__title">
                          Votre partenaire <span>de confiance</span> <br /> pour le transport de marchandises
                        </h2>
                        <p className="main-slider__text">
                          XPARK vous accompagne avec une flotte de véhicules performante pour transporter <br /> vos marchandises en toute sécurité et dans les meilleurs délais.
                        </p>
                        <div className="main-slider__btn-and-call-box">
                          <div className="main-slider__btn-box">
                            <Link href="/account/reserver" className="thm-btn main-slider__btn">
                              Demander un devis
                              <span />
                            </Link>
                          </div>
                          <div className="main-slider__call">
                            <div className="main-slider__call-icon">
                              <span className="icon-phone" />
                            </div>
                            <div className="main-slider__call-number">
                              <p>Nous contacter</p>
                              <h5>
                                <Link href="tel:+21670000000">+216 70 000 000</Link>
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>

              <SwiperSlide className="swiper-slide">
                <div
                  className="main-slider__bg"
                  style={{ backgroundImage: "url(assets/images/backgrounds/slider-1-1.jpg)" }}
                />
                <div className="main-slider__shape-1" />
                <div className="main-slider__shape-2" />
                <div className="main-slider__shape-3" />
                <div className="main-slider__shape-4" />
                <div className="container">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="main-slider__content">
                        <div className="main-slider__sub-title-box">
                          <div className="main-slider__sub-title-icon">
                            <img
                              src="assets/images/icon/main-slider-sub-title-icon.png"
                              alt=""
                            />
                          </div>
                          <p className="main-slider__sub-title">Transport &amp; Logistique</p>
                        </div>
                        <h2 className="main-slider__title">
                          Votre partenaire <span>de confiance</span> <br /> pour le transport de marchandises
                        </h2>
                        <p className="main-slider__text">
                          XPARK vous accompagne avec une flotte de véhicules performante pour transporter <br /> vos marchandises en toute sécurité et dans les meilleurs délais.
                        </p>
                        <div className="main-slider__btn-and-call-box">
                          <div className="main-slider__btn-box">
                            <Link href="/account/reserver" className="thm-btn main-slider__btn">
                              Demander un devis
                              <span />
                            </Link>
                          </div>
                          <div className="main-slider__call">
                            <div className="main-slider__call-icon">
                              <span className="icon-phone" />
                            </div>
                            <div className="main-slider__call-number">
                              <p>Nous contacter</p>
                              <h5>
                                <Link href="tel:+21670000000">+216 70 000 000</Link>
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            </div>
          </Swiper>
          <div className="swiper-pagination" id="main-slider-pagination" />

        </section>
        {/* banner-one */}
      </>
    )
}
