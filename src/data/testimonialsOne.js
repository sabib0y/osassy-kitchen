import qoute from "@/images/testi-qoute-1-1.png";

const testimonialsOne = {
  title: "A show of what \n we have to offer",
  testimonials: [
    {
      id: 1,
      image: "dodo.jpg",
      qoute,
      text: "Savor the sweet and savory flavors of perfectly fried plantains, known as dodo in Nigeria. This beloved side dish offers a delightful contrast to spicier elements of the meal.",
    },
    {
      id: 2,
      image: "egusi.jpg",
      qoute,
      text: "Dive into a bowl of hearty egusi soup, a staple in Nigerian households. Ground melon seeds form the base of this nourishing soup, packed with fresh vegetables and your choice of meat or fish. A comforting and satisfying meal.",
    },
    {
      id: 3,
      image: "nkwobi.jpg",
      qoute,
      text: "Indulge in the rich, spicy goodness of nkwobi, a traditional dish featuring tender cow foot simmered in a flavorful palm oil and spice blend. A true taste of Nigerian cuisine!",
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
