import React, { useState, useEffect, useCallback } from "react";

const AdminOrders = ({
  orders,
  tableStatuses,
  fetchOrders,
  searchOrderQuery,
  showBill,
  handleAcceptedOnlineorders,
  handleRejectOnlineorders,
  handleView,
  renderPagination,
  refresh,
}) => {
  useEffect(() => {
    fetchOrders(orders.currentPage, searchOrderQuery);
  }, [orders.currentPage, searchOrderQuery]);

  useEffect(() => {
    if (refresh) {
      fetchOrders(orders.currentPage, searchOrderQuery);
    }
  }, [refresh]);

  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (refresh) {
      setBlink(true);
      const timer = setTimeout(() => {
        setBlink(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [refresh]);

  return (
    <>
      <style>
        {`
@keyframes blinkRow {
  0% { background-color: #fff7ed; }
  50% { background-color: #fde68a; }
  100% { background-color: #fff7ed; }
}
`}
      </style>
      <div className="section-card">
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
                orders.items.map((order, index) => (
                  <>
                    {order.orderType !== "dinein" &&
                      order.payment.status === "paid" && (
                        <tr
                          key={order._id}
                          style={{
                            borderBottom: "1px solid #64748b",
                            transition: "background-color 0.2s ease",
                            animation:
                              blink && index === 0
                                ? "blinkRow 1s infinite"
                                : "none",
                          }}
                        >
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

                          <td>{new Date(order.createdAt).toLocaleString()}</td>
                          <td>
                            {order.status === "pending" && (
                              <button
                                className="view-btn"
                                style={{
                                  background:
                                    "linear-gradient(135deg, green, blue)",
                                }}
                                onClick={() =>
                                  handleAcceptedOnlineorders(order.orderNumber)
                                }
                              >
                                Accept
                              </button>
                            )}
                            {order.status === "pending" && (
                              <button
                                className="view-btn"
                                style={{
                                  background:
                                    "linear-gradient(135deg, red, blue)",
                                }}
                                onClick={() =>
                                  handleRejectOnlineorders(order.orderNumber)
                                }
                              >
                                Reject
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

                            {order.status === "rejected" && (
                              <span
                                style={{
                                  color: "red",
                                }}
                              >
                                Rejected
                              </span>
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
    </>
  );
};

export default AdminOrders;
