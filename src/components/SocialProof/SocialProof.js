import React from "react";

const testimonials = [
  {
    id: 1,
    text: "The jollof tastes like home. Best Nigerian food delivery in London.",
    author: "Funke A.",
    initials: "FA",
    colour: "#C52D2F",
    rating: 5,
  },
  {
    id: 2,
    text: "The weekly meal plan saves me so much time. Fresh and delicious every week!",
    author: "David O.",
    initials: "DO",
    colour: "#F1C40F",
    rating: 5,
  },
  {
    id: 3,
    text: "Finally found authentic Nigerian food that reminds me of my mum's cooking.",
    author: "Blessing N.",
    initials: "BN",
    colour: "#225533",
    rating: 5,
  },
];

const SocialProof = () => {
  return (
    <section className="social-proof">
      <div className="social-proof__container">
        <h2 className="social-proof__title">Loved by Food Lovers</h2>

        <div className="social-proof__testimonials">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="social-proof__testimonial">
              <div className="social-proof__stars">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star"></i>
                ))}
              </div>
              <p className="social-proof__text">"{testimonial.text}"</p>
              <div className="social-proof__author-info">
                <div
                  className="social-proof__avatar"
                  style={{ backgroundColor: testimonial.colour }}
                >
                  {testimonial.initials}
                </div>
                <span className="social-proof__author">{testimonial.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
