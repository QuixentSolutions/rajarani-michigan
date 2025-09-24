import React from "react";

const AdminRegistrations = ({ registrations, fetchRegistrations, searchRegistrationQuery, renderPagination }) => {
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
        <h2 className="section-title">Event Registrations</h2>
        <button
          onClick={() => fetchRegistrations(registrations.currentPage, searchRegistrationQuery)}
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No registrations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderPagination(registrations, (page) =>
        fetchRegistrations(page, searchRegistrationQuery)
      )}
    </div>
  );
};

export default AdminRegistrations;