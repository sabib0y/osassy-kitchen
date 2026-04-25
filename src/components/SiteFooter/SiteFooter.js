import footerData from "@/data/siteFooter";
import Link from "next/link";
import React from "react";
import styles from "./SiteFooter.module.scss";

const { logo, author, year, tagline, explore, support, legal, socials } = footerData;

const SiteFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logoLink}>
              <img src={logo.src || logo} alt={author} className={styles.logo} />
            </Link>
            <p className={styles.tagline}>{tagline}</p>
            <div className={styles.socials}>
              {socials.map(({ id, icon, href, label }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={styles.socialLink}
                >
                  <i className={icon}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Explore Column */}
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Explore</h4>
            <ul className={styles.linkList}>
              {explore.map(({ id, name, href }) => (
                <li key={id}>
                  <Link href={href}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Support</h4>
            <ul className={styles.linkList}>
              {support.map(({ id, name, href }) => (
                <li key={id}>
                  <Link href={href}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <ul className={styles.linkList}>
              {legal.map(({ id, name, href }) => (
                <li key={id}>
                  <Link href={href}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>&copy; {year} {author}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
