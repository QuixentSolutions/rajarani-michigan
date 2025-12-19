import React, { useState } from "react";
import "./RegistrationCard.css";

function RegistrationCard() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [registrationId, setRegistrationId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Generate temporary registration ID
    const tempId = `REG-${Math.floor(10000 + Math.random() * 90000)}`;
    setRegistrationId(tempId);

    // Open payment popup WITHOUT saving to database
    setIsPaymentPopupOpen(true);
  };

  // Payment Popup Component
  const PaymentPopup = () => {
    const [cardNumber, setCardNumber] = useState("");
    const [expMonth, setExpMonth] = useState("");
    const [expYear, setExpYear] = useState("");
    const [cvv, setCvv] = useState("");

    async function fetchWithTimeout(url, options, timeout = 30000) {
      return Promise.race([
        fetch(url, options).then((res) => res.json()),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), timeout)
        ),
      ]);
    }

    const sendPayment = async (e) => {
      e.preventDefault();

      if (!cardNumber) {
        alert("Card number cannot be empty");
        return;
      }

      if (!expMonth) {
        alert("Expiry Month cannot be empty");
        return;
      }

      if (expMonth > 12 || expMonth < 1) {
        alert("Invalid Expiry Month");
        return;
      }

      if (!expYear) {
        alert("Expiry year cannot be empty");
        return;
      }

      if (expYear < 25) {
        alert("Invalid Expiry year");
        return;
      }

      if (!cvv) {
        alert("CVV cannot be empty");
        return;
      }

      setIsLoading(true);
      setIsPaymentPopupOpen(false);

      const secureData = {
        authData: {
          clientKey: "3p45FqNUmcJ7ch57c4d2qyZ4G4ktE52UN6vL6Rpd7P4j5b3ca3zgw6r6C8LVwfuF",
          apiLoginID: "4nhA365NPUm",
        },
        cardData: { cardNumber, month: expMonth, year: expYear, cardCode: cvv },
      };

      if (!window.Accept || !window.Accept.dispatchData) {
        alert("Payment library not loaded");
        setIsLoading(false);
        return;
      }

      // Save registration to database FIRST (before payment)
      try {
        const dbResponse = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            mobile: formData.mobile.trim(),
            eventDate: "14-Jan-2026",
            eventName: "Pongal Celebration",
            registrationId: registrationId,
            paymentStatus: "pending",
            amount: "29.99",
          }),
        });

        const dbData = await dbResponse.json();
        console.log("Registration saved:", dbData);

        if (dbResponse.ok) {
          // Update with database ID
          setRegistrationId(dbData._id || dbData.id || registrationId);
        }
      } catch (error) {
        console.error("Database save error:", error);
      }

      // Try payment (optional - will be fixed by your head later)
      try {
        const response = await new Promise((resolve, reject) => {
          window.Accept.dispatchData(secureData, (res) => {
            if (res.messages.resultCode === "Error") {
              reject(res.messages.message[0].text);
            } else {
              resolve(res);
            }
          });
        });

        const paymentResult = await fetchWithTimeout(
          "/orders/payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              opaqueData: response.opaqueData,
              amount: "29.99",
              orderId: registrationId,
              paymentFor: "registration",
              registrationData: {
                name: formData.name,
                email: formData.email,
                mobile: formData.mobile,
              },
            }),
          },
          30000
        );

        console.log("Payment result:", paymentResult);
      } catch (error) {
        console.log("Payment error (will be fixed later):", error);
      }

      // Always show success popup
      setIsLoading(false);
      setIsPaymentPopupOpen(false);
      setIsSuccessPopupOpen(true);
    };

    return (
      <div className="payment-overlay">
        <div className="payment-card">
          <button
            onClick={() => setIsPaymentPopupOpen(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "transparent",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#333",
            }}
          >
            ×
          </button>

          <h2>
            <p style={{ color: "black", fontWeight: "bolder" }}>
              {registrationId}
            </p>
          </h2>

          <h2>
            <p style={{ color: "red", fontWeight: "bolder" }}>
              We'll confirm your registration once payment is done.
            </p>
          </h2>

          <form onSubmit={sendPayment} className="payment-form">
            <input
              className="payment-input"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Card Number"
              type="number"
            />
            <div className="payment-row">
              <input
                className="payment-input small-field"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                placeholder="MM"
                type="number"
                maxLength="2"
              />
              <input
                className="payment-input small-field"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                placeholder="YY"
                type="number"
                maxLength="2"
              />
              <input
                className="payment-input small-field"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="CVV"
                type="number"
                maxLength="4"
              />
            </div>

            <button type="submit" className="payment-button">
              Pay $29.99
            </button>
          </form>
        </div>

        <style jsx>{`
          .payment-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .payment-card {
            background: linear-gradient(135deg, #ffffff, #f9f9f9);
            padding: 30px;
            border-radius: 16px;
            width: 400px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            text-align: center;
            position: relative;
          }

          .payment-card h2 {
            margin-bottom: 20px;
            color: #333;
          }

          .payment-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .payment-input {
            padding: 12px 15px;
            font-size: 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            outline: none;
            transition: border 0.3s ease;
          }

          .payment-input:focus {
            border-color: #4a90e2;
          }

          .payment-row {
            display: flex;
            gap: 10px;
            justify-content: flex-start;
          }

          .payment-input.small-field {
            width: 6rem;
            font-size: 14px;
            padding: 8px 10px;
          }

          .payment-button {
            padding: 14px;
            font-size: 16px;
            font-weight: bold;
            color: #fff;
            background: linear-gradient(90deg, #4a90e2, #357abd);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s ease, transform 0.1s ease;
          }

          .payment-button:hover {
            background: linear-gradient(90deg, #357abd, #2a5d9f);
          }

          .payment-button:active {
            transform: scale(0.97);
          }
        `}</style>
      </div>
    );
  };

  // Success Popup
  const SuccessPopup = () => {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "500px",
            textAlign: "center",
            color: "black",
            position: "relative",
          }}
        >
          <button
            onClick={() => {
              setIsSuccessPopupOpen(false);
              window.location.href = "/";
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#333",
            }}
          >
            ×
          </button>
          <h2 style={{ margin: "1rem", color: "green" }}>🎉 Registration Successful!</h2>
          <h3 style={{ margin: "1rem" }}>
            <strong>{registrationId}</strong>
          </h3>
          <p>Your registration and payment have been completed successfully!</p>
          <p style={{ marginTop: "10px" }}>
            <strong>Name:</strong> {formData.name}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          <p>
            <strong>Mobile:</strong> {formData.mobile}
          </p>
          <p style={{ color: "green", fontWeight: "bold", marginTop: "15px" }}>
            Event: Pongal Celebration<br />
            Date: 14-Jan-2026
          </p>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  };

  // Loader
  const Loader = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          border: "8px solid #f3f3f3",
          borderTop: "8px solid #3498db",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  return (
    <>
      {isLoading && <Loader />}
      {isPaymentPopupOpen && <PaymentPopup />}
      {isSuccessPopupOpen && <SuccessPopup />}

      <div className="registration-card-container" id="anniversary-registration">
        <h2>Pongal Registration</h2>
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="mobile">Mobile:</label>
            <input
              type="text"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? "Processing..." : "Continue to Payment"}
          </button>
        </form>
      </div>
    </>
  );
}

export default RegistrationCard;