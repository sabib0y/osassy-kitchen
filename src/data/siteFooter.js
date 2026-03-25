import logo from "../assets/images/logo-dark.png";

const footerData = {
  logo,
  author: "Osassy's Kitchen",
  year: new Date().getFullYear(),
  // Quick Links - main navigation
  quickLinks: [
    {
      id: 1,
      name: "Home",
      href: "/",
    },
    {
      id: 2,
      name: "Meals",
      href: "/meals",
    },
    {
      id: 3,
      name: "How It Works",
      href: "/our-process",
    },
    {
      id: 4,
      name: "Help & Support",
      href: "/help",
    },
  ],
  // Legal links
  legalLinks: [
    {
      id: 1,
      name: "Terms of Service",
      href: "/terms",
    },
    {
      id: 2,
      name: "Privacy Policy",
      href: "/privacy",
    },
  ],
  // Legacy links array for backwards compatibility
  links: [
    {
      id: 1,
      name: "Home",
      href: "/",
    },
    {
      id: 2,
      name: "Meals",
      href: "/meals",
    },
    {
      id: 3,
      name: "How It Works",
      href: "/our-process",
    },
    {
      id: 4,
      name: "Help & Support",
      href: "/help",
    },
    {
      id: 5,
      name: "Terms of Service",
      href: "/terms",
    },
    {
      id: 6,
      name: "Privacy Policy",
      href: "/privacy",
    },
  ],
  socials: [
    {
      id: 1,
      icon: "fa fa-facebook-square",
      href: "https://facebook.com/osassyskitchen",
    },
    {
      id: 2,
      icon: "fa fa-instagram",
      href: "https://instagram.com/osassyskitchen",
    },
  ],
};

export default footerData;
