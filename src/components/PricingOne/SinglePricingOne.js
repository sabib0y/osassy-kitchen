import React from "react";
import { Col, Row } from "react-bootstrap";

const MenutItem = ({ menuItem }) => {
  const { name, subText, contains } = menuItem;
  return (
    <div className="menu-item">
      <h4 className="menu-item__name">
        {name}
        {subText && <span>{subText}</span>}
      </h4>
      <ul className="menu-item__content">
        {contains.map((item, i) => (
          <li key={i} className="menu-item__list-item">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SinglePricingOne = ({ singlePricing = {} }) => {
  const { title, dish } = singlePricing;

  return (
    <Col lg={12}>
      <div className="food-menu__single">
        <h3 className="food-menu__heading">{title}</h3>
        <Row>
          {dish.map((menuItem, index) => {
            return (
              <Col lg={6} md={12} key={index}>
                <MenutItem menuItem={menuItem} key={index} />
              </Col>
            );
          })}
        </Row>
      </div>
    </Col>
  );
};

export default SinglePricingOne;
