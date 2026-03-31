"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import "./AdminDashboard.css";
import KitchenOrdersTable from "./KitchenOrdersTable";
import SuccessPopup from "./SuccessPopup";
import OrdersTable from "./OrdersTable";
import LoadingSpinner from "./LoadingSpinner";
import OrderTypeRadios from "./OrderTypeRadios";
import AdminRegistrations from "./AdminRegistrations";
import AdminOrders from "./AdminOrders";
import AdminMenu from "./AdminMenu";
import AdminSettings from "./AdminSettings";
import AdminReports from "./AdminReports";
import AdminInvoice from "./AdminInvoice";
import AdminCatering from "./AdminCatering";
import AdminDineInSales from "./AdminDineInSales";
import AdminOnlineOrderSales from "./AdminOnlineOrderSales";
import { printOrder } from "../utils/printer";

const AdminDashboard = ({ onLogout, onSwitchStore }) => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);
  const storeName = useSelector((state) => state.store.selectedStore?.name);
  const [authToken] = useState("Basic " + btoa("admin:password123"));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshOrders, setRefreshOrders] = useState("");
  const [activeTab, setActiveTab] = useState("registrations");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);

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
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [searchRegistrationQuery, setSearchRegistrationQuery] = useState("");
  const [searchOrderQuery, setSearchOrderQuery] = useState("");
  const [searchMenuQuery, setSearchMenuQuery] = useState("");

  const [tableNo, setTableNo] = useState("");
  const [billDetails, setBillDetails] = useState(null);

  const [tips, setTips] = useState(0);
  const [tipsPercentage, setTipsPercentage] = useState(0);

  // WebSocket connection for real-time order notifications
  const wsRef = useRef(null);
  const lastPongRef = useRef(Date.now());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const onlineAudioRef = useRef(null);
  const dineinAudioRef = useRef(null);

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
              setTimeout(resolve, (retryCount + 1) * 2000),
            );
            return fetchData(url, token, retryCount + 1);
          } else {
            throw new Error(
              "Server is busy. Please wait a moment and refresh the page.",
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
              errorData.message || `Server error (${response.status})`,
            );
          } else {
            throw new Error(
              `Server returned ${response.status}. Please check if the backend is running on http://localhost:5001`,
            );
          }
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Server returned HTML instead of JSON. Please check if your backend API is running correctly.",
          );
        }

        return response.json();
      } catch (error) {
        if (
          error.name === "TypeError" &&
          error.message.includes("Failed to fetch")
        ) {
          throw new Error(
            "Unable to connect to server. Please check if your backend is running on http://localhost:5001",
          );
        }
        throw error;
      }
    },
    [onLogout],
  );

  const createFetchFunction = useCallback(
    (setter, type) =>
      async (page = 1, searchQuery = "") => {
        try {
          setError("");
          const url = `/stores/${storeSlug}/${type}?page=${page}${
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
    [authToken, fetchData],
  );

  const fetchRegistrations = createFetchFunction(setRegistrations, "register");
  const fetchOrders = createFetchFunction(setOrders, "order");
  const fetchMenuData = createFetchFunction(setMenuData, "menu/all");
  const fetchKitchenOrders = createFetchFunction(
    setKitchenOrders,
    "order/kitchen",
  );

  const enableAudio = () => {
    // Must happen inside a click handler so browser allows playback
    onlineAudioRef.current = new Audio("/new-online-order.mp3");
    dineinAudioRef.current = new Audio("/new-dinein-order.mp3");
    // Play + immediately pause to unlock both audio objects
    onlineAudioRef.current
      .play()
      .then(() => onlineAudioRef.current.pause())
      .catch(() => {});
    dineinAudioRef.current
      .play()
      .then(() => dineinAudioRef.current.pause())
      .catch(() => {});
    setAudioEnabled(true);
  };

  useEffect(() => {
    let ws;
    let heartbeatInterval = null;
    let reconnectTimeout = null;
    let isUnmounted = false;

    const playAudio = (audioRef) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    };

    const connectWebSocket = () => {
      if (isUnmounted) return;

      ws = new WebSocket("wss://rajaranieats.com/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        lastPongRef.current = Date.now();

        if (heartbeatInterval) clearInterval(heartbeatInterval);

        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // If no pong received in last 45s, connection is dead — reconnect
            if (Date.now() - lastPongRef.current > 45000) {
              console.warn("⚠️ No pong received, reconnecting...");
              ws.close();
              return;
            }
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") {
            lastPongRef.current = Date.now();
          } else if (data.type === "new_order" && data.orderType === "dinein") {
            playAudio(dineinAudioRef);
            setSuccess(`New order received - ${data.orderNumber}`);
            setTimeout(() => setSuccess(""), 5000);
            setRefreshOrders(data.orderNumber);
          } else if (data.type === "new_order") {
            playAudio(onlineAudioRef);
            setSuccess(`New order received - ${data.orderNumber}`);
            setTimeout(() => setSuccess(""), 5000);
            setRefreshOrders(data.orderNumber);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = (event) => {
        console.warn("❌ WS closed", event.code);

        clearInterval(heartbeatInterval);
        heartbeatInterval = null;

        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;

      clearInterval(heartbeatInterval);
      clearTimeout(reconnectTimeout);

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // 🔥 EMPTY dependency array

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      if (typeof onLogout === "function") {
        onLogout();
      } else {
        window.location.href = "/admin";
      }
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "orders") {
        fetchOrders(orders.currentPage, searchOrderQuery);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [activeTab, fetchOrders, orders.currentPage, searchOrderQuery]);
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
          "Failed to load dashboard data. Please refresh and try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const dbResponse = await fetch(`/api/stores/${storeSlug}/settings/latest`, {
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
      const response = await fetch(
        `/api/stores/${storeSlug}/order/table/${tableNo}`,
        {
          method: "GET",
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Server responded with ${response.status}: ${
            errorData.message || "Failed to update status"
          }`,
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

  const handleView = (item, type) => {
    setSelectedItem(item);
    setModalType(`view-${type}`);
    setShowModal(true);
  };

  const handleSaveMenu = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/stores/${storeSlug}/menu`, {
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
          }`,
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
        </button>,
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
        </button>,
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
        </button>,
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

    modalTitle = `View ${type}`;

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
                                .map(
                                  (a) =>
                                    `${a.name.replace(/^Add\s/, "").trim()} (+${
                                      a.price
                                    })`,
                                )
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
                          Addons:{" "}
                          {item.addons
                            .map(
                              (a) =>
                                `${a.name.replace(/^Add\s/, "").trim()} (${
                                  a.price
                                })`,
                            )
                            .join(", ")}
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
                                  .map(
                                    (a) =>
                                      `${a.name
                                        .replace(/^Add\s/, "")
                                        .trim()} (+${a.price})`,
                                  )
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
      const dbResponse = await fetch(`/stores/${storeSlug}/order/settle`, {
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
        `We're sorry, your order couldn't be placed (Error: ${err.message}). Please call us directly.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tipsPercentageUpdate = async (e) => {
    setTips(
      parseFloat((billDetails.totalAmount * e.target.value) / 100).toFixed(2),
    );
    setTipsPercentage(e.target.value);
  };

  const handleAcceptedOnlineorders = async (orderNumber) => {
    setIsLoading(true);

    try {
      const dbResponse = await fetch(`/stores/${storeSlug}/order/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber,
        }),
      });

      const dbData = await dbResponse.json();
      if (dbData.error) {
        alert(dbData.error);
        return;
      }

      const orderDetailsResponse = await fetch(
        `/stores/${storeSlug}/order/orderId/${orderNumber}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const orderDetails = await orderDetailsResponse.json();
      const print = printOrder(orderDetails);

      if (print) {
        setSuccess("Online order sent to kitchen!");
        setTimeout(() => setSuccess(""), 3000);
        await fetchOrders();
      }
    } catch (err) {
      // console.error("Order process error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectOnlineorders = async (orderNumber) => {
    setIsLoading(true);

    try {
      const dbResponse = await fetch(`/stores/${storeSlug}/order/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber,
        }),
      });

      const dbData = await dbResponse.json();
      if (dbData.error) {
        alert(dbData.error);
        return;
      }
      setSuccess("Online order rejected!");
      setTimeout(() => setSuccess(""), 3000);
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
      const dbResponse = await fetch(`/stores/${storeSlug}/order/settle`, {
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
        `We're sorry, your order couldn't be placed (Error: ${err.message}). Please call us directly.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    // Handle nested properties like discountDetails.name
    if (key.includes(".")) {
      const [parentKey, childKey] = key.split(".");
      setSelected((prev) => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: value,
        },
      }));
    } else {
      setSelected((prev) => ({ ...prev, [key]: value }));
    }
  };

  const saveSettings = async () => {
    let userConfirmed = window.confirm("Are you sure to make changes ?");

    if (!userConfirmed) {
      return;
    }

    try {
      const dbResponse = await fetch(`/stores/${storeSlug}/settings`, {
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
        `We're sorry, your settings couldn't be saved (Error: ${err.message}). Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isSuccessPopupOpen && (
        <SuccessPopup
          isSuccessPopupOpen={isSuccessPopupOpen}
          setIsSuccessPopupOpen={setIsSuccessPopupOpen}
          billDetails={billDetails}
          tableNo={tableNo}
          tips={tips}
          setTips={setTips}
          tipsPercentage={tipsPercentage}
          setTipsPercentage={setTipsPercentage}
          handleSettle={handleSettle}
          tipsPercentageUpdate={tipsPercentageUpdate}
        />
      )}
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Raja Rani Admin Dashboard</h1>
          <div className="header-actions">
            {storeName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  padding: "4px 14px",
                  fontSize: "0.85rem",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ opacity: 0.7 }}>📍</span>
                <span style={{ fontWeight: 600 }}>{storeName}</span>
                <button
                  onClick={onSwitchStore}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f5a623",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    padding: "0 0 0 4px",
                    fontWeight: 600,
                  }}
                >
                  Switch
                </button>
              </div>
            )}
            {!audioEnabled && (
              <button
                onClick={enableAudio}
                className="logout-btn"
                style={{ backgroundColor: "#e67e22" }}
              >
                🔔 Enable Sound
              </button>
            )}
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
            Registrations
          </button>
          <button
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Online Orders
          </button>
          <button
            className={`tab-btn ${activeTab === "menu" ? "active" : ""}`}
            onClick={() => setActiveTab("menu")}
          >
            Menu
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
            Order Reports
          </button>
          {/* Table Orders tab — dine-in order flow disabled
          <button
            className={`tab-btn ${activeTab === "kitchen" ? "active" : ""}`}
            onClick={() => setActiveTab("kitchen")}
          >
            Table Orders
          </button>
          */}
          <button
            className={`tab-btn ${activeTab === "catering" ? "active" : ""}`}
            onClick={() => setActiveTab("catering")}
          >
            Catering Orders
          </button>
          <button
            className={`tab-btn ${activeTab === "dinein-sales" ? "active" : ""}`}
            onClick={() => setActiveTab("dinein-sales")}
          >
            Dine In Sales
          </button>
          <button
            className={`tab-btn ${activeTab === "online-sales" ? "active" : ""}`}
            onClick={() => setActiveTab("online-sales")}
          >
            Online Order Sales
          </button>
          <button
            className={`tab-btn ${activeTab === "invoice" ? "active" : ""}`}
            onClick={() => setActiveTab("invoice")}
          >
            Expenses
          </button>
        </div>

        {activeTab === "registrations" && (
          <AdminRegistrations
            registrations={registrations}
            fetchRegistrations={fetchRegistrations}
            searchRegistrationQuery={searchRegistrationQuery}
            renderPagination={renderPagination}
          />
        )}

        {activeTab === "orders" && (
          <AdminOrders
            orders={orders}
            tableStatuses={tableStatuses}
            fetchOrders={fetchOrders}
            searchOrderQuery={searchOrderQuery}
            showBill={showBill}
            handleAcceptedOnlineorders={handleAcceptedOnlineorders}
            handleRejectOnlineorders={handleRejectOnlineorders}
            handleView={handleView}
            renderPagination={renderPagination}
            refresh={refreshOrders}
          />
        )}

        {activeTab === "menu" && (
          <AdminMenu
            menuData={menuData}
            handleSaveMenu={handleSaveMenu}
            renderPagination={renderPagination}
            fetchMenuData={fetchMenuData}
            searchMenuQuery={searchMenuQuery}
            authToken={authToken}
            setError={setError}
            setSuccess={setSuccess}
          />
        )}

        {activeTab === "settings" && (
          <AdminSettings
            selected={selected}
            handleChange={handleChange}
            saveSettings={saveSettings}
          />
        )}

        {activeTab === "reports" && <AdminReports />}

        {/* Table Orders (dine-in) section — disabled
        {activeTab === "kitchen" && (
          <div className="section-card">
            <KitchenOrdersTable
              authToken={authToken}
              setError={setError}
              setSuccess={setSuccess}
              tableStatuses={tableStatuses}
              showBill={showBill}
              refresh={refreshOrders}
            />
          </div>
        )}
        */}

        {activeTab === "catering" && <AdminCatering />}

        {activeTab === "dinein-sales" && <AdminDineInSales />}

        {activeTab === "online-sales" && <AdminOnlineOrderSales />}

        {activeTab === "invoice" && <AdminInvoice />}

        {renderModal()}
      </div>
    </>
  );
};

export default AdminDashboard;
