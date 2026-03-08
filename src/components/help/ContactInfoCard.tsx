import React from 'react';
import styles from './ContactInfoCard.module.scss';

interface ContactMethod {
  icon: string;
  title: string;
  description: string;
  primary: string;
  secondary?: string;
  link?: string;
  testId?: string;
}

interface ContactInfoCardProps {
  className?: string;
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ className = "" }) => {
  const contactMethods: ContactMethod[] = [
    {
      icon: 'fas fa-envelope',
      title: 'Email Us',
      description: 'Get help via email',
      primary: 'support@osassyskitchen.com',
      secondary: 'We respond within 24 hours',
      link: 'mailto:support@osassyskitchen.com',
      testId: 'email-contact'
    },
    {
      icon: 'fab fa-whatsapp',
      title: 'Call or WhatsApp',
      description: 'Talk to our team directly',
      primary: '+234 901 234 5678',
      secondary: 'Mon-Fri, 9am-5pm WAT',
      link: 'https://wa.me/2349012345678',
      testId: 'whatsapp-contact'
    },
    {
      icon: 'fas fa-users',
      title: 'Follow Us',
      description: 'Connect on social media',
      primary: 'Stay updated',
      secondary: 'News, tips & community',
      testId: 'social-contact'
    }
  ];

  const socialLinks = [
    {
      platform: 'Instagram',
      icon: 'fab fa-instagram',
      url: 'https://instagram.com/osassyskitchen',
      testId: 'instagram-link'
    },
    {
      platform: 'Twitter',
      icon: 'fab fa-twitter',
      url: 'https://twitter.com/osassyskitchen',
      testId: 'twitter-link'
    }
  ];

  return (
    <div className={`${styles.contactInfoCard} ${className}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>Get in Touch</h3>
        <p className={styles.subtitle}>
          Choose the best way to reach our support team
        </p>
      </div>

      <div className={styles.contactMethods}>
        {contactMethods.map((method, index) => (
          <div key={index} className={styles.contactMethod} data-testid={method.testId}>
            <div className={styles.methodIcon}>
              <i className={method.icon} aria-hidden="true"></i>
            </div>
            
            <div className={styles.methodContent}>
              <h4 className={styles.methodTitle}>{method.title}</h4>
              <p className={styles.methodDescription}>{method.description}</p>
              
              <div className={styles.methodDetails}>
                {method.link && method.title !== 'Follow Us' ? (
                  <a 
                    href={method.link}
                    className={styles.primaryLink}
                    target={method.link.includes('mailto:') ? '_self' : '_blank'}
                    rel={method.link.includes('mailto:') ? undefined : 'noopener noreferrer'}
                  >
                    {method.primary}
                  </a>
                ) : (
                  <span className={styles.primaryText}>{method.primary}</span>
                )}
                
                {method.secondary && (
                  <span className={styles.secondaryText}>{method.secondary}</span>
                )}
                
                {/* Social Links for Follow Us section */}
                {method.title === 'Follow Us' && (
                  <div className={styles.socialLinks}>
                    {socialLinks.map((social, socialIndex) => (
                      <a
                        key={socialIndex}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        data-testid={social.testId}
                        aria-label={`Follow us on ${social.platform}`}
                        title={`Follow us on ${social.platform}`}
                      >
                        <i className={social.icon} aria-hidden="true"></i>
                        <span>{social.platform}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.additionalInfo}>
          <div className={styles.infoItem}>
            <i className="fas fa-clock" aria-hidden="true"></i>
            <div>
              <span className={styles.infoTitle}>Response Time</span>
              <span className={styles.infoText}>Usually within 2-4 hours</span>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <i className="fas fa-globe" aria-hidden="true"></i>
            <div>
              <span className={styles.infoTitle}>Service Area</span>
              <span className={styles.infoText}>Lagos, Abuja & Nationwide</span>
            </div>
          </div>
        </div>
        
        <div className={styles.emergencyNotice}>
          <i className="fas fa-info-circle" aria-hidden="true"></i>
          <span>
            For urgent delivery issues, please call us directly during business hours.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;