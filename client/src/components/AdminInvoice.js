import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "./AdminInvoice.css";

const EXPENSE_CATEGORIES = [
  "Ingredients",
  "Utilities",
  "Staff",
  "Equipment",
  "Rent",
  "Marketing",
  "Maintenance",
  "Other",
];

// ─── Expense Tracker ───────────────────────────────────────────────────────────
function ExpenseTab({ storeSlug }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [filterCategory, setFilterCategory] = useState("All");
  const [saving, setSaving] = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeSlug}/expense?limit=200`);
      const data = await res.json();
      setExpenses(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.amount || isNaN(parseFloat(form.amount)))
      return;
    setSaving(true);
    try {
      await fetch(`/stores/${storeSlug}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      setForm((f) => ({ ...f, name: "", amount: "" }));
      await loadExpenses();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`/stores/${storeSlug}/expense/${id}`, { method: "DELETE" });
    await loadExpenses();
  };

  const filtered =
    filterCategory === "All"
      ? expenses
      : expenses.filter((e) => e.category === filterCategory);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="expense-tab">
      <div className="exp-form">
        <h3 className="exp-form-title">Add Expense</h3>
        <div className="exp-form-row">
          <div className="exp-field">
            <label>Name</label>
            <input
              placeholder="e.g. Vegetable supply"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="exp-field">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="exp-field">
            <label>Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </div>
          <div className="exp-field">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <button
            className="inv-btn-primary exp-add-btn"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? "…" : "Add"}
          </button>
        </div>
      </div>

      <div className="exp-summary">
        <div className="exp-summary-card exp-summary-total">
          <span>Total Expenses</span>
          <strong>${totalAll.toFixed(2)}</strong>
        </div>
        {byCategory.map(({ cat, total }) => (
          <div key={cat} className="exp-summary-card">
            <span>{cat}</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        ))}
      </div>

      <div className="exp-list-header">
        <span className="exp-list-title">
          Expenses{filterCategory !== "All" ? ` — ${filterCategory}` : ""}
          {filtered.length > 0 && (
            <span className="exp-list-total">
              {" "}
              (${totalFiltered.toFixed(2)})
            </span>
          )}
        </span>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="exp-filter-select"
        >
          <option>All</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="exp-empty">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="exp-empty">No expenses recorded yet.</p>
      ) : (
        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id}>
                  <td>{e.name}</td>
                  <td>
                    <span className="exp-badge">{e.category}</span>
                  </td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ${e.amount.toFixed(2)}
                  </td>
                  <td>
                    <button
                      className="exp-delete-btn"
                      onClick={() => handleDelete(e._id)}
                    >
                      ×
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
}

// ─── Root component ────────────────────────────────────────────────────────────
const AdminInvoice = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);

  return (
    <div className="section-card">
      <div className="section-header"></div>
      <ExpenseTab storeSlug={storeSlug} />
    </div>
  );
};

export default AdminInvoice;
