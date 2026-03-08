import React from "react";

const features = [
  { id: 1, icon: "fa-bowl-food", text: "Fresh weekly meals" },
  { id: 2, icon: "fa-truck", text: "Reliable delivery" },
  { id: 3, icon: "fa-calendar-check", text: "Flexible subscription" },
  { id: 4, icon: "fa-file-contract", text: "No long-term contracts" },
];

const DeliveryArea = () => {
  return (
    <section className="delivery-area">
      <div className="delivery-area__container">
        <div className="delivery-area__content">
          <h2 className="delivery-area__title">Delivered Across London</h2>
          <p className="delivery-area__text">
            Fresh Nigerian meals delivered weekly to homes across London.
          </p>

          <ul className="delivery-area__features">
            {features.map((feature) => (
              <li key={feature.id} className="delivery-area__feature">
                <i className={`fa-solid ${feature.icon}`}></i>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="delivery-area__map">
          <div className="delivery-area__map-placeholder">
            <i className="fa-solid fa-location-dot"></i>
            <span>London, UK</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliveryArea;
