import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  FaFacebookF,
  FaInstagram,
  FaShoppingCart,
} from "react-icons/fa";
import { FaYelp, FaGoogle } from "react-icons/fa";

function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const totalItems = useSelector((state) => state.cart.totalItems);
  const cartItems = useSelector((state) => state.cart.items);

  const handleCartClick = () => {
    setIsPopupOpen(true);
  };

  const handleOrderNow = () => {
    const orderData = {
      mobileNumber,
      tableNumber,
      items: Object.entries(cartItems).map(([name, qty]) => ({
        name,
        quantity: qty,
      })),
    };
    console.log("Order Data:", orderData);
    setIsPopupOpen(false);
    setMobileNumber("");
    setTableNumber("");
  };

  const handleOrderOnline = () => {
    console.log("Order Online clicked - Placeholder for online ordering");
    setIsPopupOpen(false);
  };

  return (
    <header>
      <div className="header-container">
        <div className="nav">
          <div className="logo">
            <img
              className="header-logo"
              src="https://cd519987.rajarani-website.pages.dev/images/logosmall.png"
              alt="logo"
            />
          </div>
          <div className="social-icons">
            <a
              href="https://www.facebook.com/people/RAJA-RANI-Indian-Restaurant/100085630432560/"
              aria-label="Facebook"
            >
              <FaFacebookF size={24} />
            </a>
            <a
              href="https://www.instagram.com/raja_rani_indian_restaurant/"
              aria-label="Instagram"
            >
              <FaInstagram size={24} />
            </a>
            <a
              href="https://www.yelp.com/biz/raja-rani-indian-restaurant-canton"
              aria-label="Yelp"
              style={{ marginRight: "10px" }}
            >
              <FaYelp size={24} />
            </a>
            <a
              href="https://www.google.com/search?q=Raja+Rani+Restaurant&stick=H4sIAAAAAAAA_-NgU1I1qLCwME4yNTZMMTZPsTQ0MjK2MqhISbKwNDI0MzK0MDCySDNOWsQqEpSYlagQlJiXqRCUWlySWFqUmFcCAG2OMVdAAAAA&hl=en-GB&mat=CXkHHWDwBxApElcB8pgkaH1MxZK1YEYmOhr9L--IjKRUUN5SaGQDfjKXvZuHgOkyez4TJObGNWdGEsBGtuymvcWTJ0VYn47nPHxgyISdH8w_QHoLHJgIPbP9UAs8dZA7Ef8&authuser=0"
              aria-label="Google"
            >
              <FaGoogle size={24} />
            </a>
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
                style={{    border: "none",
    background: "#fddfa0",
    color: "black",
    cursor: "pointer"}}
                // style={{ color: "#000", textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  handleCartClick();
                }}
              >
                <FaShoppingCart size={24} />
              </button>
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    backgroundColor: "#f4a261",
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
            <h3 style={{ marginBottom: "15px", color: "#f4a261",background: "white" }}>
              Place Your Order
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
              type="number"
              placeholder="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={handleOrderNow}
              style={{
                backgroundColor: "#f4a261",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Order Now
            </button>
            <button
              onClick={handleOrderOnline}
              style={{
                backgroundColor: "#ccc",
                color: "#000",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Order Online
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
                color: "#f4a261",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;