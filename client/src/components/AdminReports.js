import React from "react";
import OrdersTable from "./OrdersTable";

const AdminReports = ({
  viewOrderDetils,
  renderPagination,
  ordersData,
  fetchOrders,
  searchOrderQuery,
}) => {
  return (
    <div className="section-card">
      <div
        className="section-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2 className="section-title">Reports</h2>
        <button
          onClick={() => fetchOrders(ordersData.currentPage, searchOrderQuery)}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            minWidth: "fit-content",
            whiteSpace: "nowrap",
          }}
        >
          Refresh Reports
        </button>
      </div>

      <div className="table-container" style={{ overflowX: "auto" }}>
        <OrdersTable viewOrderDetils={viewOrderDetils} />
      </div>

      {renderPagination(ordersData, (page) =>
        fetchOrders(page, searchOrderQuery),
      )}
    </div>
  );
};

export default AdminReports;
