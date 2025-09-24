import React, { useState, useEffect, useCallback } from "react";

const OrdersTable = ({ viewOrderDetils }) => {
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

  const fetchOrderReports = useCallback(async () => {
    try {
      const response = await fetch(`/order/all?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }
      const data = await response.json();
      setOrderReports(data.results || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load order reports:", err);
      setOrderReports([]);
      setTotalPages(1);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchOrderReports();
  }, [fetchOrderReports]);

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

export default OrdersTable;