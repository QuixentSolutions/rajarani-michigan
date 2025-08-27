"use client";

import { useState, useEffect, useCallback } from "react";
import "./AdminDashboard.css";

const AdminDashboard = ({ onLogout }) => {
  const [authToken] = useState("Basic " + btoa("admin:password123"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("registrations");
  const [isLoading, setIsLoading] = useState(true);

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
  const [menuData, setMenuData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  // ========== NEW STATE FOR TABLE STATUSES (ADDED) ==========
  const [tableStatuses, setTableStatuses] = useState([]);
  // ========== NEW STATE FOR PICKUP/DELIVERY (ADDED) ==========
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

  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    newPrice: "",
    oldPrice: "",
  });

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

          if (data && typeof data === "object") {
            if (Array.isArray(data)) {
              setter({ items: data, totalPages: 1, currentPage: 1 });
            } else if (type === "menu" && data.sections) {
              setter({
                items: data.sections || [],
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || page,
              });
            } else if (data.items || data.data) {
              setter({
                items: data.items || data.data || [],
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || page,
              });
            } else {
              setter({ items: [], totalPages: 1, currentPage: 1 });
            }
          } else {
            setter({ items: [], totalPages: 1, currentPage: 1 });
          }
        } catch (err) {
          setError(`Failed to load ${type}: ${err.message}`);
          setter({ items: [], totalPages: 1, currentPage: 1 });
        }
      },
    [authToken, fetchData]
  );

  const fetchRegistrations = createFetchFunction(setRegistrations, "register");
  const fetchOrders = createFetchFunction(setOrders, "order");
  const fetchMenuData = createFetchFunction(setMenuData, "menu");

  const refreshSelectedSectionItems = async (sectionToRefresh) => {
    if (!sectionToRefresh) return;

    try {
      const response = await fetch(`/api/admin/menu/${sectionToRefresh._id}`, {
        headers: { Authorization: authToken },
      });

      if (response.ok) {
        const updatedSection = await response.json();
        setSelectedSection(updatedSection);
        await fetchMenuData();
      }
    } catch (err) {
      console.log("Failed to refresh section items:", err);
    }
  };

  const addMenuItem = async () => {
    if (!selectedSection || !newMenuItem.name || !newMenuItem.newPrice) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const url = `/api/admin/menu/${selectedSection._id}/items`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMenuItem),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      setSuccess("Menu item added successfully!");
      setNewMenuItem({ name: "", newPrice: "", oldPrice: "" });

      if (result.section) {
        setSelectedSection(result.section);
      }

      await fetchMenuData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        `Failed to add menu item: ${err.message}. Make sure your server is running on port 5001.`
      );
    }
  };

  const updateMenuItem = async (itemToUpdate, updatedFields) => {
    try {
      if (!itemToUpdate || !itemToUpdate._id) {
        throw new Error("Invalid item - no ID found");
      }

      if (!selectedSection || !selectedSection._id) {
        throw new Error("No section selected");
      }

      const url = `/api/admin/menu/${selectedSection._id}/items/${itemToUpdate._id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields),
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

      const result = await response.json();
      setSuccess("Menu item updated successfully!");
      setEditingMenuItem(null);
      setEditingItemData(null);

      if (result.section) {
        setSelectedSection(result.section);
      }

      await fetchMenuData();
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

      const url = `/api/admin/menu/${selectedSection._id}/items/${itemId}`;
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

      const result = await response.json();
      setSuccess("Menu item deleted successfully!");

      if (result.section) {
        setSelectedSection(result.section);
      }

      await fetchMenuData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to delete menu item: ${err.message}`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");

      // ========== FAKE TABLE DATA FOR UI DEVELOPMENT (ADDED) ==========
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

  const handleManageItems = (section) => {
    setSelectedSection(section);
    refreshSelectedSectionItems(section);
    setModalType("manage-items");
    setShowModal(true);
    setEditingMenuItem(null);
    setNewMenuItem({ name: "", newPrice: "", oldPrice: "" });
    setEditingItemData(null);
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
                      <label>New Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newMenuItem.newPrice}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            newPrice: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Old Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newMenuItem.oldPrice}
                        onChange={(e) =>
                          setNewMenuItem({
                            ...newMenuItem,
                            oldPrice: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <button onClick={addMenuItem} className="btn-primary">
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>

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
                                value={editingItemData?.newPrice || ""}
                                onChange={(e) => {
                                  setEditingItemData({
                                    ...editingItemData,
                                    newPrice: e.target.value,
                                  });
                                }}
                                className="form-input"
                                placeholder="New price"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={editingItemData?.oldPrice || ""}
                                onChange={(e) => {
                                  setEditingItemData({
                                    ...editingItemData,
                                    oldPrice: e.target.value,
                                  });
                                }}
                                className="form-input"
                                placeholder="Old price (optional)"
                              />
                              <div className="edit-actions">
                                <button
                                  onClick={() => {
                                    updateMenuItem(editingItemData, {
                                      name: editingItemData.name,
                                      newPrice: editingItemData.newPrice,
                                      oldPrice: editingItemData.oldPrice,
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
                                  ${item.newPrice}
                                </span>
                                {item.oldPrice && (
                                  <span className="old-price">
                                    ${item.oldPrice}
                                  </span>
                                )}
                              </div>
                              <div className="item-actions">
                                <button
                                  onClick={() => {
                                    setEditingMenuItem(item._id);
                                    setEditingItemData({ ...item });
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
                <h4>Order Details</h4>
                <p>
                  <strong>Order ID:</strong> {selectedItem.orderId}
                </p>
                <p>
                  <strong>Mobile:</strong> {selectedItem.mobileNumber}
                </p>
                <p>
                  <strong>Email:</strong> {selectedItem.email}
                </p>
                <p>
                  <strong>Mode:</strong> {selectedItem.orderMode}
                </p>
                <p>
                  <strong>Status:</strong> {selectedItem.status}
                </p>
                <p>
                  <strong>Total:</strong> ${selectedItem.totalAmount}
                </p>
                <p>
                  <strong>Order Date:</strong>{" "}
                  {new Date(selectedItem.orderDate).toLocaleString()}
                </p>
                <div className="order-items">
                  <h5>Items:</h5>
                  {selectedItem.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      {item.name} - Qty: {item.quantity} - ${item.price}
                    </div>
                  ))}
                </div>
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getStatusBadgeClass = (status, type) => {
    const baseClass = "status-badge";

    if (type === "order") {
      switch (status?.toLowerCase()) {
        case "pending":
          return `${baseClass} status-pending`;
        case "completed":
          return `${baseClass} status-completed`;
        case "cancelled":
          return `${baseClass} status-cancelled`;
        default:
          return `${baseClass} status-pending`;
      }
    }
    if (type === "mode") {
      switch (status?.toLowerCase()) {
        case "dinein":
          return `${baseClass} mode-dinein`;
        case "pickup":
          return `${baseClass} mode-pickup`;
        case "delivery":
          return `${baseClass} mode-delivery`;
        default:
          return `${baseClass} mode-dinein`;
      }
    }
    return baseClass;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setError("");
      setSuccess("Updating order status...");
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
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
      setSuccess(
        `Order ${orderId} status updated to ${result.order.status.toUpperCase()}!`
      );
      fetchOrders(orders.currentPage);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to update order status: ${err.message}`);
    } finally {
      setEditingOrderId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
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
          className={`tab-btn ${activeTab === "registrations" ? "active" : ""}`}
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

          {/* ========== DATA-DRIVEN TABLE DISPLAY (MODIFIED) ========== */}
          <div className="subsection-header">
            <h3>Dine-In</h3>
          </div>
          <div className="table-status-container">
            {tableStatuses.map((table) => (
              <div
                key={table.tableNumber}
                className={`table-status-box status-${table.status.toLowerCase()}`}
              >
                Table {table.tableNumber}
              </div>
            ))}
          </div>
          <div className="order-grid-container"></div>
          <div className="subsection-header">
            <h3>Orders (Pickup or Delivery)</h3>
          </div>
          {/* ======================================================== */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Email</th>
                  <th>Total Amount</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.length > 0 ? (
                  orders.items.map((order) => (
                    <>
                      {order.orderType !== "dinein" && (
                        <tr key={order._id}>
                          <td>
                            <code>{order.orderId || "N/A"}</code>
                          </td>
                          <td>
                            <strong>{order.email || "N/A"}</strong>
                          </td>
                          <td>
                            <strong>
                              ${(order.totalAmount || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={getStatusBadgeClass(
                                order.orderMode,
                                "mode"
                              )}
                            >
                              {(order.orderMode || "dinein").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {editingOrderId === order._id ? (
                              <select
                                value={order.status || "pending"}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (
                                    window.confirm(
                                      `Are you sure you want to mark this order as ${newStatus}?`
                                    )
                                  ) {
                                    updateOrderStatus(order._id, newStatus);
                                  } else {
                                    setEditingOrderId(null);
                                  }
                                }}
                                onBlur={() => setEditingOrderId(null)}
                                className="status-dropdown"
                                autoFocus
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Rejected</option>
                              </select>
                            ) : (
                              <span
                                className={getStatusBadgeClass(
                                  order.status,
                                  "order"
                                )}
                                onClick={() => setEditingOrderId(order._id)}
                                style={{ cursor: "pointer" }}
                                title="Click to change status"
                              >
                                {(order.status || "pending").toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td>
                            {order.orderDate
                              ? new Date(order.orderDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => handleView(order, "orders")}
                            >
                              View
                            </button>
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

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Section Title</th>
                  <th>Color</th>
                  <th>Number of Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuData.items.length > 0 ? (
                  menuData.items.map((section, index) => (
                    <tr key={section._id || section.id || index}>
                      <td>
                        <strong>
                          {section.title ||
                            section.name ||
                            `Section ${index + 1}`}
                        </strong>
                      </td>
                      <td>
                        <div className="color-display">
                          <div
                            className="color-circle"
                            style={{
                              backgroundColor: section.color || "#FFA500",
                            }}
                          ></div>
                          <span>{section.color || "#FFA500"}</span>
                        </div>
                      </td>
                      <td>
                        <strong>
                          {section.itemCount || section.items?.length || 0}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            className="view-btn"
                            onClick={() => handleView(section, "menu")}
                          >
                            View
                          </button>
                          {/* <button
                            className="manage-btn"
                            onClick={() => handleManageItems(section)}
                          >
                            Manage Items
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No menu sections found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(menuData, (page) =>
            fetchMenuData(page, searchMenuQuery)
          )}
        </div>
      )}

      {renderModal()}
    </div>
  );
};

export default AdminDashboard;
