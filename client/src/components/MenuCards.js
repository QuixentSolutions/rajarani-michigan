import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaMinus } from "react-icons/fa";

import { updateQuantity } from "../cartSlice";
import { useState, useEffect } from "react";
import "./MenuCards.css";

function Menu() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [notification, setNotification] = useState(null);
  const [menuSections, setMenuSections] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`/menu`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Correctly extract the 'sections' array from the API response
        setMenuSections(data.sections || []);
      } catch (error) {
        console.error("Failed to fetch menu data:", error);
        setMenuSections([]); // Set to empty array on error
      }
    };

    fetchMenu();
  }, []);

  const handleQuantityChange = (itemName, change, price, event) => {
    // Dispatch the action first
    dispatch(updateQuantity({ itemName, change, price }));

    if (change === 1) {
      // Calculate the new quantity based on the current cart state and the change
      const currentQty = cartItems[itemName]?.quantity || 0;
      const newQty = currentQty + change;
      setNotification(
        <span>
          {itemName} ({newQty}) added!
        </span>
      );
      setTimeout(() => {
        setNotification(null);
      }, 1500);
    }
  };

  return (
    <div className="menu-container">
      {notification && (
        <div className="item-added-notification">{notification}</div>
      )}
      <h1
        style={{
          textAlign: "center",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        OUR MENU
      </h1>
      <div
        className="section-titles"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        {menuSections.map((section, index) => {
          // eslint-disable-next-line
          const sectionId = section.title.replace(/[\/\s]+/g, "-"); // Replace / and spaces with -
          console.log(sectionId);
          return (
            <a
              key={index}
              href={`#${sectionId}`}
              style={{
                textDecoration: "none",
                color: "white",
                fontWeight: "bold",
                padding: "5px 10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
                backgroundColor: section.color,
              }}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(`#${sectionId}`);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              {section.title}
            </a>
          );
        })}
      </div>
      <div className="menu-sections">
        {menuSections.map((section, index) => {
          // eslint-disable-next-line
          const sectionId = section.title.replace(/[\/\s]+/g, "-"); // Replace / and spaces with -
          return (
            <div key={index} className="menu-section">
              <h2
                id={sectionId}
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontWeight: "bold",
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  cursor: "pointer",
                  backgroundColor: section.color,
                }}
                className={`section-title`}
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
                        }}
                      >
                        <FaMinus
                          style={{
                            cursor: "pointer",
                            fontSize: "16px",
                            marginRight: "5px",
                          }}
                          onClick={() =>
                            handleQuantityChange(item.name, -1, price)
                          }
                        />
                        <span
                          style={{
                            fontSize: "16px",
                            width: "20px",
                            textAlign: "center",
                          }}
                        >
                          {qty}
                        </span>
                        <FaPlus
                          style={{
                            cursor: "pointer",
                            fontSize: "16px",
                            marginLeft: "5px",
                          }}
                          onClick={(e) =>
                            handleQuantityChange(item.name, 1, price, e)
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Menu;
