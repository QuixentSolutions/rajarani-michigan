import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

const SALES_TYPE = "dinein";

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  cashAmount: "",
  cardAmount: "",
  notes: "",
};

const AdminDineInSales = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Card settlement inline state: { id, commission, settlementDate }
  const [settlingId, setSettlingId] = useState(null);
  const [settlementForm, setSettlementForm] = useState({
    commission: "",
    settlementDate: new Date().toISOString().split("T")[0],
  });
  const [settlingSaving, setSettlingSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/stores/${storeSlug}/manual-sales?type=${SALES_TYPE}&limit=100`,
      );
      const data = await res.json();
      setEntries(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMsg("");
  };

  const handleEdit = (entry) => {
    setForm({
      date: entry.date ? entry.date.split("T")[0] : "",
      cashAmount: entry.cashAmount ?? "",
      cardAmount: entry.cardAmount ?? "",
      notes: entry.notes || "",
    });
    setEditingId(entry._id);
    setShowForm(true);
    setSettlingId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await fetch(`/stores/${storeSlug}/manual-sales/${id}`, {
      method: "DELETE",
    });
    await loadEntries();
  };

  const handleSave = async () => {
    if (!form.date) {
      setMsg("Date is required.");
      return;
    }
    if (form.cashAmount === "" && form.cardAmount === "") {
      setMsg("Enter at least one of Cash or Card amount.");
      return;
    }
    setSaving(true);
    setMsg("");

    const cardAmt = parseFloat(form.cardAmount) || 0;
    const payload = {
      type: SALES_TYPE,
      date: form.date,
      cashAmount: parseFloat(form.cashAmount) || 0,
      cardAmount: cardAmt,
      // When editing a settled entry that has card changed, reset settlement
      ...(editingId
        ? {}
        : {
            cardSettled: false,
            cardSettlementDate: null,
            cardCommission: 0,
            cardNetAmount: 0,
          }),
      notes: form.notes,
    };

    try {
      const url = editingId
        ? `/stores/${storeSlug}/manual-sales/${editingId}`
        : `/stores/${storeSlug}/manual-sales`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setMsg(`Error: ${err.error}`);
      } else {
        setMsg(editingId ? "Entry updated!" : "Entry saved!");
        await loadEntries();
        resetForm();
        setShowForm(false);
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {
      setMsg("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  // Open the inline settlement form for a row
  const openSettle = (entry) => {
    setSettlingId(entry._id);
    setSettlementForm({
      commission: "",
      settlementDate: new Date().toISOString().split("T")[0],
    });
  };

  const cancelSettle = () => {
    setSettlingId(null);
    setSettlementForm({
      commission: "",
      settlementDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleSettleCard = async (entry) => {
    if (settlementForm.commission === "") {
      alert("Please enter the commission amount (enter 0 if none).");
      return;
    }
    const commission = parseFloat(settlementForm.commission) || 0;
    const netAmount = parseFloat(
      ((entry.cardAmount || 0) - commission).toFixed(2),
    );

    setSettlingSaving(true);
    try {
      const res = await fetch(
        `/stores/${storeSlug}/manual-sales/${entry._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardSettled: true,
            cardSettlementDate: settlementForm.settlementDate,
            cardCommission: commission,
            cardNetAmount: netAmount,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      } else {
        await loadEntries();
        cancelSettle();
      }
    } catch {
      alert("Failed to record settlement.");
    } finally {
      setSettlingSaving(false);
    }
  };

  // Summary totals
  const totalCash = entries.reduce((s, e) => s + (e.cashAmount || 0), 0);
  const totalCardGross = entries.reduce((s, e) => s + (e.cardAmount || 0), 0);
  const totalCommission = entries.reduce(
    (s, e) => s + (e.cardCommission || 0),
    0,
  );
  const totalCardNet = entries
    .filter((e) => e.cardSettled)
    .reduce((s, e) => s + (e.cardNetAmount || 0), 0);
  const totalCardPending = entries
    .filter((e) => !e.cardSettled && (e.cardAmount || 0) > 0)
    .reduce((s, e) => s + (e.cardAmount || 0), 0);
  const totalNetIncome = totalCash + totalCardNet;

  return (
    <div className="section-card">
      <div
        className="section-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <button
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) resetForm();
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: showForm ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ Add Entry"}
        </button>
      </div>

      {/* Summary cards */}
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}
      >
        <div style={summaryCard("#17a2b8")}>
          <span>Cash Received</span>
          <strong>${totalCash.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#6f42c1")}>
          <span>Card (Gross)</span>
          <strong>${totalCardGross.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#dc3545")}>
          <span>Commission</span>
          <strong>-${totalCommission.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#fd7e14")}>
          <span>Pending Settlement</span>
          <strong>${totalCardPending.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#28a745")}>
          <span>Total Net Income</span>
          <strong>${totalNetIncome.toFixed(2)}</strong>
        </div>
      </div>

      {/* Note about card settlement */}
      <div
        style={{
          background: "#fff8e1",
          border: "1px solid #ffe082",
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: "0.88rem",
          color: "#795548",
        }}
      >
        <strong>Note:</strong> Cash sales are immediate income. Card sales are
        recorded at time of charge but settle a few days later with a commission
        deducted. Use <strong>"Settle Card"</strong> on each entry when the bank
        settlement arrives.
      </div>

      {/* New / Edit form */}
      {showForm && (
        <div style={formCard}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            {editingId ? "Edit Entry" : "New Dine In Sales Entry"}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <FormField label="Date *">
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                style={inputStyle}
              />
            </FormField>
            <FormField label="Cash Sales ($) — Immediate income">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.cashAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cashAmount: e.target.value }))
                }
                style={inputStyle}
              />
            </FormField>
            <FormField label="Card Sales ($) — Gross charged to customers">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.cardAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardAmount: e.target.value }))
                }
                style={inputStyle}
              />
              <small style={{ color: "#888", fontSize: "0.78rem" }}>
                Settlement + commission to be recorded later
              </small>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Optional notes…"
              style={{ ...inputStyle, resize: "vertical", width: "100%" }}
            />
          </FormField>
          {(parseFloat(form.cashAmount) > 0 ||
            parseFloat(form.cardAmount) > 0) && (
            <p style={{ marginTop: 8, fontWeight: 600, color: "#333" }}>
              Entry Total: $
              {(
                (parseFloat(form.cashAmount) || 0) +
                (parseFloat(form.cardAmount) || 0)
              ).toFixed(2)}
            </p>
          )}
          {msg && (
            <p
              style={{
                color: msg.startsWith("Error") ? "#dc3545" : "#28a745",
                margin: "8px 0",
              }}
            >
              {msg}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {saving ? "Saving…" : editingId ? "Update" : "Save"}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              style={{
                padding: "10px 16px",
                background: "none",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ color: "#888", padding: 20 }}>Loading…</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#888", padding: 20 }}>
          No dine in sales entries yet.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {[
                  "Date",
                  "Cash ($)",
                  "Card Gross ($)",
                  "Card Status",
                  "Commission ($)",
                  "Card Net ($)",
                  "Net Income ($)",
                  "Notes",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <React.Fragment key={entry._id}>
                  <tr
                    style={{
                      borderBottom:
                        settlingId === entry._id ? "none" : "1px solid #eee",
                    }}
                  >
                    <td style={tdStyle}>
                      {entry.date
                        ? new Date(entry.date).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Cash — immediate */}
                    <td
                      style={{ ...tdStyle, color: "#17a2b8", fontWeight: 600 }}
                    >
                      ${(entry.cashAmount || 0).toFixed(2)}
                    </td>

                    {/* Card gross */}
                    <td
                      style={{ ...tdStyle, color: "#6f42c1", fontWeight: 600 }}
                    >
                      {(entry.cardAmount || 0) > 0
                        ? `$${entry.cardAmount.toFixed(2)}`
                        : "—"}
                    </td>

                    {/* Card status badge */}
                    <td style={tdStyle}>
                      {(entry.cardAmount || 0) === 0 ? (
                        <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                          N/A
                        </span>
                      ) : entry.cardSettled ? (
                        <div>
                          <span style={badge("#28a745")}>Settled</span>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#666",
                              marginTop: 2,
                            }}
                          >
                            {entry.cardSettlementDate
                              ? new Date(
                                  entry.cardSettlementDate,
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <span style={badge("#fd7e14")}>Pending</span>
                      )}
                    </td>

                    {/* Commission */}
                    <td
                      style={{ ...tdStyle, color: "#dc3545", fontWeight: 600 }}
                    >
                      {entry.cardSettled
                        ? `-$${(entry.cardCommission || 0).toFixed(2)}`
                        : "—"}
                    </td>

                    {/* Card net */}
                    <td
                      style={{ ...tdStyle, color: "#28a745", fontWeight: 600 }}
                    >
                      {entry.cardSettled
                        ? `$${(entry.cardNetAmount || 0).toFixed(2)}`
                        : "—"}
                    </td>

                    {/* Net income this row */}
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#333" }}>
                      $
                      {(
                        (entry.cashAmount || 0) +
                        (entry.cardSettled ? entry.cardNetAmount || 0 : 0)
                      ).toFixed(2)}
                      {!entry.cardSettled && (entry.cardAmount || 0) > 0 && (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "#fd7e14",
                            fontWeight: 400,
                          }}
                        >
                          +${(entry.cardAmount || 0).toFixed(2)} pending
                        </div>
                      )}
                    </td>

                    {/* Notes */}
                    <td
                      style={{
                        ...tdStyle,
                        color: "#666",
                        fontSize: "0.82rem",
                        maxWidth: 120,
                      }}
                    >
                      {entry.notes || "—"}
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {(entry.cardAmount || 0) > 0 &&
                        !entry.cardSettled &&
                        settlingId !== entry._id && (
                          <button
                            onClick={() => openSettle(entry)}
                            style={{
                              marginRight: 6,
                              marginBottom: 4,
                              padding: "4px 10px",
                              border: "1px solid #fd7e14",
                              borderRadius: 4,
                              color: "#fd7e14",
                              background: "white",
                              cursor: "pointer",
                              fontSize: "0.82rem",
                              display: "block",
                            }}
                          >
                            Settle Card
                          </button>
                        )}
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{
                          marginRight: 6,
                          marginBottom: 4,
                          padding: "4px 10px",
                          border: "1px solid #007bff",
                          borderRadius: 4,
                          color: "#007bff",
                          background: "white",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                          display: "block",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid #dc3545",
                          borderRadius: 4,
                          color: "#dc3545",
                          background: "white",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                          display: "block",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Inline settlement form row */}
                  {settlingId === entry._id && (
                    <tr
                      style={{
                        borderBottom: "1px solid #eee",
                        background: "#fffbf0",
                      }}
                    >
                      <td colSpan={9} style={{ padding: "14px 12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin: "0 0 6px",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                color: "#795548",
                              }}
                            >
                              Record Card Settlement for $
                              {(entry.cardAmount || 0).toFixed(2)}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "flex-end",
                              }}
                            >
                              <FormField label="Settlement Date">
                                <input
                                  type="date"
                                  value={settlementForm.settlementDate}
                                  onChange={(e) =>
                                    setSettlementForm((f) => ({
                                      ...f,
                                      settlementDate: e.target.value,
                                    }))
                                  }
                                  style={{ ...inputStyle, width: 160 }}
                                />
                              </FormField>
                              <FormField label="Commission / Fee ($)">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g. 12.50"
                                  value={settlementForm.commission}
                                  onChange={(e) =>
                                    setSettlementForm((f) => ({
                                      ...f,
                                      commission: e.target.value,
                                    }))
                                  }
                                  style={{ ...inputStyle, width: 140 }}
                                />
                              </FormField>
                              {settlementForm.commission !== "" && (
                                <div
                                  style={{
                                    fontSize: "0.9rem",
                                    paddingBottom: 8,
                                  }}
                                >
                                  <span style={{ color: "#555" }}>
                                    Net received:{" "}
                                  </span>
                                  <strong style={{ color: "#28a745" }}>
                                    $
                                    {(
                                      (entry.cardAmount || 0) -
                                      (parseFloat(settlementForm.commission) ||
                                        0)
                                    ).toFixed(2)}
                                  </strong>
                                </div>
                              )}
                              <button
                                onClick={() => handleSettleCard(entry)}
                                disabled={settlingSaving}
                                style={{
                                  padding: "8px 18px",
                                  backgroundColor: "#28a745",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  marginBottom: 2,
                                }}
                              >
                                {settlingSaving
                                  ? "Saving…"
                                  : "Confirm Settlement"}
                              </button>
                              <button
                                onClick={cancelSettle}
                                style={{
                                  padding: "8px 14px",
                                  background: "none",
                                  border: "1px solid #ccc",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  marginBottom: 2,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#555" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function badge(color) {
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    background: color,
    color: "white",
    fontSize: "0.78rem",
    fontWeight: 600,
  };
}

function summaryCard(color) {
  return {
    flex: "1 1 130px",
    background: color,
    color: "white",
    borderRadius: 8,
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: "0.9rem",
  };
}

const inputStyle = {
  padding: "7px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: "0.9rem",
  width: "100%",
  boxSizing: "border-box",
};

const formCard = {
  background: "#f9f9f9",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
};

const thStyle = {
  padding: "10px 8px",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: "2px solid #ddd",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 8px",
  verticalAlign: "middle",
};

export default AdminDineInSales;
