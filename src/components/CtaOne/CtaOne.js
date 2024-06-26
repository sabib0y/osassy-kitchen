import ctaOne from "@/data/ctaOne";
import useActive from "@/hooks/useActive";
import React from "react";
import TextSplit from "../Reuseable/TextSplit";

const { title } = ctaOne;

const CtaOne = ({ isScrollActive = false }) => {
  const ref = useActive("#contact", isScrollActive);

  return (
    <section ref={ref} className="cta-one" id="contact">
      <div className="container text-center">
        <div className="block-title">
          <h2 className="block-title__title light-text-color">
            <TextSplit text={title} />
          </h2>
        </div>
        <a href="tel:+447473301272" className="thm-btn cta-one__btn">
          Call Now on +44 7473 301272
        </a>
      </div>
    </section>
  );
};

export default CtaOne;
