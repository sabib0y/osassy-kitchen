import React from "react";

const benefits = [
  {
    id: 1,
    icon: "fa-bowl-food",
    title: "Fresh Weekly Meals",
    description: "Prepared in small batches for maximum freshness.",
  },
  {
    id: 2,
    icon: "fa-pepper-hot",
    title: "Authentic Nigerian Flavours",
    description: "Traditional recipes done right, every time.",
  },
  {
    id: 3,
    icon: "fa-calendar-check",
    title: "Flexible Subscription",
    description: "Skip or pause anytime. No long-term contracts.",
  },
];

const WhySubscribe = () => {
  return (
    <section className="why-subscribe">
      <div className="why-subscribe__container">
        <h2 className="why-subscribe__title">Why Choose Osassy&apos;s Kitchen?</h2>
        <p className="why-subscribe__subtitle">Experience the benefits of our meal subscription service</p>

        <div className="why-subscribe__benefits">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="why-subscribe__benefit">
              <div className="why-subscribe__benefit-icon">
                <i className={`fa-solid ${benefit.icon}`}></i>
              </div>
              <h3 className="why-subscribe__benefit-title">{benefit.title}</h3>
              <p className="why-subscribe__benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySubscribe;
