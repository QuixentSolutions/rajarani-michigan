import React from "react";
import OrdersTable from './OrdersTable';

const AdminReports = ({
  viewOrderDetils,
  renderPagination,
  menuData,
  fetchMenuData,
  searchMenuQuery,
  refreshOrderReports
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
          gap: "12px"
        }}
      >
        <h2 className="section-title">Reports</h2>
        <button
          onClick={refreshOrderReports || (() => fetchMenuData(menuData.currentPage, searchMenuQuery))}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            minWidth: "fit-content",
            whiteSpace: "nowrap"
          }}
        >
          Refresh Reports
        </button>
      </div>

      <div className="table-container" style={{ overflowX: "auto" }}>
        <OrdersTable viewOrderDetils={viewOrderDetils} />
      </div>

      {renderPagination(menuData, (page) =>
        fetchMenuData(page, searchMenuQuery)
      )}
    </div>
  );
};

export default AdminReports;