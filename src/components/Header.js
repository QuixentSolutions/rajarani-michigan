import { SocialIcon } from "react-social-icons";
import { useState } from "react";
import { useSelector } from "react-redux";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { clearCart } from "../cartSlice";
import emailjs from "@emailjs/browser";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("+1");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [tableNumber, setTableNumber] = useState("1");
  const [orderMode, setOrderMode] = useState("dinein");
  const [address, setAddress] = useState("");

  const totalItems = useSelector((state) => state.cart.totalItems);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const handleCartClick = () => {
    setIsPopupOpen(true);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await res.json();

            setAddress(data.display_name);
          } catch (error) {}
        },
        (err) => {
          console.error("Error getting location:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  const handleOrderNow = (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");

    if (orderMode === "delivery" && !address) {
      setAddressError("Please enter a valid delivery address.");
      return;
    }
    setAddressError("");

    const timestamp = Date.now();
    const orderId = `#ORD${timestamp.toString().slice(-4)}`;

    const total_amount = Object.entries(cartItems).reduce(
      (sum, [_, { quantity, price }]) => sum + quantity * price,
      0
    );
    const orderDetailsFlat = Object.entries(cartItems)
      .map(
        ([name, { quantity, price }]) =>
          `${name} x ${quantity} =  ₹${(quantity * price).toFixed(2)}`
      ) // Use stored price
      .join("<br/>");

    const templateParams = {
      email: email.trim(),
      order_mode: String(orderMode),
      order_id: String(orderId),
      mobile_number: String(mobileNumber),
      total_amount: String(total_amount),
      address: address ? String(address) : String(tableNumber),
      order_details: orderDetailsFlat,
    };

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
        }
      )
      .then(async (response) => {
        alert(
          `Your order has been placed and a confirmation email has been sent with all the details. - ${orderId}`
        );
        setIsPopupOpen(false);
        setMobileNumber("+1");
        setTableNumber("");
        setEmail("");
        dispatch(clearCart());
      })
      .catch((error) => {
        alert(
          `We’re sorry, your order couldn’t be placed.
          Please call us directly, or contact a waiter if you’re at the restaurant.`
        );
        console.log("Failed to send email...", error);
      });

    // const orderData = {
    //   mobileNumber,
    //   email,
    //   tableNumber,
    //   items: Object.entries(cartItems).map(([name, qty]) => ({
    //     name,
    //     quantity: qty,
    //   })),
    // };
    setIsPopupOpen(false);
    setMobileNumber("+1");
    setTableNumber("");
    setEmail("");
    dispatch(clearCart());
  };

  const isCartEmpty = Object.keys(cartItems).length === 0;

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .header-container {
              flex-wrap: wrap;
            }
            .nav {
              flex-direction: column;
              align-items: flex-start;
            }
            .logo {
              order: 2;
              width: 100%;
              text-align: center;
              margin-top: 10px;
            }
            .social-icons {
              order: 1;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              flex-wrap: nowrap;
            }
            .social-icons > * {
              flex-shrink: 0;
            }
          }
          @media (min-width: 769px) {
            .nav {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              order: 0;
            }
            .social-icons {
              order: 0;
              display: flex;
              gap: 10px;
            }
          }
        `}
      </style>
      <header>
        <div className="header-container">
          <div className="nav">
            <div className="logo">
              <img className="header-logo" src="../logo-1.png" alt="logo" />
            </div>
            <div className="social-icons">
              <SocialIcon
                className="social-icon"
                url="https://www.facebook.com/people/RAJA-RANI-Indian-Restaurant/100085630432560/"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SocialIcon
                url="https://www.instagram.com/raja_rani_indian_restaurant/"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SocialIcon
                url="https://www.yelp.com/biz/raja-rani-indian-restaurant-canton"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SocialIcon
                url="https://www.google.com/search?q=Raja+Rani+Restaurant&stick=H4sIAAAAAAAA_-NgU1I1qLCwME4yNTZMMTZPsTQ0MjK2MqhISbKwNDI0MzK0MDCySDNOWsQqEpSYlagQlJiXqRCUWlySWFqUmFcCAG2OMVdAAAAA&hl=en-GB&mat=CXkHHWDwBxApElcB8pgkaH1MxZK1YEYmOhr9L--IjKRUUN5SaGQDfjKXvZuHgOkyez4TJObGNWdGEsBGtuymvcWTJ0VYn47nPHxgyISdH8w_QHoLHJgIPbP9UAs8dZA7Ef8&authuser=0"
                target="_blank"
                rel="noopener noreferrer"
                network="google"
              />
              <SocialIcon
                url="https://wa.me/+919962836787?text=Hello, I'm interested in ordering from Raja Rani Indian Restaurant!"
                target="_blank"
                rel="noopener noreferrer"
                network="whatsapp"
                bgColor="#25D366"
              />
              <a
                href="https://maps.app.goo.gl/NRvpEc4paaSJSgxE9"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <FaMapMarkerAlt
                  className="icon-header"
                  style={{ color: "#FF4C4C" }}
                />
              </a>

              <a
                href="mailto:rajaranicanton2@gmail.com"
                style={{ color: "#2a2a2a" }}
              >
                <FaEnvelope
                  className="icon-header"
                  style={{ color: "#007BFF" }}
                />
              </a>
              <a href="tel:7344045523" style={{ color: "#2a2a2a" }}>
                <FaPhoneAlt
                  className="icon-header"
                  style={{ color: "#28A745" }}
                />
              </a>
              <button
                onClick={() => {
                  window.open(
                    "https://www.clover.com/online-ordering/raja-rani-restaurant-canton",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                style={{
                  marginLeft: "10px",
                  backgroundColor: "#333333",
                  color: "#fff",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Order Online
              </button>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginLeft: "10px",
                }}
              >
                <button
                  href="#"
                  aria-label="Cart"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "black",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCartClick();
                  }}
                >
                  <FaShoppingCart />
                </button>
                {totalItems > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "-10px",
                      backgroundColor: "#333333",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {isPopupOpen && (
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
              zIndex: 1001,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                width: "300px",
                textAlign: "center",
                position: "relative",
                background: "white",
              }}
            >
              <h3
                style={{
                  marginBottom: "15px",
                  color: "#333333",
                  background: "white",
                }}
              >
                Order Confirmation
              </h3>
              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <input
                type="email"
                placeholder="Email (required)"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "5px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              {emailError && (
                <div style={{ color: "red", marginBottom: "15px" }}>
                  {emailError}
                </div>
              )}
              {orderMode === "dinein" && (
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "15px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Table {i + 1}
                    </option>
                  ))}
                </select>
              )}

              <div class="option-group" style={{ marginTop: "10px" }}>
                <label style={{ color: "black" }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="Dine In"
                    required
                    checked={orderMode === "dinein"}
                    onClick={() => setOrderMode("dinein")}
                  />{" "}
                  Dine In
                </label>
                <label style={{ color: "black", paddingLeft: "1rem" }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="Delivery"
                    required
                    checked={orderMode === "delivery"}
                    onClick={() => setOrderMode("delivery")}
                  />{" "}
                  Delivery
                </label>
              </div>
              {orderMode === "delivery" && (
                <>
                  <br />
                  <button
                    variant="contained"
                    color="primary"
                    onClick={getLocation}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "15px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  >
                    Locate Me
                  </button>

                  <br />
                  <br />
                  <textarea
                    id="address"
                    name="address"
                    rows="5"
                    required
                    value={address}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "15px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  ></textarea>

                  {addressError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {addressError}
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleOrderNow}
                disabled={isCartEmpty}
                style={{
                  backgroundColor: isCartEmpty ? "#aaa" : "#333333",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: isCartEmpty ? "not-allowed" : "pointer",
                  marginRight: "10px",
                  marginTop: "10px",
                }}
              >
                {isCartEmpty ? `Add items to cart` : `Order Now`}
              </button>
              <button
                onClick={() => setIsPopupOpen(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#333333",
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default Header;
