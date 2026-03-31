import React from "react";
import OrderTypeRadios from "./OrderTypeRadios";

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
        <button
          onClick={() => saveSettings()}
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
          Save Settings
        </button>
      </div>

      <div className="table-container" style={{ padding: "2rem" }}>
        <OrderTypeRadios selected={selected} handleChange={handleChange} />

        {/* Discount Settings - Only if discount field exists in settings */}
        {selected.hasOwnProperty("discount") && (
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "2rem",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <div>Allow Discount</div>
              <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
                {[
                  { label: "YES", value: true },
                  { label: "NO", value: false },
                ].map((opt) => {
                  const isActive = selected.discount === opt.value;
                  return (
                    <div
                      key={opt.label}
                      onClick={() => handleChange("discount", opt.value)}
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

            {/* Discount Details */}
            {selected.discount && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1.5rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ marginBottom: "1rem", color: "#333" }}>
                  Discount Details
                </h3>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Discount Name:
                  </label>
                  <input
                    type="text"
                    value={selected.discountDetails?.name || ""}
                    onChange={(e) =>
                      handleChange("discountDetails.name", e.target.value)
                    }
                    placeholder="Enter discount name (e.g., Happy Hour, Weekend Special)"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Discount Percentage:
                  </label>
                  <input
                    type="number"
                    value={selected.discountDetails?.percentage || ""}
                    onChange={(e) =>
                      handleChange("discountDetails.percentage", e.target.value)
                    }
                    placeholder="Enter percentage (e.g., 10 for 10%)"
                    min="0"
                    max="100"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
