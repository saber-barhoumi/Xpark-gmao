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
                    Ahmed Ben Salah
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Directeur logistique
                </p>
                <p className="testimonial-one__text">
                    XPARK assure nos livraisons depuis plus d'un an. Les délais sont toujours respectés et l'équipe est très réactive. Un vrai partenaire de confiance pour notre activité.
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
                    Leïla Trabelsi
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Responsable achats
                </p>
                <p className="testimonial-one__text">
                    Un service sérieux et professionnel. Nos marchandises arrivent toujours en parfait état et le suivi des livraisons est très appréciable au quotidien.
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
                    Mohamed Gharbi
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Gérant de société
                </p>
                <p className="testimonial-one__text">
                    Nous faisons appel à XPARK pour nos transports réguliers entre les régions. La flotte est moderne et les chauffeurs sont très professionnels.
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
                    Sonia Mansour
                </h3>
                <p className="testimonial-one__client-sub-title">
                    Directrice commerciale
                </p>
                <p className="testimonial-one__text">
                    Une équipe à l'écoute qui s'adapte à nos besoins. La solution de transport personnalisé nous a permis d'optimiser nos coûts logistiques.
                </p>
                </div>
            </SwiperSlide>
            {/*Testimonial One Single End*/}
            </div>
        </Swiper>
      </>
      
    )
}
