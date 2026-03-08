import serviceOne from "@/data/serviceOne";
import useActive from "@/hooks/useActive";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const { title, services } = serviceOne;

const ServiceOne = () => {
  const ref = useActive("#services");

  return (
    <section ref={ref} className="services-stacked" id="services">
      <div className="services-stacked__header">
        <h2 className="services-stacked__title">{title}</h2>
      </div>

      <div className="services-stacked__cards">
        {services.map((service) => (
          <div
            key={service.id}
            className={`services-stacked__card services-stacked__card--${service.colour} services-stacked__card--${service.position}`}
          >
            <div className="services-stacked__card-content">
              <div className="services-stacked__card-header">
                <i className={`fa-solid ${service.icon}`}></i>
                <span className="services-stacked__card-title">{service.title}</span>
              </div>
              <p className="services-stacked__card-text">{service.text}</p>
              <Link href={service.link} className="services-stacked__card-cta">
                {service.cta} <span>&rarr;</span>
              </Link>
            </div>
            <div className="services-stacked__card-image">
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceOne;
