import React from "react";

const OrderTypeRadios = ({ selected, handleChange }) => {
  return (
    <div>
      {Object.keys(selected).map((key) => {
        const value = selected[key];
        return (
          <div key={key} style={{ marginBottom: "10px" }}>
            <div>Allow {key}</div>
            <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
              {[
                { label: "YES", value: true },
                { label: "NO", value: false },
              ].map((opt) => {
                const isActive = value === opt.value;
                return (
                  <div
                    key={opt.label}
                    onClick={() => handleChange(key, opt.value)}
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
        );
      })}
    </div>
  );
};

export default OrderTypeRadios;