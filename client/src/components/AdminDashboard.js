"use client";
import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const AdminDashboard = ({ onLogout }) => {
  const [authToken] = useState("Basic " + btoa("admin:password123"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("registrations");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);

  const [lastOnlineOrderNo, setLastOnlineOrderNo] = useState(0);

  const [registrations, setRegistrations] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [orders, setOrders] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [kitchenOrders, setKitchenOrders] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  const [menuData, setMenuData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  const [selected, setSelected] = useState({
    dinein: null,
    pickup: null,
    delivery: null,
  });

  const [tableStatuses, setTableStatuses] = useState([]);
  const [pickupOrders, setPickupOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [searchRegistrationQuery, setSearchRegistrationQuery] = useState("");
  const [searchOrderQuery, setSearchOrderQuery] = useState("");
  const [searchMenuQuery, setSearchMenuQuery] = useState("");

  const [tableNo, setTableNo] = useState("");
  const [billDetails, setBillDetails] = useState(null);

  // Simplified menu item state without addons and spice levels CRUD
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    price: "",
    spicelevel: [],
    addons: [],
  });

  const [tips, setTips] = useState(0);
  const [tipsPercentage, setTipsPercentage] = useState(0);

  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [editingItemData, setEditingItemData] = useState(null);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      if (typeof onLogout === "function") {
        onLogout();
      } else {
        window.location.href = "/admin";
      }
    }
  };

  const fetchData = useCallback(
    async (url, token, retryCount = 0) => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 429) {
          if (retryCount < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, (retryCount + 1) * 2000)
            );
            return fetchData(url, token, retryCount + 1);
          } else {
            throw new Error(
              "Server is busy. Please wait a moment and refresh the page."
            );
          }
        }

        if (response.status === 401) {
          if (typeof onLogout === "function") {
            onLogout();
          } else {
            window.location.href = "/admin";
          }
          return;
        }

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || `Server error (${response.status})`
            );
          } else {
            throw new Error(
              `Server returned ${response.status}. Please check if the backend is running on http://localhost:5001`
            );
          }
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Server returned HTML instead of JSON. Please check if your backend API is running correctly."
          );
        }

        return response.json();
      } catch (error) {
        if (
          error.name === "TypeError" &&
          error.message.includes("Failed to fetch")
        ) {
          throw new Error(
            "Unable to connect to server. Please check if your backend is running on http://localhost:5001"
          );
        }
        throw error;
      }
    },
    [onLogout]
  );

  const createFetchFunction = useCallback(
    (setter, type) =>
      async (page = 1, searchQuery = "") => {
        try {
          setError("");
          const url = `/${type}?page=${page}${
            searchQuery ? `&search=${searchQuery}` : ""
          }`;
          const data = await fetchData(url, authToken);
          let result; // Declare result here

          if (data && typeof data === "object") {
            if (Array.isArray(data)) {
              result = { items: data, totalPages: 1, currentPage: 1 };
            } else if (type === "menu/all" && data.sections) {
              result = {
                items: data.sections || [],
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || page,
              };
            } else if (data.items || data.data) {
              result = {
                items: data.items || data.data || [],
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || page,
              };
            } else {
              result = { items: [], totalPages: 1, currentPage: 1 };
            }
          } else {
            result = { items: [], totalPages: 1, currentPage: 1 };
          }
          setter(result); // Set the state
          return result; // Return the structured data
        } catch (err) {
          setError(`Failed to load ${type}: ${err.message}`);
          const errorResult = { items: [], totalPages: 1, currentPage: 1 };
          setter(errorResult); // Set state to empty on error
          return errorResult; // Return empty data on error
        }
      },
    [authToken, fetchData]
  );

  const fetchRegistrations = createFetchFunction(setRegistrations, "register");
  const fetchOrders = createFetchFunction(setOrders, "order");
  const fetchMenuData = createFetchFunction(setMenuData, "menu/all");
  const fetchKitchenOrders = createFetchFunction(setKitchenOrders, "order/kitchen");

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Simplified addMenuItem function without addons and spice levels CRUD
  const addMenuItem = async () => {
    if (!selectedSection || !newMenuItem.name || !newMenuItem.price) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const url = `http://localhost:5001/menu/category/${selectedSection._id}/item`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: newMenuItem.name, 
          price: parseFloat(newMenuItem.price),
          spicelevel: newMenuItem.spicelevel,
          addons: newMenuItem.addons.map(addon => ({
            ...addon,
            name: addon.name.replace(/^Add\s/, '').trim() // Remove "Add " prefix
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      setSuccess("Menu item added successfully!");
      setNewMenuItem({ name: "", price: "", spicelevel: [], addons: [] });

      const latestMenuData = await fetchMenuData(); // Fetch and get the latest data
      if (latestMenuData && latestMenuData.items) {
        setMenuData(latestMenuData); // Update the main menu data state
        const updatedSection = latestMenuData.items.find(
          (section) => section._id === selectedSection._id
        );
        if (updatedSection) {
          setSelectedSection(updatedSection); // Update selected section from the new menu data
        }
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to add menu item: ${err.message}. Make sure your server is running on port 5001.`
      );
    }
  };

  // Simplified updateMenuItem function
  const updateMenuItem = async (itemToUpdate, updatedFields) => {
    try {
      if (!itemToUpdate || !itemToUpdate._id) {
        throw new Error("Invalid item - no ID found");
      }

      if (!selectedSection || !selectedSection._id) {
        throw new Error("No section selected");
      }

      const url = `http://localhost:5001/menu/category/${selectedSection._id}/item/${itemToUpdate._id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedFields.name,
          price: parseFloat(updatedFields.price),
          spicelevel: updatedFields.spicelevel,
          addons: updatedFields.addons,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += `: ${errorData.message || "Update failed"}`;
        } catch {
          errorMessage += `: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      setSuccess("Menu item updated successfully!");
      setEditingMenuItem(null);
      setEditingItemData(null);

      const latestMenuData = await fetchMenuData(); // Fetch and get the latest data
      if (latestMenuData && latestMenuData.items) {
        setMenuData(latestMenuData); // Update the main menu data state
        const updatedSection = latestMenuData.items.find(
          (section) => section._id === selectedSection._id
        );
        if (updatedSection) {
          setSelectedSection(updatedSection); // Update selected section from the new menu data
        }
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to update menu item: ${err.message}`);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      if (!selectedSection || !selectedSection._id) {
        throw new Error("No section selected");
      }

      const url = `http://localhost:5001/menu/category/${selectedSection._id}/item/${itemId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += `: ${errorData.message || "Delete failed"}`;
        } catch {
          errorMessage += `: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      setSuccess("Menu item deleted successfully!");

      const latestMenuData = await fetchMenuData(); // Fetch and get the latest data
      if (latestMenuData && latestMenuData.items) {
        const updatedSection = latestMenuData.items.find(
          (section) => section._id === selectedSection._id
        );
        if (updatedSection) {
          setSelectedSection(updatedSection);
        }
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to delete menu item: ${err.message}`);
    }
  };

  // Remove all addon and spice level management functions

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");

      const fakeTableData = [
        { tableNumber: "T1", status: "Available" },
        { tableNumber: "T2", status: "Available" },
        { tableNumber: "T3", status: "Available" },
        { tableNumber: "T4", status: "Available" },
        { tableNumber: "T5", status: "Available" },
        { tableNumber: "T6", status: "Available" },
        { tableNumber: "T7", status: "Available" },
        { tableNumber: "T8", status: "Available" },
        { tableNumber: "T9", status: "Available" },
        { tableNumber: "T10", status: "Available" },
      ];
      setTableStatuses(fakeTableData);

      try {
        await fetchRegistrations();
        await fetchOrders();
        await fetchMenuData();
        await fetchKitchenOrders();

        setSuccess("Dashboard loaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        setError(
          "Failed to load dashboard data. Please refresh and try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
      setSelected(obj);
    };

    loadData();
  }, []);

  const showBill = async (tableNo) => {
    try {
      setTableNo(tableNo);
      const response = await fetch(`/order/table/${tableNo}`, {
        method: "GET",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Server responded with ${response.status}: ${
            errorData.message || "Failed to update status"
          }`
        );
      }

      const result = await response.json();

      if (result.items.length === 0) {
        alert("No pending orders for this table");
        return;
      }
      setBillDetails(result);
      setIsSuccessPopupOpen(true);
    } catch (err) {
      // console.error("Error loading order:", err);
    }
  };
  
  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Loading dashboard data...</p>
    </div>
  );

  const handleView = (item, type) => {
    setSelectedItem(item);
    setModalType(`view-${type}`);
    setShowModal(true);
  };

  const handleSaveMenu = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5001/menu`, {
        method: "POST",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: menuData.items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Server responded with ${response.status}: ${
            errorData.message || "Failed to update status"
          }`
        );
      }
      await fetchMenuData();
      setIsLoading(false);
      setSuccess("Menu updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to save menu: ${err.message}`);
    }
  };

  const renderPagination = (data, fetcher) => {
    if (!data || data.totalPages <= 1) return null;

    const pages = [];
    const currentPage = data.currentPage;
    const totalPages = data.totalPages;

    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => fetcher(currentPage - 1)}
          className="pagination-btn"
        >
          ← Previous
        </button>
      );
    }

    for (
      let i = Math.max(1, currentPage - 2);
      i <= Math.min(totalPages, currentPage + 2);
      i++
    ) {
      pages.push(
        <button
          key={i}
          onClick={() => fetcher(i)}
          disabled={i === currentPage}
          className={`pagination-btn ${i === currentPage ? "active" : ""}`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => fetcher(currentPage + 1)}
          className="pagination-btn"
        >
          Next →
        </button>
      );
    }

    return (
      <div className="pagination-container">
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <div className="pagination-buttons">{pages}</div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const type = modalType?.replace("view-", "");
    let modalTitle;

    if (modalType === "manage-items") {
      modalTitle = `Manage Items - ${
        selectedSection?.title || selectedSection?.name || "Unknown Section"
      }`;
    } else {
      modalTitle = `View ${type}`;
    }

    return (
      <div
        className="modal-overlay"
        onClick={(e) =>
          e.target.className === "modal-overlay" && setShowModal(false)
        }
      >
        <div className="modal-content">
          <div className="modal-header">
            <h3>{modalTitle}</h3>
            <button onClick={() => setShowModal(false)} className="close-btn">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {modalType === "manage-items" && selectedSection && (
              <div className="items-management">
                <div className="existing-items-section">
                  <h4>Existing Items ({selectedSection.items?.length || 0})</h4>
                  <div className="items-grid">
                    {selectedSection.items?.map((item, index) => {
                      const itemKey = item._id || `item-${item.name}-${index}`;
                      const hasValidId = item._id && item._id !== "NO_ID";

                      return (
                        <div key={itemKey} className="item-card">
                          {editingMenuItem === item._id ? (
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editingItemData?.name || ""}
                                onChange={(e) => {
                                  setEditingItemData({
                                    ...editingItemData,
                                    name: e.target.value,
                                  });
                                }}
                                className="form-input"
                                placeholder="Item name"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={editingItemData?.price || ""}
                                onChange={(e) => {
                                  setEditingItemData({
                                    ...editingItemData,
                                    price: e.target.value,
                                  });
                                }}
                                className="form-input"
                                placeholder="Price"
                              />

                              {/* Spice Levels in edit mode */}
                              <div className="form-group">
                                <label>Spice Levels</label>
                                <div className="checkbox-group">
                                  {[...new Set([...["Mild", "Medium", "Hot", "Very Mild", "Indian Hot"], ...(editingItemData?.spicelevel || [])])].map((level) => (
                                    <label key={level} className="checkbox-label">
                                      <input
                                        type="checkbox"
                                        value={level}
                                        checked={editingItemData?.spicelevel?.includes(level) || false}
                                        onChange={(e) => {
                                          const { checked, value } = e.target;
                                          setEditingItemData((prev) => ({
                                            ...prev,
                                            spicelevel: checked
                                              ? [...(prev.spicelevel || []), value]
                                              : (prev.spicelevel || []).filter((l) => l !== value),
                                          }));
                                        }}
                                      />
                                      {level}
                                    </label>
                                  ))}
                                </div>
                                <div className="input-group" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add new spice level..."
                                    id="editSpiceLevelInput"
                                    className="form-input"
                                    style={{ flex: 2 }}
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById('editSpiceLevelInput');
                                      const value = input.value.trim();
                                      if (value !== '') {
                                        setEditingItemData((prev) => ({
                                          ...prev,
                                          spicelevel: [...(prev.spicelevel || []), value],
                                        }));
                                        input.value = '';
                                      }
                                    }}
                                    className="btn-secondary"
                                    style={{ flex: 0.5 }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                              <h4>Addons</h4>
                              <div className="form-group">
                                <label>Select Addons</label>
                                <div className="checkbox-group">
                                  {(() => {
                                    const predefinedAddons = [
                                      { name: "Veggies", price: 1 },
                                      { name: "Meat", price: 2 },
                                    ];
                                    const allAddonsMap = new Map();

                                    // Add predefined addons to the map
                                    predefinedAddons.forEach(addon => allAddonsMap.set(addon.name, addon));

                                    // Add existing item addons to the map, normalizing their names
                                    (editingItemData?.addons || []).forEach(addon => {
                                      const normalizedName = addon.name.replace(/^Add\s/, '').trim();
                                      if (!allAddonsMap.has(normalizedName)) {
                                        allAddonsMap.set(normalizedName, { ...addon, name: normalizedName });
                                      }
                                    });

                                    return Array.from(allAddonsMap.values()).map((addon) => (
                                      <label key={addon.name} className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          value={addon.name}
                                          checked={editingItemData?.addons?.some(selectedAddon => selectedAddon.name.replace(/^Add\s/, '').trim() === addon.name) || false}
                                          onChange={(e) => {
                                            const { checked, value } = e.target;
                                            setEditingItemData((prev) => {
                                              const newAddons = checked
                                                ? [...(prev.addons || []), { name: value, price: addon.price }]
                                                : (prev.addons || []).filter((selectedAddon) => selectedAddon.name.replace(/^Add\s/, '').trim() !== value);
                                              return { ...prev, addons: newAddons };
                                            });
                                          }}
                                        />
                                        {addon.name} (${addon.price})
                                      </label>
                                    ));
                                  })()}
                                </div>
                                <div className="input-group" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                  <input
                                    type="text"
                                    placeholder="Add new addon name..."
                                    id="editNewAddonNameInput"
                                    className="form-input"
                                    style={{ flex: 2 }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    id="editNewAddonPriceInput"
                                    className="form-input"
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    onClick={() => {
                                      const nameInput = document.getElementById('editNewAddonNameInput');
                                      const priceInput = document.getElementById('editNewAddonPriceInput');
                                      const name = nameInput.value.trim();
                                      const price = parseFloat(priceInput.value);

                                      if (name !== '' && !isNaN(price)) {
                                        setEditingItemData((prev) => ({
                                          ...prev,
                                          addons: [...(prev.addons || []), { name, price }],
                                        }));
                                        nameInput.value = '';
                                        priceInput.value = '';
                                      }
                                    }}
                                    className="btn-secondary"
                                    style={{ flex: 0.5 }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>

                              <div className="edit-actions">
                                <button
                                  onClick={() => {
                                    updateMenuItem(editingItemData, {
                                      name: editingItemData.name,
                                      price: editingItemData.price,
                                      spicelevel: editingItemData.spicelevel,
                                      addons: editingItemData.addons,
                                    });
                                  }}
                                  className="btn-success"
                                  disabled={!hasValidId}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMenuItem(null);
                                    setEditingItemData(null);
                                  }}
                                  className="btn-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="item-display">
                              <h5>{item.name}</h5>
                              <div className="price-info">
                                <span className="new-price">
                                  ${item.price}
                                </span>
                              </div>
                              
                              {/* Display Addons and Spice Levels */}
                              {(item.addons && item.addons.length > 0) || (item.spicelevel && item.spicelevel.length > 0) ? (
                                <div className="addons-display">
                                  {item.addons && item.addons.length > 0 && (
                                    <>
                                      <strong>Addons:</strong>
                                      <div className="addons-list-display">
                                        {item.addons.map((addon, index) => (
                                          <div key={index} className="addon-display">
                                            {addon.name.replace(/^Add\s/, '').trim()} - ${addon.price}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {item.spicelevel && item.spicelevel.length > 0 && (
                                    <div className="spice-levels-display">
                                      <strong>Spice Levels:</strong> {item.spicelevel.join(", ")}
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              <div className="item-actions">
                                <button
                                  onClick={() => {
                                    setEditingMenuItem(item._id);
                                    // Deep clone the item to ensure all properties are copied correctly
                                    setEditingItemData({
                                      ...item,
                                      spicelevel: [...(item.spicelevel || [])],
                                      addons: (item.addons || []).map(addon => ({
                                        ...addon,
                                        name: addon.name.replace(/^Add\s/, '').trim()
                                      }))
                                    });
                                  }}
                                  className="btn-edit"
                                  disabled={!hasValidId}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    deleteMenuItem(item._id);
                                  }}
                                  className="btn-delete"
                                  disabled={!hasValidId}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="add-item-section">
                  <h4>Add New Item</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Item Name *</label>
                      <input
                        type="text"
                        placeholder="Enter item name..."
                        value={newMenuItem.name}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            name: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newMenuItem.price}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            price: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Spice Levels</label>
                    <div className="checkbox-group">
                      {[...new Set([...["Mild", "Medium", "Hot", "Very Mild", "Indian Hot"], ...(newMenuItem.spicelevel || [])])].map((level) => (
                        <label key={level} className="checkbox-label">
                          <input
                            type="checkbox"
                            value={level}
                            checked={newMenuItem.spicelevel.includes(level)}
                            onChange={(e) => {
                              const { checked, value } = e.target;
                              setNewMenuItem((prev) => ({
                                ...prev,
                                spicelevel: checked
                                  ? [...prev.spicelevel, value]
                                  : prev.spicelevel.filter((l) => l !== value),
                              }));
                            }}
                          />
                          {level}
                        </label>
                      ))}
                    </div>
                    <div className="input-group" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Add new spice level..."
                        id="newSpiceLevelInput"
                        className="form-input"
                        style={{ flex: 2 }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('newSpiceLevelInput');
                          const value = input.value.trim();
                          if (value !== '') {
                            setNewMenuItem((prev) => ({
                              ...prev,
                              spicelevel: [...prev.spicelevel, value],
                            }));
                            input.value = '';
                          }
                        }}
                        className="btn-secondary"
                        style={{ flex: 0.5 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <h4>Addons</h4>
                  <div className="form-group">
                    <label>Select Addons</label>
                                <div className="checkbox-group">
                                  {(() => {
                                    const predefinedAddons = [
                                      { name: "Veggies", price: 1 },
                                      { name: "Meat", price: 2 },
                                    ];
                                    const allAddonsMap = new Map();

                                    // Add predefined addons to the map
                                    predefinedAddons.forEach(addon => allAddonsMap.set(addon.name, addon));

                                    // Add existing newMenuItem addons to the map, normalizing their names
                                    (newMenuItem.addons || []).forEach(addon => {
                                      const normalizedName = addon.name.replace(/^Add\s/, '').trim();
                                      if (!allAddonsMap.has(normalizedName)) {
                                        allAddonsMap.set(normalizedName, { ...addon, name: normalizedName });
                                      }
                                    });

                                    return Array.from(allAddonsMap.values()).map((addon) => {
                                      const isChecked = newMenuItem.addons.some(selectedAddon => selectedAddon.name.replace(/^Add\s/, '').trim() === addon.name);
                                      return (
                                        <label key={addon.name} className="checkbox-label">
                                          <input
                                            type="checkbox"
                                            value={addon.name}
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const { checked, value } = e.target;
                                              setNewMenuItem((prev) => {
                                                const newAddons = checked
                                                  ? [...prev.addons, { name: value, price: addon.price }]
                                                  : prev.addons.filter((selectedAddon) => selectedAddon.name.replace(/^Add\s/, '').trim() !== value);
                                                return { ...prev, addons: newAddons };
                                              });
                                            }}
                                          />
                                          {addon.name} (${addon.price})
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                    <div className="input-group" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Add new addon name..."
                        id="newAddonNameInput"
                        className="form-input"
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        id="newAddonPriceInput"
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          const nameInput = document.getElementById('newAddonNameInput');
                          const priceInput = document.getElementById('newAddonPriceInput');
                          const name = nameInput.value.trim();
                          const price = parseFloat(priceInput.value);

                          if (name !== '' && !isNaN(price)) {
                            setNewMenuItem((prev) => ({
                              ...prev,
                              addons: [...prev.addons, { name, price }],
                            }));
                            nameInput.value = '';
                            priceInput.value = '';
                          }
                        }}
                        className="btn-secondary"
                        style={{ flex: 0.5 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <button onClick={addMenuItem} className="btn-primary">
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalType === "view-registrations" && selectedItem && (
              <div className="view-details">
                <h4>Registration Details</h4>
                <p>
                  <strong>Name:</strong> {selectedItem.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedItem.email}
                </p>
                <p>
                  <strong>Event Date:</strong> {selectedItem.eventDate}
                </p>
                <p>
                  <strong>Event Name:</strong> {selectedItem.eventName}
                </p>
              </div>
            )}

            {modalType === "view-orders" && selectedItem && (
              <div className="view-details">
                <div
                  style={{
                    maxWidth: "500px",
                    margin: "20px auto",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    backgroundColor: "#fafafa",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  <h2
                    style={{
                      textAlign: "center",
                      marginBottom: "20px",
                      color: "#333",
                    }}
                  >
                    Order Details
                  </h2>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Order ID:
                        </td>
                        <td style={{ padding: "8px" }}>
                          {selectedItem.orderNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Mobile:
                        </td>
                        <td style={{ padding: "8px" }}>
                          {selectedItem.customer.phone}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Email:
                        </td>
                        <td style={{ padding: "8px" }}>
                          {selectedItem.customer.email}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Mode:
                        </td>
                        <td style={{ padding: "8px" }}>
                          {selectedItem.orderType}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Status:
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            color:
                              selectedItem.status === "Paid" ? "green" : "red",
                          }}
                        >
                          {selectedItem.status}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Sub Total:
                        </td>
                        <td style={{ padding: "8px" }}>
                          ${selectedItem.subTotal}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Sales Tax:
                        </td>
                        <td style={{ padding: "8px" }}>
                          ${selectedItem.salesTax}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Total:
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            fontWeight: "bold",
                            color: "#2c3e50",
                          }}
                        >
                          ${selectedItem.totalAmount}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          Order Date:
                        </td>
                        <td style={{ padding: "8px" }}>
                          {new Date(selectedItem.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button
                      onClick={() =>
                        handleSettleOnlineorders(selectedItem.orderNumber)
                      }
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      className="settle-btn"
                    >
                      Settle
                    </button>
                  </div>
                </div>

                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.items.map((item) => (
                      <tr key={item._id}>
                        <td>
                          {item.name.split("_")[0]}

                          {item.spiceLevel && (
                            <span className="spice-level">
                              {" "}
                              - {item.spiceLevel}
                            </span>
                          )}

                          {item.addons?.length > 0 && (
                            <div className="addons">
                              Addons:{" "}
                              {item.addons
                                .map((a) => `${a.name.replace(/^Add\s/, '').trim()} (+${a.price})`)
                                .join(", ")}
                            </div>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>${item.basePrice}</td>
                        <td>${item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {modalType === "view-menu" && selectedItem && (
              <div className="view-details">
                <h4>Menu Section Details</h4>
                <p>
                  <strong>Title:</strong> {selectedItem.title}
                </p>
                <p>
                  <strong>Color:</strong> {selectedItem.color}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </p>
                <div className="menu-items">
                  <h5>Items:</h5>
                  {selectedItem.items?.map((item, index) => (
                    <div key={index} className="menu-item">
                      {item.name} - ${item.price}
                      {item.spicelevel && item.spicelevel.length > 0 && (
                        <div className="spice-levels">
                          Spice Levels: {item.spicelevel.join(", ")}
                        </div>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <div className="addons">
                          Addons: {item.addons.map(a => `${a.name.replace(/^Add\s/, '').trim()} (${a.price})`).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalType === "view-order-report-details" && selectedItem && (
              <div className="view-details">
                <h4>Order Details</h4>
                <div className="order-items">
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.map((item) => (
                        <tr key={item._id}>
                          <td>
                            {item.name.split("_")[0]}

                            {item.spiceLevel && (
                              <span className="spice-level">
                                {" "}
                                - {item.spiceLevel}
                              </span>
                            )}

                            {item.addons?.length > 0 && (
                              <div className="addons">
                                Addons:{" "}
                                {item.addons
                                  .map((a) => `${a.name.replace(/^Add\s/, '').trim()} (+${a.price})`)
                                  .join(", ")}
                              </div>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td>${item.basePrice}</td>
                          <td>${item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleSettle = async (e) => {
    let userConfirmed = window.confirm("Sure to settle ?");

    if (!userConfirmed) {
      return;
    }
    e.preventDefault();
    setIsLoading(true);

    try {
      const dbResponse = await fetch("/order/settle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumbers: billDetails.orderNumbers.join(","),
          tableNumber: tableNo,
          paymentMethod: "offline",
          tips,
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save order.");
      }

      setIsLoading(false);
      setIsSuccessPopupOpen(false);
      setTableNo("");
      setBillDetails(null);
      alert("Order settled successfully!");
    } catch (err) {
      // console.error("Order process error:", err);
      alert(
        `We're sorry, your order couldn't be placed (Error: ${err.message}). Please call us directly.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tipsPercentageUpdate = async (e) => {
    setTips(
      parseFloat((billDetails.totalAmount * e.target.value) / 100).toFixed(2)
    );
    setTipsPercentage(e.target.value);
  };

  const handleAcceptedOnlineorders = async (orderNumber) => {
    setIsLoading(true);

    try {
      const dbResponse = await fetch("/order/accept", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber,
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save order.");
      }
      await fetchOrders();
    } catch (err) {
      // console.error("Order process error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleOnlineorders = async (orderNumber) => {
    let userConfirmed = window.confirm("Sure to settle ?");

    if (!userConfirmed) {
      return;
    }
    setIsLoading(true);

    try {
      const dbResponse = await fetch("/order/settle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumbers: orderNumber,
          tableNumber: "0",
          paymentMethod: "offline",
          tips: 0,
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save order.");
      }

      setIsLoading(false);
      setShowModal(false);
      await fetchOrders();
      alert("Order settled successfully!");
    } catch (err) {
      // console.error("Order process error:", err);
      alert(
        `We're sorry, your order couldn't be placed (Error: ${err.message}). Please call us directly.`
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            maxHeight: "50rem",
            overflow: "scroll",
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
          <h2 style={{ margin: "1rem" }}>Order Details for {tableNo}</h2>

          <img
            src="https://rajarani-michigan.s3.us-east-2.amazonaws.com/general/qr.png"
            alt="Payment QR Code"
            style={{ width: "250px", height: "250px", margin: "10px 0" }}
          />
          <div>
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span>Sub Total</span>
                <span>{billDetails.subTotal.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span>Sales Tax</span>
                <span>{billDetails.salesTax.toFixed(2)}</span>
              </div>
              <hr style={{ margin: "8px 0" }} />

              <span>Tips %</span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <select
                  value={tipsPercentage}
                  onChange={(e) => tipsPercentageUpdate(e)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "15px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 100].map((percentage) => (
                    <option key={percentage} value={percentage}>
                      {percentage}%
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <input
                  type="number"
                  placeholder="Please Enter Tip..."
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  className="form-input"
                />
              </div>

              <br />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                }}
              >
                <span>Total Amount</span>
                <span>{billDetails.totalAmount.toFixed(2)}</span>
              </div>

              <br />
              {tips > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                  }}
                >
                  <span>With Tips</span>
                  <span>
                    {parseFloat(billDetails.totalAmount) + parseFloat(tips)}
                  </span>
                </div>
              )}

              <button
                onClick={handleSettle}
                style={{
                  backgroundColor: "black",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "10px",
                  marginTop: "10px",
                }}
              >
                Settle
              </button>
            </div>
            <br />
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Name
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Quantity
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Price
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {billDetails.items.map((item) => (
                  <tr key={item._id}>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {item.name.split("_")[0]}
                      {item.spiceLevel ? (
                        <span style={{ color: "red" }}>
                          {" "}
                          - {item.spiceLevel}
                        </span>
                      ) : (
                        ""
                      )}

                      {item.addons && item.addons.length > 0 && (
                        <>
                          <br />
                          <small>
                            Addons:{" "}
                            {item.addons
                              .map((a) => `${a.name.replace(/^Add\s/, '').trim()} (+${a.price})`)
                              .join(", ")}
                          </small>
                        </>
                      )}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {item.quantity}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      ${item.basePrice}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      ${item.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handleChange = (key, value) => {
    setSelected((prev) => ({ ...prev, [key]: value }));
  };

  const OrderTypeRadios = () => {
    return (
      <div>
        {Object.keys(selected).map((key) => {
          const value = selected[key];
          return (
            <div key={key} style={{ marginBottom: "10px" }}>
              <div>Allow {key}</div>
              <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
                {[
                  { label: "YES", value: true },
                  { label: "NO", value: false },
                ].map((opt) => {
                  const isActive = value === opt.value;
                  return (
                    <div
                      key={opt.label}
                      onClick={() => handleChange(key, opt.value)}
                      style={{
                        cursor: "pointer",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        border: isActive
                          ? "2px solid #2563eb"
                          : "2px solid #ccc",
                        background: isActive ? "#2563eb" : "#f9f9f9",
                        color: isActive ? "#fff" : "#333",
                        fontWeight: isActive ? "600" : "400",
                        boxShadow: isActive
                          ? "0 2px 6px rgba(0,0,0,0.2)"
                          : "none",
                      }}
                    >
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const saveSettings = async () => {
    let userConfirmed = window.confirm("Are you sure to make changes ?");

    if (!userConfirmed) {
      return;
    }

    try {
      const dbResponse = await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "order_settings",
          settings: selected,
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.message || "Failed to save.");
      }
      alert("Settings saved successfully!");
    } catch (err) {
      alert(
        `We're sorry, your settings couldn't be saved (Error: ${err.message}). Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const OrdersTable = () => {
    const [orderReports, setOrderReports] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const tableHeaderStyle = {
      border: "1px solid #000",
      padding: "8px",
      backgroundColor: "#f0f0f0",
    };

    const tableCellStyle = {
      border: "1px solid #000",
      padding: "8px",
      textAlign: "center",
    };

    const buttonStyle = {
      padding: "5px 10px",
      margin: "0 5px",
      border: "1px solid #000",
      cursor: "pointer",
    };

    useEffect(() => {
      fetch(`/order/all?page=${page}&limit=${limit}`)
        .then((res) => res.json())
        .then((data) => {
          setOrderReports(data.results);
          setTotalPages(data.totalPages);
        });
    }, [page]);

    return (
      <div style={{ padding: "20px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Order Number</th>
              <th style={tableHeaderStyle}>Sub Total</th>
              <th style={tableHeaderStyle}>Sales Tax</th>
              <th style={tableHeaderStyle}>Total Amount</th>
              <th style={tableHeaderStyle}>Tip</th>
              <th style={tableHeaderStyle}>Payment status</th>
              <th style={tableHeaderStyle}>Order Type</th>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Phone</th>
              <th style={tableHeaderStyle}>items</th>
            </tr>
          </thead>
          <tbody>
            {orderReports.length > 0 ? (
              orderReports.map((order) => (
                <tr key={order._id}>
                  <td style={tableCellStyle}>{order.orderNumber}</td>
                  <td style={tableCellStyle}>${order.subTotal}</td>
                  <td style={tableCellStyle}>${order.salesTax}</td>
                  <td style={tableCellStyle}>${order.totalAmount}</td>
                  <td style={tableCellStyle}>${order.tips}</td>
                  <td
                    style={{
                      ...tableCellStyle,
                      color: order.payment.status === "paid" ? "green" : "red",
                      fontWeight:
                        order.payment.status === "paid" ? "bold" : "normal",
                      textAlign: "center",
                    }}
                  >
                    {order.payment.status}
                  </td>
                  <td style={tableCellStyle}>{order.orderType}</td>
                  <td style={tableCellStyle}>{order.customer.name}</td>
                  <td style={tableCellStyle}>
                    {order.customer.email ? order.customer.email : "NA"}
                  </td>
                  <td style={tableCellStyle}>
                    {order.customer.phone === "+1"
                      ? "NA"
                      : order.customer.phone}
                  </td>
                  <td
                    style={tableCellStyle}
                    onClick={() => viewOrderDetils(order.items)}
                  >
                    <span style={buttonStyle}>View</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={tableCellStyle}>
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            style={buttonStyle}
          >
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            style={buttonStyle}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const viewOrderDetils = async (items) => {
    setSelectedItem(items);
    setModalType(`view-order-report-details`);
    setShowModal(true);
  };

  return (
    <>
      {isSuccessPopupOpen && <SuccessPopup />}
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Raja Rani Admin Dashboard</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs-container">
          <button
            className={`tab-btn ${
              activeTab === "registrations" ? "active" : ""
            }`}
            onClick={() => setActiveTab("registrations")}
          >
            Event Registrations
          </button>
          <button
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button
            className={`tab-btn ${activeTab === "menu" ? "active" : ""}`}
            onClick={() => setActiveTab("menu")}
          >
            Menu Management
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
          <button
            className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </button>
          <button
            className={`tab-btn ${activeTab === "kitchen" ? "active" : ""}`}
            onClick={() => setActiveTab("kitchen")}
          >
            Kitchen Orders
          </button>
        </div>

        {activeTab === "registrations" && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Event Registrations</h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile Number</th>
                    <th>Event Date</th>
                    <th>Event Name</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.items.length > 0 ? (
                    registrations.items.map((reg) => (
                      <tr key={reg._id}>
                        <td>
                          <strong>{reg.name || "N/A"}</strong>
                        </td>
                        <td>{reg.email || "N/A"}</td>
                        <td>{reg.mobile || "N/A"}</td>
                        <td>
                          {reg.eventDate
                            ? new Date(reg.eventDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>{reg.eventName}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No registrations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination(registrations, (page) =>
              fetchRegistrations(page, searchRegistrationQuery)
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Order Management</h2>
            </div>

            <div className="subsection-header">
              <h3>Dine-In</h3>
            </div>
            <div className="table-status-container">
              {tableStatuses.map((table) => (
                <div
                  key={table.tableNumber}
                  className={`table-status-box status-${table.status.toLowerCase()}`}
                  onClick={() => {
                    showBill(table.tableNumber);
                  }}
                >
                  Table {table.tableNumber}
                </div>
              ))}
            </div>
            <div className="order-grid-container"></div>
            <div className="subsection-header">
              <h3>Pending Orders (Pickup or Delivery)</h3>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Total Amount</th>
                    <th>Mode</th>
                    <th>Order Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.items.length > 0 ? (
                    orders.items.map((order) => (
                      <>
                        {order.orderType !== "dinein" &&
                          order.status !== "completed" && (
                            <tr key={order._id}>
                              <td>
                                <code>{order.orderNumber || "N/A"}</code>
                              </td>
                              <td>
                                <strong>{order.customer.name || "N/A"}</strong>
                              </td>
                              <td>
                                <strong>{order.customer.email || "N/A"}</strong>
                              </td>
                              <td>
                                <strong>
                                  ${(order.totalAmount || 0).toFixed(2)}
                                </strong>
                              </td>
                              <td>{order.orderType.toUpperCase()}</td>

                              <td>
                                {new Date(order.createdAt).toLocaleString()}
                              </td>
                              <td>
                                {order.status === "pending" && (
                                  <button
                                    className="view-btn"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, green, blue)",
                                    }}
                                    onClick={() =>
                                      handleAcceptedOnlineorders(
                                        order.orderNumber
                                      )
                                    }
                                  >
                                    Accept
                                  </button>
                                )}

                                {order.status === "accepted" && (
                                  <button
                                    className="view-btn"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, red, black)",
                                    }}
                                    onClick={() => handleView(order, "orders")}
                                  >
                                    Settle
                                  </button>
                                )}
                              </td>
                            </tr>
                          )}
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination(orders, (page) =>
              fetchOrders(page, searchOrderQuery)
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="section-card">
            <div
              className="section-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 className="section-title">Menu Management</h2>
            </div>
            <div
              className="section-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                className="view-btn"
                style={{
                  background: "linear-gradient(135deg, red, black)",
                }}
                onClick={() => handleSaveMenu()}
              >
                Update Menu
              </button>
            </div>

            <div className="table-container">
              <div className="category-list">
                {menuData.items.length > 0 ? (
                  menuData.items.map((category, index) => (
                    <div
                      key={category._id || index}
                      className="category-card"
                    >
                      <h3>{category.title}</h3>
                      <p>Items: {category.items?.length || 0}</p>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setSelectedSection(category);
                          setModalType("manage-items");
                          setShowModal(true);
                        }}
                        style={{
                          marginTop: "10px",
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Manage Items
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No menu categories found. Please add categories via the backend or a tool like MongoDB Compass.</p>
                )}
              </div>
            </div>

            {renderPagination(menuData, (page) =>
              fetchMenuData(page, searchMenuQuery)
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="section-card">
            <div
              className="section-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 className="section-title">Settings</h2>

              <div className="table-container" style={{ padding: "2rem" }}>
                <OrderTypeRadios />
              </div>

              <button
                key="prev"
                onClick={() => saveSettings()}
                className="pagination-btn"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="section-card">
            <div
              className="section-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 className="section-title">Reports</h2>
            </div>

            <div className="table-container">
              <OrdersTable />
            </div>

        {renderPagination(menuData, (page) =>
              fetchMenuData(page, searchMenuQuery)
            )}
          </div>
        )}

        {activeTab === "kitchen" && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Kitchen Orders (Dine-In)</h2>
            </div>
            <KitchenOrdersTable />
          </div>
        )}

        {renderModal()}
      </div>
    </>
  );
};

const KitchenOrdersTable = () => {
  const [kitchenOrders, setKitchenOrders] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [page, setPage] = useState(1);
  const limit = 10;
  const [authToken] = useState("Basic " + btoa("admin:password123"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tableHeaderStyle = {
    border: "1px solid #000",
    padding: "8px",
    backgroundColor: "#f0f0f0",
  };

  const tableCellStyle = {
    border: "1px solid #000",
    padding: "8px",
    textAlign: "center",
  };

  const buttonStyle = {
    padding: "5px 10px",
    margin: "0 5px",
    border: "1px solid #000",
    cursor: "pointer",
  };

  const fetchKitchenOrdersData = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(`/order/kitchen?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error (${response.status})`);
      }
      const data = await response.json();
      setKitchenOrders({
        items: data.results,
        totalPages: data.totalPages,
        currentPage: page,
      });
    } catch (err) {
      setError(`Failed to load kitchen orders: ${err.message}`);
      setKitchenOrders({ items: [], totalPages: 1, currentPage: 1 });
    }
  }, [page, authToken]);

  useEffect(() => {
    fetchKitchenOrdersData();
  }, [fetchKitchenOrdersData]);

  const handlePrintOrder = async (orderId) => {
    if (!window.confirm("Mark this order as sent to kitchen and print?")) {
      return;
    }
    try {
      const response = await fetch(`/order/kitchen/${orderId}/send`, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error (${response.status})`);
      }
      setSuccess("Order marked as sent to kitchen!");
      setTimeout(() => setSuccess(""), 3000);
      fetchKitchenOrdersData(); // Refresh the list
      // Implement actual print functionality here if needed
      alert("Order sent to kitchen and marked as printed!");
    } catch (err) {
      setError(`Failed to mark order as sent: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Order Number</th>
            <th style={tableHeaderStyle}>Table Number</th>
            <th style={tableHeaderStyle}>Items</th>
            <th style={tableHeaderStyle}>Total Amount</th>
            <th style={tableHeaderStyle}>Order Date</th>
            <th style={tableHeaderStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {kitchenOrders.items.length > 0 ? (
            kitchenOrders.items.map((order) => (
              <tr key={order._id}>
                <td style={tableCellStyle}>{order.orderNumber}</td>
                <td style={tableCellStyle}>{order.tableNumber}</td>
                <td style={tableCellStyle}>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.name} x {item.quantity}
                        {item.spiceLevel && ` (${item.spiceLevel})`}
                        {item.addons && item.addons.length > 0 && (
                          <span>
                            {" "}
                            + {item.addons.map((a) => a.name.replace(/^Add\s/, '').trim()).join(", ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={tableCellStyle}>${order.totalAmount.toFixed(2)}</td>
                <td style={tableCellStyle}>
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td style={tableCellStyle}>
                  <button
                    onClick={() => handlePrintOrder(order._id)}
                    style={{ ...buttonStyle, backgroundColor: "#28a745", color: "white" }}
                  >
                    Print & Send
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={tableCellStyle}>
                No pending dine-in orders for kitchen.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          style={buttonStyle}
        >
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {page} of {kitchenOrders.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, kitchenOrders.totalPages))}
          disabled={page === kitchenOrders.totalPages}
          style={buttonStyle}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
