import { SocialIcon } from "react-social-icons";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { clearCart, rehydrateCart } from "../cartSlice";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
// import AnniversaryPopup from "./AnniversaryPopup";
import { FaPlus, FaMinus } from "react-icons/fa";
import { View, Text, TouchableOpacity } from "react-native";

function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("+1");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [tableNumber, setTableNumber] = useState("1");
  const [orderMode, setOrderMode] = useState("dinein");
  const [address, setAddress] = useState("");
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [onlinePaymentAmount, setOnlinePaymentAmount] = useState(0);

  const [finalOrderAmount, setFinalOrderAmount] = useState(0);

  const [deliveryModes, setDeliveryModes] = useState();

  // const totalItems = useSelector((state) => state.cart.totalItems);
  // const cartItems = useSelector((state) => state.cart.items);

  // const totalItems = useSelector((state) => state.cart.totalItems);

  const localStorageCartItems = useSelector((state) => state.cart.items);
  const [cartItems, setCartItems] = useState(localStorageCartItems);

  // Sync when totalItems changes
  useEffect(() => {
    setCartItems(localStorageCartItems);
  }, [localStorageCartItems]);

  const dispatch = useDispatch();

  const handleCartClick = () => {
    setIsPopupOpen(true);
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/^\+1/, "").replace(/\D/g, "");
    if (digits.length <= 3) return `+1 ${digits}`;
    if (digits.length <= 6)
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      10
    )}`;
  };

  useEffect(() => {
    const subTotal = Object.values(cartItems).reduce(
      (sum, { quantity, price }) => sum + parseFloat(price),
      0
    );
    setTotalAmount(subTotal);
  }, [cartItems]);

  useEffect(() => {
    const loadData = async () => {
      const dbResponse = await fetch("/settings/latest", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const dbData = await dbResponse.json();
      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save order.");
      }

      const obj = dbData[0]?.settings || {};
      // Get only keys where value is true
      const result = Object.keys(obj).filter((key) => obj[key]);
      setDeliveryModes(result || []);
    };

    loadData();
  }, [isPopupOpen]);

  const handleChange = (e) => {
    const input = e.target.value;
    if (!input.startsWith("+1")) {
      setMobileNumber("+1");
      return;
    }
    const formatted = formatPhoneNumber(input);
    setMobileNumber(formatted);
  };

  const handleNameChange = (e) => {
    const input = e.target.value;
    setName(input);
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
          } catch (error) {
            console.error("Error fetching address:", error);
          }
        },
        (err) => console.error("Error getting location:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleOrderNow = async (e) => {
    setIsLoading(true);
    setIsPopupOpen(false);
    e.preventDefault();

    // Validate mobile number for non-dine-in orders
    // const mobileRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;
    // if (
    //   orderMode !== "dinein" &&
    //   (!mobileNumber || !mobileRegex.test(mobileNumber.trim()))
    // ) {
    //   setMobileError("Please enter a valid mobile number.");
    //   setIsLoading(false);
    //   setIsPopupOpen(true);
    //   return;
    // }
    // setMobileError("");

    // // Validate email (CRITICAL - this must happen first)

    // if (orderMode !== "dinein") {
    //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //   if (!email || !emailRegex.test(email.trim())) {
    //     setEmailError("Please enter a valid email address.");
    //     setIsLoading(false);
    //     setIsPopupOpen(true);
    //     return;
    //   }

    //   if (!name || name.trim().length < 2) {
    //     setNameError("Name cannot be empty");
    //     setIsLoading(false);
    //     setIsPopupOpen(true);
    //     return;
    //   }
    // }
    setEmailError("");

    // Validate address for delivery
    if (orderMode === "delivery" && !address) {
      setAddressError("Please enter a valid delivery address.");
      setIsLoading(false);
      setIsPopupOpen(true);
      return;
    }
    setAddressError("");

    let userConfirmed = window.confirm("Shall we finalize your order ?");

    if (!userConfirmed) {
      // User clicked "OK", proceed with deletion
      return;
    }

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const finalTotalAmount = totalAmount * 1.06;
    const salesTaxAmount = totalAmount * 0.06;

    // Store final amount for success popup
    setFinalOrderAmount(finalTotalAmount);
    const orderData = {
      orderNumber: String(orderId),
      customer: {
        name: name.trim() || "Guest",
        phone: String(mobileNumber),
        email: email.trim(),
      },
      orderType: String(orderMode),
      tableNumber: orderMode === "dinein" ? String(`T${tableNumber}`) : "0",
      // address: orderMode === "delivery" ? String(address) : undefined,
      deliveryAddress: "NA",
      deliveryInstructions: "NA",
      items: Object.entries(cartItems).map(
        ([name, { quantity, basePrice, price, spiceLevel, addons }]) => ({
          name,
          quantity,
          basePrice,
          price,
          spiceLevel,
          addons,
        })
      ),
      subTotal: parseFloat(totalAmount.toFixed(2)),
      salesTax: parseFloat(salesTaxAmount.toFixed(2)),
      totalAmount: parseFloat(finalTotalAmount.toFixed(2)),
      status: "pending",
    };

    try {
      // First, save order to database
      const dbResponse = await fetch("/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save order.");
      }

      if (orderMode !== "dinein") {
        setOnlinePaymentAmount(parseFloat(finalTotalAmount.toFixed(2)));
        setIsPaymentPopupOpen(true);
        setSuccessOrderId(orderId);
        setIsPopupOpen(false);
        setMobileNumber("+1");
        setTableNumber("1");
        setEmail("");
        setName("");
        setAddress("");
        dispatch(clearCart());
        setIsLoading(false);
      } else {
        setSuccessOrderId(orderId);
        setIsSuccessPopupOpen(true);
        setIsPopupOpen(false);
        setMobileNumber("+1");
        setTableNumber("1");
        setEmail("");
        setName("");
        setAddress("");
        dispatch(clearCart());
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Order process error:", err);
      alert(
        `We're sorry, your order couldn't be placed (Error: ${err.message}). Please call us directly.`
      );
    } finally {
      setIsLoading(false);
    }
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
        </div>
      </div>
    );
  };

  const PaymentPopup = () => {
    const [cardNumber, setCardNumber] = useState("");
    const [expMonth, setExpMonth] = useState("");
    const [expYear, setExpYear] = useState("");
    const [cvv, setCvv] = useState("");

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
        alert("Invalid Expiry Month ");
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
          clientKey:
            "3p45FqNUmcJ7ch57c4d2qyZ4G4ktE52UN6vL6Rpd7P4j5b3ca3zgw6r6C8LVwfuF", // from sandbox or production
          apiLoginID: "4nhA365NPUm", // from sandbox or production
        },
        cardData: { cardNumber, month: expMonth, year: expYear, cardCode: cvv },
      };

      if (!window.Accept || !window.Accept.dispatchData) {
        alert("Payment library not loaded");
        return;
      }

      // Wrap dispatchData in a Promise to use async/await
      const response = await new Promise((resolve, reject) => {
        window.Accept.dispatchData(secureData, (res) => {
          console.log(res);
          if (res.messages.resultCode === "Error") {
            reject(res.messages.message[0].text);
          } else {
            resolve(res);
          }
        });
      });

      const dbResponse = await fetch("/order/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opaqueData: response.opaqueData,
          amount: onlinePaymentAmount,
          orderId: successOrderId,
        }),
      });

      const result = await dbResponse.json();
      if (result.code === 200) {
        setIsLoading(false);
        alert("Payment successful!");
      } else {
        setIsLoading(false);
        alert("Payment failure, Please pay at counter!");
      }
    };

    return (
      <div className="payment-overlay">
        <div className="payment-card">
          <h2>Payment Details</h2>
          <strong style={{ color: "black" }}>
            {" "}
            Order Created Successfully: {successOrderId}
          </strong>
          <br />
          <br />
          <p style={{ color: "black" }}>
            Pay now or skip and settle at the counter
          </p>
          <br />
          <hr />
          <br />
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

            <button type="submit" className="payment-button">
              Pay ${onlinePaymentAmount}
            </button>
            <button
              type="submit"
              className="close-button"
              onClick={() => setIsPaymentPopupOpen(false)}
            >
              Close
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
            width: 6rem; /* smaller width */
            font-size: 14px; /* slightly smaller font */
            padding: 8px 10px;
          }

          .payment-input.small {
            flex: 1;
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
          .close-button {
            padding: 14px;
            font-size: 16px;
            font-weight: bold;
            color: #fff;
            background: linear-gradient(90deg, red, red);
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

  const CartItem = ({ itemKey, item }) => {
    const basePrice = parseFloat(item.basePrice || item.price);
    const [quantity, setQuantity] = useState(item.quantity);
    const [totalPrice, setTotalPrice] = useState(basePrice * item.quantity);

    const updateCart = async (newQuantity) => {
      try {
        let cart = JSON.parse(localStorage.getItem("cart")).items || {};

        if (cart[itemKey]) {
          if (newQuantity <= 0) {
            delete cart[itemKey];
          } else {
            cart[itemKey].quantity = newQuantity;
            cart[itemKey].basePrice = basePrice.toFixed(2); // unit price
            cart[itemKey].price = (newQuantity * basePrice).toFixed(2); // total price
          }
        }

        setCartItems(cart);
        localStorage.setItem(
          "cart",
          JSON.stringify({ items: cart, totalItems: Object.keys(cart).length })
        );
        dispatch(rehydrateCart());
      } catch (err) {
        console.error("Error updating cart:", err);
      }
    };

    const handleIncrease = () => {
      const newQty = quantity + 1;
      setQuantity(newQty);
      setTotalPrice(newQty * basePrice);
      updateCart(newQty);
    };

    const handleDecrease = () => {
      const newQty = quantity - 1;
      if (newQty >= 1) {
        setQuantity(newQty);
        setTotalPrice(newQty * basePrice);
        updateCart(newQty);
      } else {
        setQuantity(0);
        setTotalPrice(0);
        updateCart(0);
      }
    };

    return (
      <View style={{ flexDirection: "row", alignItems: "center", margin: 10 }}>
        <TouchableOpacity
          onPress={handleDecrease}
          style={{ marginHorizontal: 10 }}
        >
          <FaMinus name="minus" color="red" />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18 }}>{quantity}</Text>
        </View>

        <TouchableOpacity
          onPress={handleIncrease}
          style={{ marginHorizontal: 10 }}
        >
          <FaPlus name="plus" color="green" />
        </TouchableOpacity>
      </View>
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
      {isPaymentPopupOpen && <PaymentPopup />}

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
              <img className="header-logo" src="../logo.png" alt="logo" />
            </div>
            {/* <AnniversaryPopup /> */}
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
              {/* <div
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
              </div> */}
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
                textAlign: "center",
                position: "relative",
                background: "white",
                width: "90vw",
                maxWidth: "520px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxSizing: "border-box",
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
                    overflowY:
                      Object.keys(cartItems).length > 5 ? "scroll" : "auto",
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
                      {Object.entries(cartItems).map(
                        ([name, { quantity, price, spiceLevel, addons }]) => (
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
                              {name.split("_")[0]}
                              {spiceLevel ? (
                                <span style={{ color: "red" }}>
                                  {" "}
                                  - {spiceLevel}
                                </span>
                              ) : (
                                ""
                              )}

                              {addons && addons.length > 0 && (
                                <>
                                  <br />
                                  <small>
                                    Addons:{" "}
                                    {addons
                                      .map((a) => `${a.name} (+$${a.price})`)
                                      .join(", ")}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              {" "}
                              <CartItem itemKey={name} item={cartItems[name]} />
                            </td>
                            <td>{price}</td>
                          </tr>
                        )
                      )}
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
                  <input
                    type="email"
                    placeholder="Email (Required for order confirmation)"
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
                  <input
                    type="tel"
                    placeholder="Name"
                    value={name}
                    onChange={handleNameChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginTop: "5px",
                      marginBottom: "5px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  {nameError && (
                    <div style={{ color: "red", marginBottom: "15px" }}>
                      {nameError}
                    </div>
                  )}
                </>
              )}

              <br />
              <br />

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
                style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "5rem",
                  justifyContent: "space-evenly",
                }}
              >
                {/* {["dinein", "pickup", "delivery"].map((mode) => ( */}
                {deliveryModes.map((mode) => (
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
                      onChange={() => {
                        setOrderMode(mode);
                        if (mode === "pickup") {
                          setAddress("Pickup");
                        }
                      }}
                      style={{ marginBottom: "3px" }}
                    />
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </label>
                ))}
              </div>

              {orderMode === "delivery" && (
                <>
                  <br />
                  <button
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
                    onChange={(e) => setAddress(e.target.value)}
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
              {(deliveryModes.includes("dinein") ||
                deliveryModes.includes("pickup") ||
                deliveryModes.includes("delivery")) && (
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
              )}
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

        <div
          style={{
            position: "fixed", // make it float
            bottom: "20px", // distance from bottom
            right: "20px", // distance from right
            display: "inline-block",
            zIndex: 1000, // keeps it on top of other elements
          }}
        >
          <button
            aria-label="Cart"
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "24px",
            }}
            onClick={(e) => {
              e.preventDefault();
              handleCartClick();
            }}
          >
            <FaShoppingCart size={38} />
          </button>

          {Object.keys(localStorageCartItems).length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
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
              {Object.keys(localStorageCartItems).length}
            </span>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;
