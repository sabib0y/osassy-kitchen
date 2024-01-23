import React from "react";
import { Col } from "react-bootstrap";
import TextSplit from "../Reuseable/TextSplit";
import Image from "next/image";

const ServiceOneSingle = ({ service = {} }) => {
  const { icon, title, text } = service;

  return (
    <Col lg={12}>
      <div className="service-one__single">
        <div className="service-one__teaser_wrapper">
          <h3 className="service-one__title">
              <TextSplit text={title} />
          </h3>
          <div className="service-one__icon">
            <Image
              src={`/src/assets/images/${icon}.png`}
              alt="Awesome Image"
              width={66}
              height={66}
            />
            {/* <i className={icon}></i> */}
          </div>
        </div>

        <p className="service-one__text">
          <TextSplit text={text} />
        </p>
      </div>
    </Col>
  );
};

export default ServiceOneSingle;
