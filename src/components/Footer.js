import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

function Footer() {
  const iconStyle = {
    marginRight: "15px",
    verticalAlign: "middle",
    fontSize: "24px",
  };

  const operatingHours = {
    Monday: "Closed",
    Tuesday: "11:30 am–3 pm, 5–9:30 pm",
    Wednesday: "11:30 am–3 pm, 5–9:30 pm",
    Thursday: "11:30 am–3 pm, 5–9:30 pm",
    Friday: "11:30 am–3 pm, 5–10 pm",
    Saturday: "11:30 am–3 pm, 5–10 pm",
    Sunday: "11:30 am–3 pm, 5–9 pm",
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>CONTACT INFO</h3>
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
          <div className="footer-section">
            <h3>OPERATING HOURS</h3>
            <table className="hours-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(operatingHours).map(([day, hours]) => (
                  <tr key={day}>
                    <td>{day}</td>
                    <td>{hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
