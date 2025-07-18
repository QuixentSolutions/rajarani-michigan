import React from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

function Footer() {
  const iconStyle = {
    fontSize: "1.1rem",
    marginRight: "15px",
    verticalAlign: "middle",
    background: "#2a2a2a",
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>Contact Info</h3>
          </div>
          <div className="footer-details" style={{ background: "#2a2a2a" }}>
            <p style={{ display: "flex", alignItems: "center" }}>
              <FaMapMarkerAlt style={iconStyle} />
              45172 Ford Road, Canton, MI 48187
            </p>
            <p style={{ display: "flex", alignItems: "center" }}>
              <FaEnvelope style={iconStyle} />
              <a href="mailto:rajaranicanton2@gmail.com">
                rajaranicanton2@gmail.com
              </a>
            </p>
            <p style={{ display: "flex", alignItems: "center" }}>
              <FaPhoneAlt style={iconStyle} />
              <a href="tel:7344045523">734-404-5523</a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Raja Rani Restaurant All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;