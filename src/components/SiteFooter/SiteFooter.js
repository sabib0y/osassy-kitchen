import footerData from "@/data/siteFooter";
import Link from "next/link";
import React from "react";
import { Container, Image } from "react-bootstrap";

const { logo, author, year, links, socials } = footerData;

const SiteFooter = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    console.log(formData.get("email"));
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__lower">
        <Container>
          <div className="inner-container">
            <div className="site-footer__social">
              {socials.map(({ id, icon, href }) => (
                <a key={id} href={href}>
                  <i className={icon}></i>
                </a>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default SiteFooter;
