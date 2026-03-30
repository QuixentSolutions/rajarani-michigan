import React from "react";

const AdminRegistrations = ({
  registrations,
  fetchRegistrations,
  searchRegistrationQuery,
  renderPagination,
}) => {
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
        <h2 className="section-title">Registrations</h2>
        <button
          onClick={() =>
            fetchRegistrations(
              registrations.currentPage,
              searchRegistrationQuery,
            )
          }
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
          Refresh Registrations
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile Number</th>
              <th>Event Date</th>
              <th>Event Name</th>
              <th>Quantity</th>
              <th>Food Preference</th>
            </tr>
          </thead>
          <tbody>
            {registrations.items.length > 0 ? (
              registrations.items.map((reg) => (
                <tr key={reg._id}>
                  <td>
                    <strong>{reg.name || "N/A"}</strong>
                  </td>
                  <td>{reg.email || "N/A"}</td>
                  <td>{reg.mobile || "N/A"}</td>
                  <td>
                    {reg.eventDate
                      ? new Date(reg.eventDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{reg.eventName}</td>
                  <td>{reg.quantity || "1"}</td>
                  <td>
                    {(() => {
                      const vegCount = reg.vegCount || 0;
                      const nonVegCount = reg.nonVegCount || 0;
                      const quantity = parseInt(reg.quantity) || 1;

                      // For new registrations with proper veg/non-veg counts
                      if (vegCount > 0 && nonVegCount > 0) {
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                backgroundColor: "#d4edda",
                                color: "#155724",
                                display: "inline-block",
                              }}
                            >
                              🥗 {vegCount} Veg
                            </span>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                backgroundColor: "#f8d7da",
                                color: "#721c24",
                                display: "inline-block",
                              }}
                            >
                              🍗 {nonVegCount} Non-Veg
                            </span>
                          </div>
                        );
                      }
                      // For registrations with only veg or only non-veg
                      else if (vegCount > 0) {
                        return (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#d4edda",
                              color: "#155724",
                            }}
                          >
                            🥗 {vegCount} Vegetarian
                          </span>
                        );
                      }
                      // For registrations with only non-veg
                      else if (nonVegCount > 0) {
                        return (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#f8d7da",
                              color: "#721c24",
                            }}
                          >
                            🍗 {nonVegCount} Non-Vegetarian
                          </span>
                        );
                      }
                      // For legacy registrations with no veg/non-veg counts, assume vegetarian
                      else {
                        return (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#d4edda",
                              color: "#155724",
                            }}
                          >
                            Not Available
                          </span>
                        );
                      }
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  No registrations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderPagination(registrations, (page) =>
        fetchRegistrations(page, searchRegistrationQuery),
      )}
    </div>
  );
};

export default AdminRegistrations;
