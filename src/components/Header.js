import { SocialIcon } from "react-social-icons";
import { useState, useEffect } from "react";
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
  const [mobileError, setMobileError] = useState("");
  const [tableNumber, setTableNumber] = useState("1");
  const [orderMode, setOrderMode] = useState("dinein");
  const [address, setAddress] = useState("");
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const totalItems = useSelector((state) => state.cart.totalItems);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const handleCartClick = () => {
    setIsPopupOpen(true);
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/^\+1/, "").replace(/\D/g, "");

    if (digits.length <= 3) {
      return `+1 ${digits}`;
    } else if (digits.length <= 6) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
        6,
        10
      )}`;
    }
  };

  useEffect(() => {
    const total_amount = Object.entries(cartItems).reduce(
      (sum, [_, { quantity, price }]) => sum + quantity * price,
      0
    );
    setTotalAmount(total_amount);
  }, [cartItems]);

  const handleChange = (e) => {
    const input = e.target.value;
    if (!input.startsWith("+1")) {
      setMobileNumber("+1");
      return;
    }
    const formatted = formatPhoneNumber(input);
    setMobileNumber(formatted);
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
    const mobileRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;

    if (
      orderMode !== "dinein" &&
      (!mobileNumber ||
        mobileNumber === "+1" ||
        !mobileRegex.test(mobileNumber.trim()))
    ) {
      setMobileError("Please enter a valid mobile number.");
      return;
    }
    setMobileError("");
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
      total_amount: total_amount.toFixed(2),
      address: address ? String(address) : String(tableNumber),
      order_details: orderDetailsFlat,
    };
    setIsLoading(true);
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
        setSuccessOrderId(orderId);
        setIsSuccessPopupOpen(true);
        setIsPopupOpen(false);
        setMobileNumber("+1");
        setTableNumber("");
        setEmail("");
        dispatch(clearCart());
        setIsLoading(false);
      })
      .catch((error) => {
        alert(
          `We’re sorry, your order couldn’t be placed.
          Please call us directly, or contact a waiter if you’re at the restaurant.`
        );
        console.log("Failed to send email...", error);
        setIsLoading(false);
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
            onClick={() => setIsSuccessPopupOpen(false)}
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
          <h2 style={{ margin: "1rem" }}>Order Placed Successfully!</h2>
          <p>
            Your order has been placed and a confirmation email has been sent
            with all the details. - <strong>{successOrderId}</strong>
          </p>
          <p style={{fontWeight: "bold",marginTop: "20px"}}>You can scan to pay or pay at the counter</p>
          <p style={{ marginTop: "20px" }}>
            <strong>Scan to Pay:</strong>
          </p>
          <img
            src="https://rajarani-michigan.s3.us-east-2.amazonaws.com/general/qr.png"
            alt="Payment QR Code"
            style={{ width: "250px", height: "250px", margin: "10px 0" }}
          />
        </div>
      </div>
    );
  };

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
      {isSuccessPopupOpen && <SuccessPopup />}
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
              justify-content: space-evenly;
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
                url="https://chat.whatsapp.com/JVMf5MZJCEp2XPakE4YYaW?mode=ac_t"
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
              {/* <button
                onClick={() => {
                  window.open(
                    "https://www.clover.com/online-ordering/raja-rani-restaurant-canton",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                style={{
                  marginLeft: "10px",
                  backgroundColor: "white",
                  color: "#fff",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Order Online
              </button> */}
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
                    color: "white",
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
                      backgroundColor: "white",
                      color: "black",
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
                // width: "300px",
                textAlign: "center",
                position: "relative",
                background: "white",
              }}
            >
              <h3
                style={{
                  marginBottom: "15px",
                  color: "black",
                  background: "white",
                }}
              >
                Order Confirmation
              </h3>
              {Object.keys(cartItems).length > 0 && (
  <div
    style={{
      maxHeight: "15rem",
      overflowY: Object.keys(cartItems).length > 5 ? "scroll" : "auto",
      marginTop: "15px",
      borderTop: "1px solid #ccc",
      paddingTop: "10px",
    }}
  >
    <table
      style={{
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: "0 10px",
        tableLayout: "fixed",
      }}
    >
      <thead>
        <tr
          style={{
            textAlign: "center",
            padding: "10px 0",
            borderBottom: "2px solid #ccc",
            color: "#333",
            backgroundColor: "#f5f5f5",
          }}
        >
          <th
            style={{
              width: "60%",
              wordWrap: "break-word",
              padding: "10px",
            }}
          >
            Name
          </th>
          <th style={{ width: "20%", padding: "10px" }}>Qty</th>
          <th style={{ width: "20%", padding: "10px" }}>Price</th>
        </tr>
      </thead>
      <tbody style={{ color: "black" }}>
        {Object.entries(cartItems).map(([name, { quantity, price }]) => (
          <tr
            key={name}
            style={{
              borderBottom: "1px solid #eee",
              padding: "5px 0",
            }}
          >
            <td
              style={{
                wordWrap: "break-word",
                whiteSpace: "normal",
                padding: "5px",
              }}
            >
              {name}
            </td>
            <td>{quantity}</td>
            <td>{(quantity * price).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

<input
  type="text"
  placeholder="Subtotal"
  disabled
  value={`Subtotal: $${totalAmount.toFixed(2)}`}
  style={{
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "20px",
  }}
/>

<input
  type="text"
  placeholder="Sales Tax"
  disabled
  value={`Sales Tax (6%): $${(totalAmount * 0.06).toFixed(2)}`}
  style={{
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "10px",
  }}
/>

<input
  type="text"
  placeholder="Total Amount"
  disabled
  value={`Total Amount: $${(totalAmount * 1.06).toFixed(2)}`}
  style={{
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "10px",
  }}
/>
              {orderMode !== "dinein" && (
                <>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={mobileNumber}
                    onChange={handleChange}
                    // onChange={(e) => setMobileNumber(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "5px",
                      marginBottom: "5px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  {mobileError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {mobileError}
                    </div>
                  )}
                </>
              )}

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
                  marginTop: "5px",
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
              <div
                className="option-group"
                style={{ marginTop: "10px", display: "flex", gap: "5rem", justifyContent: "space-evenly" }}
              >
                {/* {["dinein", "delivery", "grab"].map((mode) => ( */}
                {["dinein", "pickup"].map((mode) => (
                  <label
                    key={mode}
                    style={{
                      color: "black",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  >
                    <input
                      type="radio"
                      name="orderType"
                      value={mode}
                      checked={orderMode === mode}
                      onChange={() => setOrderMode(mode)}
                      style={{ marginBottom: "3px" }}
                    />
                    {mode === "grab" ? (
                      <>Grab</>
                    ) : (
                      mode.charAt(0).toUpperCase() + mode.slice(1)
                    )}
                  </label>
                ))}
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
                  backgroundColor: isCartEmpty ? "#aaa" : "black",
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
                  color: "black",
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
