import React, { useState, useEffect, useCallback } from "react";

const AdminOrders = ({
  orders,
  tableStatuses,
  fetchOrders,
  searchOrderQuery,
  showBill,
  handleAcceptedOnlineorders,
  handleView,
  renderPagination,
}) => {
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(orders.currentPage, searchOrderQuery);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders, orders.currentPage, searchOrderQuery]);

  // Detect new orders when orders.items changes
  useEffect(() => {
    if (orders.items.length > 0) {
      const currentIds = new Set(orders.items.map(order => order._id));
      const newIds = [...currentIds].filter(id => !newOrderIds.has(id));
      
      if (newIds.length > 0) {
        setNewOrderIds(new Set([...newOrderIds, ...newIds]));
        
        // Remove blinking after 10 seconds
        setTimeout(() => {
          setNewOrderIds(prevSet => {
            const updated = new Set(prevSet);
            newIds.forEach(id => updated.delete(id));
            return updated;
          });
        }, 10000);
      }
    }
  }, [orders.items]);

  return (
    <>
      <style>{`
        .new-order-row-blink {
          animation: orderRowBlink 1s linear 10;
        }
        @keyframes orderRowBlink {
          0%, 100% { background-color: transparent; }
          50% { background-color: #fef3c7; }
        }
      `}</style>

      <div className="section-card">
        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="section-title">Order Management</h2>
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
                      order.payment.status === "paid" && (
                        <tr 
                          key={order._id}
                          className={newOrderIds.has(order._id) ? 'new-order-row-blink' : ''}
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

        {renderPagination(orders, (page) => fetchOrders(page, searchOrderQuery))}
      </div>
    </>
  );
};

export default AdminOrders;