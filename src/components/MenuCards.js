import React from "react";
import { useDispatch, useSelector } from "react-redux"; // Added useSelector
import { FaPlus, FaMinus } from "react-icons/fa";
import menuData from "./menuData.json";
import { updateQuantity } from "../cartSlice";

function Menu() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items); // Get cart items from Redux state

  const handleQuantityChange = (itemName, change) => {
    dispatch(updateQuantity({ itemName, change }));
  };

  return (
    <div className="menu-container">
      <h1
        style={{
          textAlign: "center",
          // margin: "60px 0 20px",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        Our Menu
      </h1>
      <div className="menu-sections">
        {menuData.menuSections.map((section, index) => (
          <div key={index} className="menu-section">
            <h2
              className={`section-title ${
                section.title.includes("Non-Veg") ||
                section.title.includes("N Veg")
                  ? "non-veg"
                  : ""
              }`}
            >
              {section.title}
            </h2>
            <ul className="menu-items">
              {section.items.map((item, itemIndex) => {
                const qty = cartItems[item.name] || 0;
                return (
                  <li
                    key={itemIndex}
                    className="menu-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ flex: "1", background: "white" }}>
                      {item.name}
                    </span>
                    <span
                      className="price"
                      style={{
                        margin: "0 10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.newPrice && (
                        <span className="new-price">{item.newPrice}</span>
                      )}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "white",
                      }}
                    >
                      <FaMinus
                        style={{
                          cursor: "pointer",
                          fontSize: "16px",
                          marginRight: "5px",
                          color: qty > 0 ? "#f4a261" : "#ccc",
                          background: "white",
                        }}
                        onClick={() => handleQuantityChange(item.name, -1)}
                      />
                      <span
                        style={{
                          fontSize: "16px",
                          width: "20px",
                          textAlign: "center",
                          background: "white",
                        }}
                      >
                        {qty}
                      </span>
                      <FaPlus
                        style={{
                          cursor: "pointer",
                          fontSize: "16px",
                          marginLeft: "5px",
                          color: "#f4a261",
                          background: "white",
                        }}
                        onClick={() => handleQuantityChange(item.name, 1)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Menu;