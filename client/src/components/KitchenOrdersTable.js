import React, { useState, useEffect, useCallback } from "react";

const KitchenOrdersTable = ({ authToken, setError, setSuccess }) => {
  const [kitchenOrders, setKitchenOrders] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [page, setPage] = useState(1);
  const [printer, setPrinter] = useState("");

  const limit = 10;

  const fetchKitchenOrdersData = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(
        `/order/kitchen?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Server error (${response.status})`
        );
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
  }, [page, authToken, setError]);

  const fetchPrinterData = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(`/printer`, {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Server error (${response.status})`
        );
      }
      const data = await response.json();
      setPrinter(data.printerIp);
    } catch (err) {
      setError(`Failed to load kitchen orders: ${err.message}`);
      setPrinter("");
    }
  }, [authToken, setError]);

  const savePrinterData = useCallback(async () => {
    try {
      const response = await fetch(`/printer`, {
        method: "POST",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ printerIp: printer }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Server responded with ${response.status}: ${
            errorData.message || "Failed to update status"
          }`
        );
      }
      setSuccess("Printer updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to save menu: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    fetchKitchenOrdersData();
  }, [fetchKitchenOrdersData]);

  useEffect(() => {
    fetchPrinterData();
  }, [fetchPrinterData]);

  const handlePrintOrder = async (orderId) => {
    try {
      const dbResponse = await fetch(`/order/kitchen/${orderId}`, {
        method: "PUT",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });

      const dbData = await dbResponse.json();
      if (dbData.error) {
        alert(dbData.error);
        return;
      }
      setSuccess("Order marked as sent to kitchen!");
      setTimeout(() => setSuccess(""), 3000);
      fetchKitchenOrdersData();
    } catch (err) {
      setError(`Failed to mark order as sent: ${err.message}`);
    }
  };

  return (
    <>
      {/* Header Section - Matching AdminOrders style */}
      <div
        className="section-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="section-title">Kitchen Orders (Dine-In)</h2>
        <input
          className="printer-details"
          value={printer}
          style={{
            padding: "16px 12px",
            textAlign: "center",
            fontWeight: "600",
            color: "#475569",
            borderBottom: "2px solid #e2e8f0",
            borderRight: "1px solid #cbd5e1",
            minWidth: "120px",
          }}
          onChange={(e) => setPrinter(e.target.value)}
          placeholder="Printer Address"
          type="text"
        />
        <button
          onClick={savePrinterData}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save Configuration
        </button>
        <button
          onClick={fetchKitchenOrdersData}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh Orders
        </button>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "120px",
                  }}
                >
                  Order Number
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "80px",
                  }}
                >
                  Table
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "180px",
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "80px",
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "100px",
                  }}
                >
                  Spice Level
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "140px",
                  }}
                >
                  Addons
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "100px",
                  }}
                >
                  Total Amount
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: "140px",
                  }}
                >
                  Order Date
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    minWidth: "120px",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {kitchenOrders.items.length > 0 ? (
                kitchenOrders.items.map((order, orderIndex) => (
                  <tr
                    key={order._id}
                    style={{
                      borderBottom: "1px solid #64748b",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.closest("tr").style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.target.closest("tr").style.backgroundColor =
                        "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "16px 12px",
                        color: "#1e293b",
                        fontWeight: "500",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                        textAlign: "center",
                      }}
                    >
                      {order.orderNumber}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        color: "#475569",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {order.tableNumber}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                        textAlign: "center",
                      }}
                    >
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            paddingBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            borderBottom:
                              index < order.items.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                            color: "#1e293b",
                            fontWeight: "500",
                          }}
                        >
                          {item.name.split("_")[0].trim()}
                        </div>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                      }}
                    >
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            paddingBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            borderBottom:
                              index < order.items.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#f0fdf4",
                              color: "#166534",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                      }}
                    >
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            paddingBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            borderBottom:
                              index < order.items.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          {item.spiceLevel || "N/A"}
                        </div>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                        textAlign: "center",
                      }}
                    >
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            paddingBottom:
                              index < order.items.length - 1 ? "8px" : "0",
                            borderBottom:
                              index < order.items.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          {item.addons && item.addons.length > 0
                            ? item.addons
                                .map((a) => a.name.replace(/^Add\s/, "").trim())
                                .join(", ")
                            : "N/A"}
                        </div>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        color: "#059669",
                        fontWeight: "600",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                      }}
                    >
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "13px",
                        verticalAlign: "top",
                        borderRight: "1px solid #cbd5e1",
                      }}
                    >
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        verticalAlign: "top",
                      }}
                    >
                      <button
                        onClick={() => handlePrintOrder(order._id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(16,185,129,0.3)",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#059669";
                          e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#10b981";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "16px",
                    }}
                  >
                    No pending dine-in orders for kitchen
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "24px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          style={{
            padding: "8px 16px",
            backgroundColor: page === 1 ? "#f1f5f9" : "#ffffff",
            color: page === 1 ? "#94a3b8" : "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            cursor: page === 1 ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (page !== 1) {
              e.target.style.backgroundColor = "#f8fafc";
              e.target.style.borderColor = "#cbd5e1";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== 1) {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
            }
          }}
        >
          Previous
        </button>

        <span
          style={{
            padding: "8px 16px",
            color: "#475569",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          Page {page} of {kitchenOrders.totalPages}
        </span>

        <button
          onClick={() =>
            setPage((p) => Math.min(p + 1, kitchenOrders.totalPages))
          }
          disabled={page === kitchenOrders.totalPages}
          style={{
            padding: "8px 16px",
            backgroundColor:
              page === kitchenOrders.totalPages ? "#f1f5f9" : "#ffffff",
            color: page === kitchenOrders.totalPages ? "#94a3b8" : "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            cursor:
              page === kitchenOrders.totalPages ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (page !== kitchenOrders.totalPages) {
              e.target.style.backgroundColor = "#f8fafc";
              e.target.style.borderColor = "#cbd5e1";
            }
          }}
          onMouseLeave={(e) => {
            if (page !== kitchenOrders.totalPages) {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.borderColor = "#e2e8f0";
            }
          }}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default KitchenOrdersTable;
