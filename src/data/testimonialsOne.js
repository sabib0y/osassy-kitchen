import qoute from "@/images/testi-qoute-1-1.png";

const testimonialsOne = {
  title: "What our clients \n are saying",
  testimonials: [
    {
      id: 1,
      image: "testi-1-1.jpg",
      qoute,
      text: "This is due to their excellent service, competitive pricing and customer support. It’s throughly refresing to get such a personal touch. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum eu fugiat nulla pariatur.",
      name: "Jona Leisey",
      designation: "CEO Lums",
    },
    {
      id: 2,
      image: "testi-1-2.jpg",
      qoute,
      text: "This is due to their excellent service, competitive pricing and customer support. It’s throughly refresing to get such a personal touch. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum eu fugiat nulla pariatur.",
      name: "Chas Samul",
      designation: "CEO Lums",
    },
    {
      id: 3,
      image: "testi-1-3.jpg",
      qoute,
      text: "This is due to their excellent service, competitive pricing and customer support. It’s throughly refresing to get such a personal touch. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum eu fugiat nulla pariatur.",
      name: "Chelsey Pozar",
      designation: "CEO Lums",
    },
  ],
  buttons: [
    {
      className: "testimonials-one__button__prev-btn",
      type: "prev",
    },
    {
      className: "testimonials-one__button__current-btn",
      type: "current",
    },
    {
      className: "testimonials-one__button__next-btn",
      type: "next",
    },
  ],
};

export default testimonialsOne;
