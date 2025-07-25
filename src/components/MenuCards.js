import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaMinus } from "react-icons/fa";
import menuData from "./menuData.json";
import { updateQuantity } from "../cartSlice";

function Menu() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const handleQuantityChange = (itemName, change, price) => {
    dispatch(updateQuantity({ itemName, change, price }));
  };

  return (
    <div className="menu-container">
      <h1
        style={{
          textAlign: "center",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        OUR MENU
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
                const qty = cartItems[item.name]?.quantity || 0;
                const price = item.newPrice || item.price || 0; 
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
                      {!item.newPrice && item.price && (
                        <span className="price">{item.price}</span>
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
                          color: qty > 0 ? "#333333" : "#ccc",
                          background: "white",
                        }}
                        onClick={() => handleQuantityChange(item.name, -1, price)}
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
                          color: "#333333",
                          background: "white",
                        }}
                        onClick={() => handleQuantityChange(item.name, 1, price)}
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