import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

function Footer() {
  const iconStyle = {
    marginRight: "15px",
    verticalAlign: "middle",
    fontSize: "24px",
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>CONTACT INFO</h3>
          </div>
          <div className="footer-details">
            <a
              href="https://maps.app.goo.gl/NRvpEc4paaSJSgxE9"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <p style={{ display: "flex", alignItems: "center" }}>
                <FaMapMarkerAlt style={{ ...iconStyle, color: "#FF4C4C" }} />
                <p style={{ color: "white" }}>
                  45172 Ford Road, Canton, MI 48187
                </p>
              </p>
            </a>

            <p style={{ display: "flex", alignItems: "center" }}>
              <FaEnvelope style={{ ...iconStyle, color: "#007BFF" }} />
              <a
                href="mailto:rajaranicanton2@gmail.com"
                style={{ color: "white" }}
              >
                rajaranicanton2@gmail.com
              </a>
            </p>
            <p style={{ display: "flex", alignItems: "center" }}>
              <FaPhoneAlt style={{ ...iconStyle, color: "#28A745" }} />
              <a href="tel:7344045523" style={{ color: "white" }}>
                734-404-5523
              </a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <h4 style={{ color: "white" }}>
            © 2025 Raja Rani Restaurant All rights reserved
          </h4>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
