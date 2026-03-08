import bannerOne from "@/data/bannerOne";
import useActive from "@/hooks/useActive";
import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const { slides } = bannerOne;

const BannerOne = () => {
  const ref = useActive("#home");

  return (
    <section ref={ref} className="hero-carousel" id="home">
      {/* Background image carousel */}
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        autoplay={{
          delay: 5500,
          disableOnInteraction: false,
        }}
        loop={true}
        pagination={{
          clickable: true,
          el: ".hero-carousel__pagination",
        }}
        speed={1000}
        className="hero-carousel__swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className={`hero-carousel__slide hero-carousel__slide--${slide.id}`}>
            <div className="hero-carousel__overlay"></div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Fixed content overlay */}
      <div className="hero-carousel__content">
        <span className="hero-carousel__brand">Osassy&apos;s Kitchen</span>
        <h1 className="hero-carousel__title">
          Authentic Nigerian Meals<br />Delivered Weekly
        </h1>
        <p className="hero-carousel__tagline">
          Freshly cooked dishes like jollof rice, ayamase and egusi delivered straight to your door.
        </p>

        {/* CTA */}
        <div className="hero-carousel__ctas">
          <Link href="/meal-plans" className="hero-carousel__cta hero-carousel__cta--primary">
            Start Your Meal Plan
          </Link>
        </div>
      </div>

      <div className="hero-carousel__pagination"></div>
    </section>
  );
};

export default BannerOne;
