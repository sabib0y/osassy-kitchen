import bannerOne from "@/data/bannerOne";
import useActive from "@/hooks/useActive";
import React from "react";
import { Col, Container, Image, Row } from "react-bootstrap";
import TextSplit from "../Reuseable/TextSplit";

const { images, tagline, title } = bannerOne;

const BannerOne = () => {
  const ref = useActive("#home");

  return (
    <section ref={ref} className="banner-one" id="home">
      {images.map(({ id, image, className }) => (
        <Image
          key={id}
          src={require(`src/assets/images/${image}`).default.src}
          className={className}
          alt="Awesome Image"
        />
      ))}
      <Container>
        <Row>
          <Col xl={6}>
            <div className="banner-one__content">
              <p className="banner-one__tag-line">{title}</p>
              <h3 className="banner-one__title">
                <TextSplit text={tagline} />
              </h3>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BannerOne;
