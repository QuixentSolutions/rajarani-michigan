import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaMinus } from "react-icons/fa";

import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native-web";

import { updateQuantity } from "../cartSlice";
import { useState, useEffect } from "react";
import "./MenuCards.css";

function Menu() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [notification, setNotification] = useState(null);
  const [menuSections, setMenuSections] = useState([]);
  const [spiceLevelPopup, setIsSpiceLevelPopup] = useState(false);
  // const [spiceLevels, setSpiceLevels] = useState([]);
  // const [selectedSpiceLevel, setSelectedSpiceLevel] = useState("");

  // const [itemName, setItemName] = useState("");
  // const [change, setChange] = useState("");
  // const [price, setPrice] = useState("");

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
    spicelevel,
    addons,
    event
  ) => {
    // Dispatch the action first

    //TODO - Ask confiration for spice level if item has spice level
    console.log("spicelevel", spicelevel);
    console.log("addons", addons);

    dispatch(updateQuantity({ itemName, change, price }));

    if (change === 1) {
      // Calculate the new quantity based on the current cart state and the change
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
      setTimeout(() => {
        setNotification(null);
      }, 1500);
    }
  };

  // const handleQuantitySpiceLevelChange = (event) => {
  //   dispatch(updateQuantity({ itemName, change, price, selectedSpiceLevel }));

  //   if (change === 1) {
  //     // Calculate the new quantity based on the current cart state and the change
  //     const currentQty = cartItems[itemName]?.quantity || 0;
  //     const newQty = currentQty + change;
  //     setNotification(
  //       <>
  //         <span>
  //           {itemName} ({newQty}) - {selectedSpiceLevel} added!
  //         </span>
  //         <br />
  //         <span style={{ fontSize: "0.8em", color: "#555" }}>
  //           Finalize cart, then place order at cart icon on top
  //         </span>
  //       </>
  //     );
  //     setTimeout(() => {
  //       setNotification(null);
  //     }, 1500);

  //     setItemName("");
  //     setChange("");
  //     setPrice("");
  //   }
  // };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: 300,
      padding: 20,
      backgroundColor: "white",
      borderRadius: 10,
      alignItems: "center",
    },
    modalText: {
      fontSize: 18,
      marginBottom: 20,
    },
    closeButton: {
      backgroundColor: "#FB7802",
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 5,
    },
    closeButtonText: {
      color: "white",
      fontSize: 16,
    },
  });
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
                              handleQuantityChange(
                                item.name,
                                -1,
                                price,
                                item.spicelevel,
                                item.addons
                              )
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
                              handleQuantityChange(
                                item.name,
                                1,
                                price,
                                item.spicelevel,
                                item.addons,
                                e
                              )
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

      {/* <View style={styles.container}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={spiceLevelPopup}
          onRequestClose={() => setIsSpiceLevelPopup(false)} // For Android back button
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Spice Level</Text>

              <select
                style={{
                  padding: "10px 15px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                  fontSize: "16px",
                  color: "#333",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onChange={(e) => setSelectedSpiceLevel(e.target.value)}
              >
                {spiceLevels &&
                  spiceLevels.map((level, index) => (
                    <option key={index} value={level}>
                      {level}
                    </option>
                  ))}
              </select>
              <br />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsSpiceLevelPopup(false)}
              >
                <Text
                  style={styles.closeButtonText}
                  onClick={(e) =>
                    handleQuantitySpiceLevelChange(e.target.value)
                  }
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View> */}
    </>
  );
}

export default Menu;
