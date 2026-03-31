import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

const TAX_RATE = 0.06;

const STATUS_COLORS = {
  pending: "#f0ad4e",
  confirmed: "#5bc0de",
  completed: "#5cb85c",
  cancelled: "#d9534f",
};

const emptyItem = () => ({
  id: Date.now(),
  name: "",
  quantity: 1,
  unitPrice: "",
});

const AdminCatering = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const emptyForm = {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    eventDate: "",
    eventName: "",
    headcount: 1,
    deposit: 0,
    notes: "",
    status: "pending",
  };

  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState([emptyItem()]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeSlug}/catering?limit=100`);
      const data = await res.json();
      setOrders(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateItem = (id, field, value) =>
    setLineItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );

  const addItem = () => setLineItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subTotal = lineItems.reduce((sum, it) => {
    const a = parseFloat(it.quantity || 0) * parseFloat(it.unitPrice || 0);
    return sum + (isNaN(a) ? 0 : a);
  }, 0);

  const taxAmt = subTotal * TAX_RATE;
  const total = subTotal + taxAmt;
  const balance = total - parseFloat(form.deposit || 0);

  const resetForm = () => {
    setForm(emptyForm);
    setLineItems([emptyItem()]);
    setEditingId(null);
    setMsg("");
  };

  const handleEdit = (order) => {
    setForm({
      customerName: order.customer?.name || "",
      customerEmail: order.customer?.email || "",
      customerPhone: order.customer?.phone || "",
      eventDate: order.eventDate ? order.eventDate.split("T")[0] : "",
      eventName: order.eventName || "",
      headcount: order.headcount || 1,
      deposit: order.deposit || 0,
      notes: order.notes || "",
      status: order.status || "pending",
    });
    setLineItems(
      (order.items || []).map((it, i) => ({
        id: i,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    );
    setEditingId(order._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this catering order?")) return;
    await fetch(`/api/stores/${storeSlug}/catering/${id}`, {
      method: "DELETE",
    });
    await loadOrders();
  };

  const handleSave = async () => {
    if (!form.customerName.trim()) {
      setMsg("Customer name is required.");
      return;
    }
    if (!form.eventDate) {
      setMsg("Event date is required.");
      return;
    }
    setSaving(true);
    setMsg("");

    const payload = {
      customer: {
        name: form.customerName,
        email: form.customerEmail,
        phone: form.customerPhone,
      },
      eventDate: form.eventDate,
      eventName: form.eventName,
      headcount: parseInt(form.headcount) || 1,
      items: lineItems.map(({ name, quantity, unitPrice }) => ({
        name,
        quantity: parseFloat(quantity) || 1,
        unitPrice: parseFloat(unitPrice) || 0,
        total: (parseFloat(quantity) || 1) * (parseFloat(unitPrice) || 0),
      })),
      subTotal,
      tax: taxAmt,
      total,
      deposit: parseFloat(form.deposit) || 0,
      balance,
      notes: form.notes,
      status: form.status,
    };

    try {
      const url = editingId
        ? `/api/stores/${storeSlug}/catering/${editingId}`
        : `/api/stores/${storeSlug}/catering`;
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
        setMsg(editingId ? "Order updated!" : "Catering order saved!");
        await loadOrders();
        resetForm();
        setShowForm(false);
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {
      setMsg("Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const filtered =
    filterStatus === "All"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.total || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;

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
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: showForm ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ New Catering Order"}
        </button>
      </div>

      {/* Summary cards */}
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}
      >
        <div style={summaryCard("#28a745")}>
          <span>Total Revenue</span>
          <strong>${totalRevenue.toFixed(2)}</strong>
        </div>
        <div style={summaryCard("#f0ad4e")}>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div style={summaryCard("#5bc0de")}>
          <span>Confirmed</span>
          <strong>{confirmedCount}</strong>
        </div>
        <div style={summaryCard("#777")}>
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      {/* New / Edit form */}
      {showForm && (
        <div style={formCard}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            {editingId ? "Edit Catering Order" : "New Catering Order"}
          </h3>

          {/* Customer + Event info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <FormField label="Customer Name *">
              <input
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
                placeholder="Full name"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Phone">
              <input
                value={form.customerPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerPhone: e.target.value }))
                }
                placeholder="+1 555 000 0000"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Email">
              <input
                value={form.customerEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerEmail: e.target.value }))
                }
                placeholder="email@example.com"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Event Date *">
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, eventDate: e.target.value }))
                }
                style={inputStyle}
              />
            </FormField>
            <FormField label="Event Name">
              <input
                value={form.eventName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, eventName: e.target.value }))
                }
                placeholder="Wedding, Birthday…"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Headcount">
              <input
                type="number"
                min="1"
                value={form.headcount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, headcount: e.target.value }))
                }
                style={inputStyle}
              />
            </FormField>
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FormField>
          </div>

          {/* Line items */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr 1fr 1fr 32px",
                gap: 8,
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#555",
                marginBottom: 4,
              }}
            >
              <span>Item Description</span>
              <span style={{ textAlign: "center" }}>Qty</span>
              <span style={{ textAlign: "right" }}>Unit Price ($)</span>
              <span style={{ textAlign: "right" }}>Amount ($)</span>
              <span />
            </div>
            {lineItems.map((it) => {
              const amt =
                (parseFloat(it.quantity) || 0) *
                (parseFloat(it.unitPrice) || 0);
              return (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3fr 1fr 1fr 1fr 32px",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <input
                    placeholder="e.g. Biryani per head"
                    value={it.name}
                    onChange={(e) => updateItem(it.id, "name", e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(it.id, "quantity", e.target.value)
                    }
                    style={{ ...inputStyle, textAlign: "center" }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={it.unitPrice}
                    onChange={(e) =>
                      updateItem(it.id, "unitPrice", e.target.value)
                    }
                    style={{ ...inputStyle, textAlign: "right" }}
                  />
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      fontWeight: 600,
                    }}
                  >
                    ${isNaN(amt) ? "0.00" : amt.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(it.id)}
                    style={{
                      background: "none",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "#999",
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button
              onClick={addItem}
              style={{
                marginTop: 4,
                padding: "6px 14px",
                background: "none",
                border: "1px dashed #aaa",
                borderRadius: 4,
                cursor: "pointer",
                color: "#555",
              }}
            >
              + Add Item
            </button>
          </div>

          {/* Totals */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ minWidth: 260 }}>
              <TotalRow label="Subtotal" value={`$${subTotal.toFixed(2)}`} />
              <TotalRow label="Tax (6%)" value={`$${taxAmt.toFixed(2)}`} />
              <TotalRow label="Total" value={`$${total.toFixed(2)}`} bold />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <label
                  style={{
                    fontSize: "0.9rem",
                    color: "#555",
                    whiteSpace: "nowrap",
                  }}
                >
                  Deposit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deposit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deposit: e.target.value }))
                  }
                  style={{ ...inputStyle, width: 100, textAlign: "right" }}
                />
              </div>
              <TotalRow
                label="Balance Due"
                value={`$${balance.toFixed(2)}`}
                bold
                color={balance > 0 ? "#dc3545" : "#28a745"}
              />
            </div>
          </div>

          {/* Notes */}
          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
              placeholder="Special requirements, menu notes…"
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
              {saving ? "Saving…" : editingId ? "Update Order" : "Save Order"}
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

      {/* Filter + list */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Filter:</span>
        {["All", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid #ccc",
              cursor: "pointer",
              background: filterStatus === s ? "#007bff" : "white",
              color: filterStatus === s ? "white" : "#333",
              fontSize: "0.85rem",
            }}
          >
            {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#888", padding: 20 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#888", padding: 20 }}>No catering orders found.</p>
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
                  "Order #",
                  "Customer",
                  "Phone",
                  "Event",
                  "Event Date",
                  "Headcount",
                  "Total",
                  "Deposit",
                  "Balance",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o._id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{o.orderNumber}</td>
                  <td style={tdStyle}>
                    <div>{o.customer?.name}</div>
                    {o.customer?.email && (
                      <div style={{ fontSize: "0.78rem", color: "#777" }}>
                        {o.customer.email}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{o.customer?.phone || "—"}</td>
                  <td style={tdStyle}>{o.eventName || "—"}</td>
                  <td style={tdStyle}>
                    {o.eventDate
                      ? new Date(o.eventDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {o.headcount}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    ${(o.total || 0).toFixed(2)}
                  </td>
                  <td style={tdStyle}>${(o.deposit || 0).toFixed(2)}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color: (o.balance || 0) > 0 ? "#dc3545" : "#28a745",
                      fontWeight: 600,
                    }}
                  >
                    ${(o.balance || 0).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: STATUS_COLORS[o.status] || "#ccc",
                        color: "white",
                        fontSize: "0.8rem",
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleEdit(o)}
                      style={{
                        marginRight: 6,
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
                      onClick={() => handleDelete(o._id)}
                      style={{
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

function TotalRow({ label, value, bold, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontWeight: bold ? 700 : 400,
        color: color || "inherit",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function summaryCard(color) {
  return {
    flex: "1 1 120px",
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

export default AdminCatering;
