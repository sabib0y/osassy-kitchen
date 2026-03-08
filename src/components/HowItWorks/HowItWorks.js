import React from "react";
import Link from "next/link";

const steps = [
  {
    id: 1,
    icon: "fa-utensils",
    title: "Choose your meals",
    description: "Build your weekly meal plan from our delicious Nigerian menu with flexible options.",
    link: "/menu",
    linkText: "Browse Menu",
  },
  {
    id: 2,
    icon: "fa-fire-burner",
    title: "We cook fresh",
    description: "Our chefs prepare your meals with authentic Nigerian ingredients and traditional recipes.",
    link: "/about",
    linkText: "Our Kitchen",
  },
  {
    id: 3,
    icon: "fa-truck",
    title: "Delivered to your door",
    description: "Enjoy restaurant-quality Nigerian meals delivered fresh to your home weekly.",
    link: "/delivery",
    linkText: "Delivery Info",
  },
];

const HowItWorks = () => {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works__container">
        <h2 className="how-it-works__title">How It Works</h2>

        <div className="how-it-works__steps">
          {steps.map((step) => (
            <div key={step.id} className="how-it-works__card">
              <div className="how-it-works__card-header">
                <div className="how-it-works__icon-wrapper">
                  <i className={`fa-solid ${step.icon}`}></i>
                  <span className="how-it-works__number">{step.id}</span>
                </div>
              </div>
              <div className="how-it-works__card-body">
                <h3 className="how-it-works__card-title">{step.title}</h3>
                <p className="how-it-works__card-description">{step.description}</p>
              </div>
              <div className="how-it-works__card-footer">
                <Link href={step.link} className="how-it-works__card-link">
                  {step.linkText}
                  <i className="fa-solid fa-chevron-down"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
