import logo from "../assets/images/logo-light.png";

const footerData = {
  logo,
  author: "Osassy's Kitchen",
  year: new Date().getFullYear(),
  tagline: "Authentic Nigerian meals delivered fresh to your door every week.",
  // Explore column
  explore: [
    { id: 1, name: "Home", href: "/" },
    { id: 2, name: "Our Meals", href: "/meals" },
    { id: 3, name: "Meal Plans", href: "/meal-plans" },
    { id: 4, name: "Catering", href: "/catering" },
    { id: 5, name: "Our Process", href: "/our-process" },
  ],
  // Support column
  support: [
    { id: 1, name: "Contact Us", href: "/contact" },
    { id: 2, name: "FAQ", href: "/faq" },
  ],
  // Legal column
  legal: [
    { id: 1, name: "Terms of Service", href: "/terms" },
    { id: 2, name: "Privacy Policy", href: "/privacy" },
  ],
  // Social links
  socials: [
    {
      id: 1,
      icon: "fa fa-facebook-square",
      href: "https://facebook.com/osassyskitchen",
      label: "Facebook",
    },
    {
      id: 2,
      icon: "fa fa-instagram",
      href: "https://instagram.com/osassyskitchen",
      label: "Instagram",
    },
    {
      id: 3,
      icon: "fa fa-twitter",
      href: "https://twitter.com/osassyskitchen",
      label: "Twitter",
    },
  ],
};

export default footerData;
