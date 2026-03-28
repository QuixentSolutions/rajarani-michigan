import React, { useState } from "react";
import AnnualDayRegistration from "./AnnualDayRegistration";

function AnnualDayBanner() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleClick = () => {
    setIsPopupOpen(true);
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <div
        className="registration-container"
        id="registration"
        onClick={handleClick}
        style={{
          width: "100%",
          cursor: "pointer",
          margin: "20px 0",
          textAlign: "center",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={{
            display: "block",
            margin: "0 auto 12px auto",
            padding: "12px 32px",
            backgroundColor: "#e63946",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transition: "background-color 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#c1121f")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#e63946")}
        >
          Register Now
        </button>
        <img
          src={`${process.env.PUBLIC_URL}/annualDayBanner.jpg`}
          alt="Annual Day Celebration"
          style={{
            width: "100%",
            maxWidth: "500px",
            height: "auto",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            transition: "transform 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "scale(1.02)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "scale(1)";
          }}
          onError={(e) => {
            console.error("Image failed to load:", e.target.src);
            // Show a placeholder if image fails
            e.target.style.display = "none";
            const placeholder = document.createElement("div");
            placeholder.style.cssText = `
              background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
              color: white;
              padding: 60px 20px;
              border-radius: 8px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              cursor: pointer;
            `;
            placeholder.innerHTML = `
              <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
              <div style="margin-bottom: 10px;">Annual Day Celebration</div>
              <div style="font-size: 16px; font-weight: normal;">Click here to register</div>
            `;
            placeholder.onclick = handleClick;
            e.target.parentNode.appendChild(placeholder);
          }}
          onLoad={(e) => {
            console.log("Image loaded successfully:", e.target.src);
          }}
        />
      </div>

      <AnnualDayRegistration isOpen={isPopupOpen} onClose={handleClose} />
    </>
  );
}

export default AnnualDayBanner;
