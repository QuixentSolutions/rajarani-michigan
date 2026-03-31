import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  partnerName: "",
  grossAmount: "",
  notes: "",
};

const AdminOnlineOrderSales = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);

  // Delivery partners list
  const [partners, setPartners] = useState([]);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [showPartnersPanel, setShowPartnersPanel] = useState(false);
  const [partnerSaving, setPartnerSaving] = useState(false);

  // Sales entries
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Filter by partner
  const [filterPartner, setFilterPartner] = useState("All");

  // Inline settlement state
  const [settlingId, setSettlingId] = useState(null);
  const [settlementForm, setSettlementForm] = useState({
    commission: "",
    settlementDate: new Date().toISOString().split("T")[0],
  });
  const [settlingSaving, setSettlingSaving] = useState(false);

  // ── Data loaders ─────────────────────────────────────────────────────────────

  const loadPartners = useCallback(async () => {
    try {
      const res = await fetch(`/stores/${storeSlug}/delivery-partners`);
      const data = await res.json();
      setPartners(Array.isArray(data) ? data : []);
    } catch {
      setPartners([]);
    }
  }, [storeSlug]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/stores/${storeSlug}/delivery-partner-sales?limit=200`,
      );
      const data = await res.json();
      setEntries(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadPartners();
    loadEntries();
  }, [loadPartners, loadEntries]);

  // ── Partner management ────────────────────────────────────────────────────────

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) return;
    setPartnerSaving(true);
    try {
      const res = await fetch(`/stores/${storeSlug}/delivery-partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPartnerName.trim() }),
      });
      if (res.ok) {
        setNewPartnerName("");
        await loadPartners();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add partner");
      }
    } finally {
      setPartnerSaving(false);
    }
  };

  const handleDeletePartner = async (id, name) => {
    if (
      !window.confirm(
        `Delete partner "${name}"? Existing sales entries will not be affected.`,
      )
    )
      return;
    await fetch(`/stores/${storeSlug}/delivery-partners/${id}`, {
      method: "DELETE",
    });
    await loadPartners();
  };

  // ── Sales entry CRUD ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMsg("");
  };

  const handleEdit = (entry) => {
    setForm({
      date: entry.date ? entry.date.split("T")[0] : "",
      partnerName: entry.partnerName || "",
      grossAmount: entry.grossAmount ?? "",
      notes: entry.notes || "",
    });
    setEditingId(entry._id);
    setShowForm(true);
    setSettlingId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await fetch(`/stores/${storeSlug}/delivery-partner-sales/${id}`, {
      method: "DELETE",
    });
    await loadEntries();
  };

  const handleSave = async () => {
    if (!form.date) {
      setMsg("Date is required.");
      return;
    }
    if (!form.partnerName) {
      setMsg("Select a delivery partner.");
      return;
    }
    if (!form.grossAmount || parseFloat(form.grossAmount) <= 0) {
      setMsg("Enter a gross sales amount.");
      return;
    }
    setSaving(true);
    setMsg("");

    const payload = {
      partnerName: form.partnerName,
      date: form.date,
      grossAmount: parseFloat(form.grossAmount),
      notes: form.notes,
      // reset settlement fields on new entry
      ...(editingId
        ? {}
        : {
            settled: false,
            settlementDate: null,
            commission: 0,
            netAmount: 0,
          }),
    };

    try {
      const url = editingId
        ? `/stores/${storeSlug}/delivery-partner-sales/${editingId}`
        : `/stores/${storeSlug}/delivery-partner-sales`;
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

  // ── Settlement flow ───────────────────────────────────────────────────────────

  const openSettle = (entry) => {
    setSettlingId(entry._id);
    setSettlementForm({
      commission: "",
      settlementDate: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
  };

  const cancelSettle = () => {
    setSettlingId(null);
    setSettlementForm({
      commission: "",
      settlementDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleSettleEntry = async (entry) => {
    if (settlementForm.commission === "") {
      alert("Enter the commission amount (enter 0 if none).");
      return;
    }
    const commission = parseFloat(settlementForm.commission) || 0;
    const netAmount = parseFloat(
      ((entry.grossAmount || 0) - commission).toFixed(2),
    );

    setSettlingSaving(true);
    try {
      const res = await fetch(
        `/stores/${storeSlug}/delivery-partner-sales/${entry._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settled: true,
            settlementDate: settlementForm.settlementDate,
            commission,
            netAmount,
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

  // ── Computed summaries ────────────────────────────────────────────────────────

  const totalGross = entries.reduce((s, e) => s + (e.grossAmount || 0), 0);
  const totalCommission = entries.reduce((s, e) => s + (e.commission || 0), 0);
  const totalNetReceived = entries
    .filter((e) => e.settled)
    .reduce((s, e) => s + (e.netAmount || 0), 0);
  const totalPending = entries
    .filter((e) => !e.settled)
    .reduce((s, e) => s + (e.grossAmount || 0), 0);

  // Per-partner summary
  const partnerSummary = entries.reduce((acc, e) => {
    if (!acc[e.partnerName])
      acc[e.partnerName] = {
        gross: 0,
        commission: 0,
        net: 0,
        pending: 0,
        count: 0,
      };
    acc[e.partnerName].gross += e.grossAmount || 0;
    acc[e.partnerName].commission += e.commission || 0;
    acc[e.partnerName].count += 1;
    if (e.settled) {
      acc[e.partnerName].net += e.netAmount || 0;
    } else {
      acc[e.partnerName].pending += e.grossAmount || 0;
    }
    return acc;
  }, {});

  // Filtered entries for table
  const filteredEntries =
    filterPartner === "All"
      ? entries
      : entries.filter((e) => e.partnerName === filterPartner);

  // All unique partner names in entries (for filter pills)
  const partnerNamesInEntries = [
    ...new Set(entries.map((e) => e.partnerName)),
  ].filter(Boolean);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="section-card">
      {/* Header */}
      <div
        className="section-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowPartnersPanel((v) => !v)}
            style={{
              padding: "8px 14px",
              backgroundColor: showPartnersPanel ? "#6c757d" : "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "0.88rem",
            }}
          >
            {showPartnersPanel ? "Close Partners" : "Manage Partners"}
          </button>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              if (showForm) resetForm();
              setSettlingId(null);
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
      </div>

      {/* Note */}
      <div
        style={{
          background: "#e8f4fd",
          border: "1px solid #bee5eb",
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: "0.88rem",
          color: "#0c5460",
        }}
      >
        <strong>Note:</strong> Record daily gross sales per delivery partner.
        Once the partner pays out (usually a few days later with commission
        deducted), use <strong>"Settle"</strong> to record the actual amount
        received.
      </div>

      {/* Delivery partners management panel */}
      {showPartnersPanel && (
        <div style={{ ...formCard, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: "1rem" }}>
            Delivery Partners
          </h3>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder="Partner name (e.g. DoorDash)"
              value={newPartnerName}
              onChange={(e) => setNewPartnerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPartner()}
              style={{ ...inputStyle, width: 220, flex: "0 0 auto" }}
            />
            <button
              onClick={handleAddPartner}
              disabled={partnerSaving || !newPartnerName.trim()}
              style={{
                padding: "7px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {partnerSaving ? "Adding…" : "Add"}
            </button>
          </div>
          {partners.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.88rem" }}>
              No partners added yet.
            </p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {partners.map((p) => (
                <div
                  key={p._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f0f0f0",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: "0.88rem",
                  }}
                >
                  <span>{p.name}</span>
                  <button
                    onClick={() => handleDeletePartner(p._id, p.name)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc3545",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "1rem",
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overall summary cards */}
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}
      >
        <div style={summaryCard("#6f42c1")}>
          <span>Total Gross</span>
          <strong>${totalGross.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#dc3545")}>
          <span>Commission</span>
          <strong>-${totalCommission.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#fd7e14")}>
          <span>Pending Settlement</span>
          <strong>${totalPending.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#28a745")}>
          <span>Net Received</span>
          <strong>${totalNetReceived.toFixed(2)}</strong>
        </div>
      </div>

      {/* Per-partner breakdown */}
      {Object.keys(partnerSummary).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#444",
              marginBottom: 10,
            }}
          >
            Per-Partner Breakdown
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.88rem",
              }}
            >
              <thead>
                <tr style={{ background: "#f0f4ff" }}>
                  {[
                    "Partner",
                    "Entries",
                    "Gross ($)",
                    "Commission ($)",
                    "Pending ($)",
                    "Net Received ($)",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{ ...thStyle, background: "transparent" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(partnerSummary).map(([name, s]) => (
                  <tr key={name} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
                    <td style={tdStyle}>{s.count}</td>
                    <td
                      style={{ ...tdStyle, color: "#6f42c1", fontWeight: 600 }}
                    >
                      ${s.gross.toFixed(2)}
                    </td>
                    <td
                      style={{ ...tdStyle, color: "#dc3545", fontWeight: 600 }}
                    >
                      -${s.commission.toFixed(2)}
                    </td>
                    <td
                      style={{ ...tdStyle, color: "#fd7e14", fontWeight: 600 }}
                    >
                      ${s.pending.toFixed(2)}
                    </td>
                    <td
                      style={{ ...tdStyle, color: "#28a745", fontWeight: 700 }}
                    >
                      ${s.net.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New / Edit entry form */}
      {showForm && (
        <div style={formCard}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            {editingId ? "Edit Entry" : "New Sales Entry"}
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
            <FormField label="Delivery Partner *">
              {partners.length > 0 ? (
                <select
                  value={form.partnerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, partnerName: e.target.value }))
                  }
                  style={inputStyle}
                >
                  <option value="">— Select partner —</option>
                  {partners.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder="Partner name"
                  value={form.partnerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, partnerName: e.target.value }))
                  }
                  style={inputStyle}
                />
              )}
              {partners.length === 0 && (
                <small style={{ color: "#888", fontSize: "0.76rem" }}>
                  Add partners via "Manage Partners" or type directly
                </small>
              )}
            </FormField>
            <FormField label="Gross Sales ($) — as reported to partner">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.grossAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grossAmount: e.target.value }))
                }
                style={inputStyle}
              />
              <small style={{ color: "#888", fontSize: "0.76rem" }}>
                Settlement + commission recorded later
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

      {/* Filter pills */}
      {partnerNamesInEntries.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#555" }}>
            Show:
          </span>
          {["All", ...partnerNamesInEntries].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPartner(p)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid #ccc",
                cursor: "pointer",
                background: filterPartner === p ? "#007bff" : "white",
                color: filterPartner === p ? "white" : "#333",
                fontSize: "0.84rem",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Entries table */}
      {loading ? (
        <p style={{ color: "#888", padding: 20 }}>Loading…</p>
      ) : filteredEntries.length === 0 ? (
        <p style={{ color: "#888", padding: 20 }}>No entries found.</p>
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
                  "Partner",
                  "Gross ($)",
                  "Status",
                  "Commission ($)",
                  "Net ($)",
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
              {filteredEntries.map((entry) => (
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

                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 12,
                          background: partnerColor(entry.partnerName),
                          color: "white",
                          fontSize: "0.8rem",
                        }}
                      >
                        {entry.partnerName}
                      </span>
                    </td>

                    <td
                      style={{ ...tdStyle, color: "#6f42c1", fontWeight: 600 }}
                    >
                      ${(entry.grossAmount || 0).toFixed(2)}
                    </td>

                    <td style={tdStyle}>
                      {entry.settled ? (
                        <div>
                          <span style={badge("#28a745")}>Settled</span>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#666",
                              marginTop: 2,
                            }}
                          >
                            {entry.settlementDate
                              ? new Date(
                                  entry.settlementDate,
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <span style={badge("#fd7e14")}>Pending</span>
                      )}
                    </td>

                    <td
                      style={{ ...tdStyle, color: "#dc3545", fontWeight: 600 }}
                    >
                      {entry.settled
                        ? `-$${(entry.commission || 0).toFixed(2)}`
                        : "—"}
                    </td>

                    <td
                      style={{ ...tdStyle, color: "#28a745", fontWeight: 700 }}
                    >
                      {entry.settled ? (
                        `$${(entry.netAmount || 0).toFixed(2)}`
                      ) : (
                        <span
                          style={{
                            color: "#fd7e14",
                            fontWeight: 400,
                            fontSize: "0.82rem",
                          }}
                        >
                          Pending
                        </span>
                      )}
                    </td>

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

                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {!entry.settled && settlingId !== entry._id && (
                        <button
                          onClick={() => openSettle(entry)}
                          style={{
                            display: "block",
                            marginBottom: 4,
                            padding: "4px 10px",
                            border: "1px solid #fd7e14",
                            borderRadius: 4,
                            color: "#fd7e14",
                            background: "white",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                          }}
                        >
                          Settle
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{
                          display: "block",
                          marginBottom: 4,
                          padding: "4px 10px",
                          border: "1px solid #007bff",
                          borderRadius: 4,
                          color: "#007bff",
                          background: "white",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        style={{
                          display: "block",
                          padding: "4px 10px",
                          border: "1px solid #dc3545",
                          borderRadius: 4,
                          color: "#dc3545",
                          background: "white",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Inline settlement form */}
                  {settlingId === entry._id && (
                    <tr
                      style={{
                        borderBottom: "1px solid #eee",
                        background: "#fffbf0",
                      }}
                    >
                      <td colSpan={8} style={{ padding: "14px 12px" }}>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "#795548",
                          }}
                        >
                          Record Settlement from{" "}
                          <strong>{entry.partnerName}</strong> — Gross: $
                          {(entry.grossAmount || 0).toFixed(2)}
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
                              placeholder="e.g. 25.00"
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
                              style={{ fontSize: "0.9rem", paddingBottom: 8 }}
                            >
                              <span style={{ color: "#555" }}>
                                Net received:{" "}
                              </span>
                              <strong style={{ color: "#28a745" }}>
                                $
                                {(
                                  (entry.grossAmount || 0) -
                                  (parseFloat(settlementForm.commission) || 0)
                                ).toFixed(2)}
                              </strong>
                            </div>
                          )}
                          <button
                            onClick={() => handleSettleEntry(entry)}
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
                            {settlingSaving ? "Saving…" : "Confirm Settlement"}
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

// Give each partner a consistent color based on its name
const PARTNER_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
  "#e91e63",
  "#ff5722",
];
function partnerColor(name) {
  if (!name) return "#777";
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PARTNER_COLORS[Math.abs(hash) % PARTNER_COLORS.length];
}

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

export default AdminOnlineOrderSales;
