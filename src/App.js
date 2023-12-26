import React from "react";
import { ReactComponent as IconInsta } from "./assets/icons/instagram.svg";
import "./App.css";

class App extends React.Component {
  render = () => {
    return (
      <div className="app_wrapper">
        <div className="card">
          <div className="header">
            <div className="logo">
              <a href=".">
                <img
                  src={require("./assets/logo.png")}
                  alt="Logo"
                  className="logo"
                />
              </a>
            </div>
            <div className="social">
              <a
                href="https://www.instagram.com/osassykitchen/"
                title="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconInsta className="icon" />
              </a>
            </div>
          </div>
          <div className="content">
            <div className="title-holder">
              <h1>Get ready for the change.</h1>
              <p>
                Website coming soon. Please, do check back to know more. Shoot
                us an email if you're curious.
              </p>
            </div>
            <a href="mailto:info@osassykitchen.co.uk">
              <div className="cta">Send us an email</div>
            </a>
          </div>
        </div>
      </div>
    );
  };
}

export default App;
