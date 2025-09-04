import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaMinus, FaCheck, FaCheckCircle } from "react-icons/fa";
import { updateQuantity, rehydrateCart } from "../cartSlice";
import { useState, useEffect } from "react";
import "./MenuCards.css";

function Menu() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const [notification, setNotification] = useState(null);
  const [menuSections, setMenuSections] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedSpice, setSelectedSpice] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);

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

  const handleQuantityChange = (
    itemName,
    change,
    price,
    basePrice,
    spicelevel,
    addons
  ) => {
    // If spicelevel or addons exist, open popup for user choice
    if (change === 1 && (spicelevel?.length || addons?.length)) {
      setPendingAction({
        itemName,
        change,
        price,
        basePrice,
        spicelevel,
        addons,
      });
      setSelectedSpice(""); // force user to pick
      setSelectedAddons([]);
      setShowPopup(true);
      return;
    }

    proceedWithUpdate({ itemName, change, price, basePrice });
  };
  const proceedWithUpdate = ({
    itemName,
    change,
    price,
    basePrice,
    spiceLevel,
    addons,
  }) => {
    dispatch(rehydrateCart());

    dispatch(
      updateQuantity({
        itemName,
        change,
        price,
        basePrice,
        spiceLevel,
        addons,
      })
    );

    if (change === 1) {
      const currentQty = cartItems[itemName]?.quantity || 0;
      const newQty = currentQty + change;

      setNotification(
        <>
          <span>
            {itemName} ({newQty}) added!
          </span>
          <br />
          <span style={{ fontSize: "0.8em", color: "#555" }}>
            Finalize cart, then place order at cart icon on top
          </span>
        </>
      );
      setTimeout(() => setNotification(null), 1500);
    }
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(
      (prev) =>
        prev.some((a) => a.name === addon.name)
          ? prev.filter((a) => a.name !== addon.name)
          : [...prev, addon] // ✅ store full object, not just name
    );
  };

  return (
    <>
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
                    // ✅ Sum all cart quantities for this item name (ignoring spiceLevel/addons)
                    const qty = Object.values(cartItems).reduce(
                      (sum, cartItem) => {
                        return cartItem.itemName === item.name
                          ? sum + cartItem.quantity
                          : sum;
                      },
                      0
                    );

                    const price = item.newPrice || item.price || 0;
                    const basePrice = item.price || 0;

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
                          {/* <FaMinus
                            style={{
                              cursor: "pointer",
                              fontSize: "16px",
                              marginRight: "5px",
                            }}
                            onClick={() =>
                              handleQuantityChange(
                                item.name,
                                -1,
                                price,
                                item.spicelevel,
                                item.addons
                              )
                            }
                          /> */}
                          {/* <span
                            style={{
                              fontSize: "16px",
                              width: "20px",
                              textAlign: "center",
                            }}
                          >
                            {qty}
                          </span> */}

                          {/* {qty === 0 && ( */}
                          <FaCheck
                            style={{
                              cursor: "pointer",
                              fontSize: "16px",
                              marginLeft: "5px",
                            }}
                            onClick={(e) =>
                              handleQuantityChange(
                                item.name,
                                1,
                                price,
                                basePrice,
                                item.spicelevel,
                                item.addons,
                                e
                              )
                            }
                          />
                          {/* )} */}

                          {/* {qty > 0 && (
                            <FaCheckCircle
                              style={{
                                cursor: "pointer",
                                fontSize: "16px",
                                marginLeft: "5px",
                              }}
                            />
                          )} */}
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

      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "300px",
              color: "black",
            }}
          >
            {/* Spice Level */}
            {pendingAction?.spicelevel?.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <strong>Spice Level:</strong>
                {pendingAction.spicelevel.map((level) => (
                  <div key={level} style={{ marginTop: "5px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <input
                        type="radio"
                        name="spice"
                        value={level}
                        checked={selectedSpice === level}
                        onChange={() => setSelectedSpice(level)}
                        style={{ marginRight: "6px" }}
                      />
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Addons */}
            {pendingAction?.addons?.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <strong>Addons:</strong>
                {pendingAction.addons.map((addon) => (
                  <div key={addon.name} style={{ marginTop: "5px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <input
                        type="checkbox"
                        value={addon.name}
                        checked={selectedAddons.some(
                          (a) => a.name === addon.name
                        )}
                        onChange={() => toggleAddon(addon)}
                      />
                      {addon.name} (+${addon.price})
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                disabled={!selectedSpice && pendingAction?.spicelevel?.length}
                onClick={() => {
                  proceedWithUpdate({
                    ...pendingAction,
                    spiceLevel: selectedSpice,
                    addons: selectedAddons, // ✅ full objects
                  });
                  setShowPopup(false);
                  setPendingAction(null);
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setPendingAction(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Menu;
