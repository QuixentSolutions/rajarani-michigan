import { useState } from "react";
import "./AnnualDayRegistration.css";
import { FaTimes } from "react-icons/fa";


// ── Fancy Alert ───────────────────────────────────────────────────────────────
function FancyAlert({ alert, onClose }) {
  if (!alert) return null;
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const colors = { success: "#28a745", error: "#dc3545", warning: "#fd7e14", info: "#007bff" };
  const type = alert.type || "info";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "32px 28px",
        maxWidth: 380, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        animation: "fadeInUp 0.2s ease",
      }}>
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 14 }}>{icons[type]}</div>
        {alert.title && (
          <h3 style={{ margin: "0 0 10px", fontSize: 18, color: "#222" }}>{alert.title}</h3>
        )}
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#555", lineHeight: 1.6 }}>
          {alert.message}
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "10px 32px", borderRadius: 8, border: "none",
            background: colors[type], color: "#fff", fontWeight: 700,
            fontSize: 15, cursor: "pointer",
          }}
        >
          {alert.btnText || "OK"}
        </button>
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function AnnualDayRegistration({ isOpen, onClose }) {
  const VEG_PRICE = 8;
  const NON_VEG_PRICE = 9;
  const SALES_TAX_RATE = 0.06; // 6%

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    date: "2026-04-25",
    vegCount: "1",
    nonVegCount: "0",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");
  const [alertState, setAlertState] = useState(null);

  const showAlert = (message, type = "info", title = "", btnText = "OK") =>
    new Promise((resolve) =>
      setAlertState({ message, type, title, btnText, onClose: () => { setAlertState(null); resolve(); } })
    );
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");

  // Calculate totals based on veg/non-veg counts
  const calculateTotals = () => {
    const vegCount = parseInt(formData.vegCount) || 0;
    const nonVegCount = parseInt(formData.nonVegCount) || 0;
    const subTotal = vegCount * VEG_PRICE + nonVegCount * NON_VEG_PRICE;
    const salesTax = subTotal * SALES_TAX_RATE;
    const totalAmount = subTotal + salesTax;
    return { subTotal, salesTax, totalAmount };
  };

  const { subTotal, salesTax, totalAmount } = calculateTotals();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }

    const mobileRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;
    if (!formData.mobileNumber || !mobileRegex.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Valid mobile number is required";
    }

    const totalPeople =
      parseInt(formData.vegCount || 0) + parseInt(formData.nonVegCount || 0);
    if (totalPeople < 1) {
      newErrors.vegCount = "At least one person must be registered";
    }

    if (parseInt(formData.vegCount || 0) < 0) {
      newErrors.vegCount = "Veg count cannot be negative";
    }

    if (parseInt(formData.nonVegCount || 0) < 0) {
      newErrors.nonVegCount = "Non-veg count cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      try {
        // Generate registration ID
        const registrationId = `REG-${Math.floor(10000 + Math.random() * 90000)}`;

        // Ask for confirmation
        let userConfirmed = window.confirm(
          "Ready to finalize your registration?",
        );

        if (!userConfirmed) {
          // User clicked "Cancel", stop processing
          setIsLoading(false);
          return;
        }

        // Store registration data for payment processing
        setSuccessOrderId(registrationId);
        setIsPaymentPopupOpen(true);
        // Don't close main modal yet - wait until payment is complete
      } catch (err) {
        console.error("Registration process error:", err);
        await showAlert(err.message, "error", "Registration Failed");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/^\+1/, "").replace(/\D/g, "");
    if (digits.length <= 3) return `+1 ${digits}`;
    if (digits.length <= 6)
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      10,
    )}`;
  };

  const handleMobileChange = (e) => {
    const input = e.target.value;
    if (!input.startsWith("+1") && input !== "") {
      setFormData((prev) => ({ ...prev, mobileNumber: "+1" }));
      return;
    }
    const formatted = formatPhoneNumber(input);
    setFormData((prev) => ({ ...prev, mobileNumber: formatted }));
  };

  const sendPayment = async (e) => {
    e.preventDefault();

    if (!cardNumber) {
      await showAlert("Card number cannot be empty", "warning");
      return;
    }

    if (!expMonth) {
      await showAlert("Expiry month cannot be empty", "warning");
      return;
    }

    if (expMonth > 12 || expMonth < 1) {
      await showAlert("Invalid expiry month", "warning");
      return;
    }

    if (!expYear) {
      await showAlert("Expiry year cannot be empty", "warning");
      return;
    }

    if (expYear < 25) {
      await showAlert("Invalid expiry year", "warning");
      return;
    }

    if (!cvv) {
      await showAlert("CVV cannot be empty", "warning");
      return;
    }

    if (!window.Accept || !window.Accept.dispatchData) {
      await showAlert("Payment library not loaded. Please refresh the page.", "error");
      return;
    }

    setIsPaymentPopupOpen(false);
    setIsLoading(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    const TIMEOUT_MS = 30000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
    );

    try {
      const secureData = {
        authData: {
          clientKey:
            "3p45FqNUmcJ7ch57c4d2qyZ4G4ktE52UN6vL6Rpd7P4j5b3ca3zgw6r6C8LVwfuF",
          apiLoginID: "4nhA365NPUm",
        },
        cardData: { cardNumber, month: expMonth, year: expYear, cardCode: cvv },
      };

      // Wrap dispatchData in a Promise and race against timeout
      const dispatchPromise = new Promise((resolve, reject) => {
        window.Accept.dispatchData(secureData, (res) => {
          if (res.messages.resultCode === "Error") {
            reject(new Error(res.messages.message[0].text));
          } else {
            resolve(res);
          }
        });
      });
      const response = await Promise.race([dispatchPromise, timeoutPromise]);

      // First process payment (also race against timeout)
      const paymentResult = await Promise.race([
        fetch("/api/register/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opaqueData: response.opaqueData,
            amount: totalAmount,
            registrationId: successOrderId,
          }),
        }),
        timeoutPromise,
      ]);

      const paymentData = await paymentResult.json();

      if (paymentResult.ok && paymentData.success) {
        // Payment successful - now save registration
        const totalPeople =
          parseInt(formData.vegCount || 0) +
          parseInt(formData.nonVegCount || 0);

        const registrationData = {
          orderNumber: successOrderId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobileNumber.trim(),
          eventDate: formData.date,
          eventName: "Annual Day Celebration",
          vegCount: parseInt(formData.vegCount) || 0,
          nonVegCount: parseInt(formData.nonVegCount) || 0,
          quantity: totalPeople.toString(),
          subTotal: parseFloat(subTotal.toFixed(2)),
          salesTax: parseFloat(salesTax.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          status: "paid",
          paymentId: paymentData.transactionId,
          paidAt: new Date().toISOString(),
        };

        // Save registration to database
        const dbResponse = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationData),
        });

        const dbData = await dbResponse.json();

        if (!dbResponse.ok) {
          throw new Error(
            dbData.message || "Failed to save registration to database.",
          );
        }

        // Payment and registration successful
        setPaymentSuccess(true);
        setFormData({
          name: "",
          email: "",
          mobileNumber: "",
          date: "2026-04-25",
          vegCount: "1",
          nonVegCount: "0",
        });
        setCardNumber("");
        setExpMonth("");
        setExpYear("");
        setCvv("");
      } else {
        setPaymentError(paymentData.message || "Payment could not be processed");
        setIsPaymentPopupOpen(false);
      }
    } catch (error) {
      const isTimeout = error.message === "TIMEOUT";
      setPaymentError(
        isTimeout
          ? "Payment timed out. Please try again or contact us to complete your booking."
          : error.message
      );
      setIsPaymentPopupOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="annual-day-overlay">
        <div className="annual-day-modal">
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>

          <div className="modal-header">
            <h2>Annual Day Registration</h2>
          </div>

          <form onSubmit={handleSubmit} className="registration-form">
            {/* Form content remains the same */}
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber">Mobile Number *</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleMobileChange}
                className={errors.mobileNumber ? "error" : ""}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
              {errors.mobileNumber && (
                <span className="error-message">{errors.mobileNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="date">Event Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                readOnly
                style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                disabled={isLoading}
              />
              <small style={{ color: "#666", fontSize: "12px" }}>
                Annual Day Celebration - April 25, 2026
              </small>
            </div>

            <div className="form-group">
              <label>Food Preferences *</label>

              <div
                className="food-count-container"
                style={{ display: "flex", gap: "20px", marginBottom: "15px" }}
              >
                <div className="food-count-item" style={{ flex: 1 }}>
                  <label
                    htmlFor="vegCount"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "5px",
                    }}
                  >
                    Vegetarian
                  </label>
                  <input
                    type="number"
                    id="vegCount"
                    name="vegCount"
                    value={formData.vegCount}
                    onChange={handleChange}
                    className={errors.vegCount ? "error" : ""}
                    min="0"
                    max="10"
                    placeholder="0"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: errors.vegCount
                        ? "1px solid #dc3545"
                        : "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                  />
                  {errors.vegCount && (
                    <span className="error-message">{errors.vegCount}</span>
                  )}
                </div>

                <div className="food-count-item" style={{ flex: 1 }}>
                  <label
                    htmlFor="nonVegCount"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "5px",
                    }}
                  >
                    Non-Vegetarian
                  </label>
                  <input
                    type="number"
                    id="nonVegCount"
                    name="nonVegCount"
                    value={formData.nonVegCount}
                    onChange={handleChange}
                    className={errors.nonVegCount ? "error" : ""}
                    min="0"
                    max="10"
                    placeholder="0"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: errors.nonVegCount
                        ? "1px solid #dc3545"
                        : "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                  />
                  {errors.nonVegCount && (
                    <span className="error-message">{errors.nonVegCount}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="form-group">
              <label>Payment Summary</label>
              <div className="payment-summary">
                {/* Individual Items */}
                {(parseInt(formData.vegCount) > 0 ||
                  parseInt(formData.nonVegCount) > 0) && (
                  <>
                    {parseInt(formData.vegCount) > 0 && (
                      <div className="summary-row item-row">
                        <span>
                          Vegetarian ({formData.vegCount} × ${VEG_PRICE}):
                        </span>
                        <input
                          type="text"
                          value={`$${(parseInt(formData.vegCount) * VEG_PRICE).toFixed(2)}`}
                          readOnly
                          className="summary-input item-input"
                        />
                      </div>
                    )}
                    {parseInt(formData.nonVegCount) > 0 && (
                      <div className="summary-row item-row">
                        <span>
                          Non-Vegetarian ({formData.nonVegCount} × $
                          {NON_VEG_PRICE}):
                        </span>
                        <input
                          type="text"
                          value={`$${(parseInt(formData.nonVegCount) * NON_VEG_PRICE).toFixed(2)}`}
                          readOnly
                          className="summary-input item-input"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Totals */}
                <div className="summary-row">
                  <span>Sub Total:</span>
                  <input
                    type="text"
                    value={`$${subTotal.toFixed(2)}`}
                    readOnly
                    className="summary-input"
                  />
                </div>
                <div className="summary-row">
                  <span>Sales Tax ({(SALES_TAX_RATE * 100).toFixed(0)}%):</span>
                  <input
                    type="text"
                    value={`$${salesTax.toFixed(2)}`}
                    readOnly
                    className="summary-input"
                  />
                </div>
                <div className="summary-row total-row">
                  <span>Total Amount:</span>
                  <input
                    type="text"
                    value={`$${totalAmount.toFixed(2)}`}
                    readOnly
                    className="summary-input total-input"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || totalAmount === 0}
            >
              {isLoading ? "Processing..." : "Pay"}
            </button>
          </form>
        </div>
      </div>

      {/* Payment Loading Screen */}
      {isLoading && (
        <div className="payment-overlay">
          <div className="payment-card" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div style={{
              width: 56, height: 56, border: "5px solid #e9ecef",
              borderTop: "5px solid #4a90e2", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 20px",
            }} />
            <h3 style={{ color: "#333", marginBottom: 8 }}>Processing Payment</h3>
            <p style={{ color: "#888", fontSize: 14 }}>Please wait, do not close this window…</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}

      {/* Payment Success Screen */}
      {paymentSuccess && (
        <div className="payment-overlay">
          <div className="payment-card" style={{ textAlign: "center", padding: "40px 32px" }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
            <h3 style={{ color: "#28a745", marginBottom: 8, fontSize: 22 }}>Registration Successful!</h3>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 6 }}>
              Payment completed for <strong>{successOrderId}</strong>.
            </p>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
              A confirmation email has been sent to you.
            </p>
            <button
              onClick={() => { setPaymentSuccess(false); onClose(); }}
              style={{
                padding: "12px 32px", borderRadius: 8, border: "none",
                background: "#28a745", color: "#fff", fontWeight: 700,
                fontSize: 16, cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Payment Error Screen */}
      {paymentError && (
        <div className="payment-overlay">
          <div className="payment-card" style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: "#dc3545", marginBottom: 10 }}>Payment Issue</h3>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>{paymentError}</p>
            <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>
              Please contact us to complete your booking:
            </p>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Dinesh</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <a
                href="tel:+17327629918"
                style={{
                  display: "block", padding: "10px 16px", borderRadius: 8,
                  background: "#343a40", color: "#fff", textDecoration: "none",
                  fontWeight: 600, fontSize: 15,
                }}
              >
                📞 Call: +1 (732) 762-9918
              </a>
              <a
                href="https://wa.me/17327629918"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", padding: "10px 16px", borderRadius: 8,
                  background: "#25D366", color: "#fff", textDecoration: "none",
                  fontWeight: 600, fontSize: 15,
                }}
              >
                💬 WhatsApp: +1 (732) 762-9918
              </a>
            </div>
            <button
              onClick={() => { setPaymentError(null); setIsPaymentPopupOpen(true); }}
              style={{
                marginTop: 16, padding: "8px 20px", borderRadius: 6,
                border: "1px solid #ccc", background: "#fff",
                cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Payment Popup */}
      {isPaymentPopupOpen && (
        <div className="payment-overlay">
          <div className="payment-card">
            <h2>
              <p style={{ color: "black", fontWeight: "bolder" }}>
                {successOrderId}
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
                  maxlength="2"
                />
                <input
                  className="payment-input small-field"
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  placeholder="YY"
                  type="number"
                  maxlength="2"
                />
                <input
                  className="payment-input small-field"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="CVV"
                  type="number"
                  maxlength="2"
                />
              </div>

              <button type="submit" className="payment-button" disabled={isLoading}>
                {isLoading ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
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
              z-index: 2000; /* Higher than main modal */
            }

            .payment-card {
              background: linear-gradient(135deg, #ffffff, #f9f9f9);
              padding: 30px;
              border-radius: 16px;
              width: 400px;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
              text-align: center;
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
              transition:
                background 0.3s ease,
                transform 0.1s ease;
            }

            .payment-button:hover {
              background: linear-gradient(90deg, #357abd, #2a5d9f);
            }

            .payment-button:active {
              transform: scale(0.97);
            }
          `}</style>
        </div>
      )}
      <FancyAlert alert={alertState} onClose={alertState?.onClose} />
    </>
  );
}

export default AnnualDayRegistration;
