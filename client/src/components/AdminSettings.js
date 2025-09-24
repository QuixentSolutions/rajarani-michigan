import React from "react";
import OrderTypeRadios from './OrderTypeRadios';

const AdminSettings = ({ selected, handleChange, saveSettings }) => {
  return (
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
        <button
          onClick={() => saveSettings()}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Save Settings
        </button>
      </div>

      <div className="table-container" style={{ padding: "2rem" }}>
        <OrderTypeRadios selected={selected} handleChange={handleChange} />
      </div>
    </div>
  );
};

export default AdminSettings;