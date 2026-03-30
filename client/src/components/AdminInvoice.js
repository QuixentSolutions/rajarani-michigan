import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "./AdminInvoice.css";

const EXPENSE_CATEGORIES = [
  "Ingredients", "Utilities", "Staff", "Equipment",
  "Rent", "Marketing", "Maintenance", "Other",
];

// ─── Shared bar chart (CSS only) ──────────────────────────────────────────────
function BarChart({ data, valueKey = "total", labelKey = "label", color = "#007bff" }) {
  if (!data || data.length === 0) {
    return <p className="exp-empty">No data available for this period.</p>;
  }
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="bar-chart">
      {data.map((row, i) => {
        const pct = ((row[valueKey] || 0) / max) * 100;
        return (
          <div key={i} className="bar-row">
            <span className="bar-label">{row[labelKey]}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, background: color }}
                title={`$${(row[valueKey] || 0).toFixed(2)}`}
              />
            </div>
            <span className="bar-value">${(row[valueKey] || 0).toFixed(2)}</span>
            <span className="bar-count">{row.count} {row.count === 1 ? "entry" : "entries"}</span>
          </div>
        );
      })}
    </div>
  );
}

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
      const res = await fetch(`/stores/${storeSlug}/expense?limit=200`);
      const data = await res.json();
      setExpenses(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.amount || isNaN(parseFloat(form.amount))) return;
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

  const filtered = filterCategory === "All" ? expenses : expenses.filter((e) => e.category === filterCategory);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="expense-tab">
      <div className="exp-form">
        <h3 className="exp-form-title">Add Expense</h3>
        <div className="exp-form-row">
          <div className="exp-field">
            <label>Name</label>
            <input placeholder="e.g. Vegetable supply" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="exp-field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="exp-field">
            <label>Amount ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="exp-field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <button className="inv-btn-primary exp-add-btn" onClick={handleAdd} disabled={saving}>
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
          {filtered.length > 0 && <span className="exp-list-total"> (${totalFiltered.toFixed(2)})</span>}
        </span>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="exp-filter-select">
          <option>All</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
                <th>Name</th><th>Category</th><th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th><th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id}>
                  <td>{e.name}</td>
                  <td><span className="exp-badge">{e.category}</span></td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>${e.amount.toFixed(2)}</td>
                  <td><button className="exp-delete-btn" onClick={() => handleDelete(e._id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reports ───────────────────────────────────────────────────────────────────
function ReportsTab({ storeSlug }) {
  const [period, setPeriod] = useState("monthly");
  const [invoiceData, setInvoiceData] = useState([]);
  const [cateringData, setCateringData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, catRes, expRes] = await Promise.all([
        fetch(`/stores/${storeSlug}/invoice/reports/${period}`),
        fetch(`/stores/${storeSlug}/catering/reports/${period}`),
        fetch(`/stores/${storeSlug}/expense/reports/${period}`),
      ]);
      const [inv, cat, exp] = await Promise.all([invRes.json(), catRes.json(), expRes.json()]);
      setInvoiceData(Array.isArray(inv) ? inv : []);
      setCateringData(Array.isArray(cat) ? cat : []);
      setExpenseData(Array.isArray(exp) ? exp : []);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, period]);

  useEffect(() => { load(); }, [load]);

  // Build unified period labels across all datasets
  const allLabels = [
    ...new Set([
      ...invoiceData.map((r) => r.label),
      ...cateringData.map((r) => r.label),
      ...expenseData.map((r) => r.label),
    ]),
  ].sort();

  const getVal = (dataset, label) =>
    (dataset.find((r) => r.label === label) || {}).total || 0;

  const totalInvoice = invoiceData.reduce((s, r) => s + (r.total || 0), 0);
  const totalCatering = cateringData.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpense = expenseData.reduce((s, r) => s + (r.total || 0), 0);
  const totalRevenue = totalInvoice + totalCatering;
  const netProfit = totalRevenue - totalExpense;

  // Merge for bar chart (revenue per period)
  const revenueChartData = allLabels.map((label) => ({
    label,
    total: getVal(invoiceData, label) + getVal(cateringData, label),
    count: (invoiceData.find((r) => r.label === label)?.count || 0) +
           (cateringData.find((r) => r.label === label)?.count || 0),
  }));

  const expenseChartData = expenseData.map((r) => ({ ...r }));

  const allExpCategories = [
    ...new Set(expenseData.flatMap((r) => Object.keys(r.byCategory || {}))),
  ];

  return (
    <div className="reports-tab">
      {/* Controls */}
      <div className="report-controls">
        <div className="report-toggle-group">
          {["weekly", "monthly"].map((p) => (
            <button
              key={p}
              className={`report-toggle-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
        <button className="inv-btn-secondary" onClick={load} style={{ marginLeft: "auto" }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="exp-empty">Loading report…</p>
      ) : (
        <>
          {/* ── P&L Summary ── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <SummaryCard label="Invoice Revenue (Orders)" value={totalInvoice} color="#28a745" />
            <SummaryCard label="Catering Revenue" value={totalCatering} color="#17a2b8" />
            <SummaryCard label="Total Revenue" value={totalRevenue} color="#007bff" />
            <SummaryCard label="Total Expenses" value={totalExpense} color="#dc3545" />
            <SummaryCard
              label="Net Profit / Loss"
              value={netProfit}
              color={netProfit >= 0 ? "#28a745" : "#dc3545"}
            />
          </div>

          {/* ── Revenue chart ── */}
          <div className="report-section">
            <h4 className="report-section-title">
              Total Revenue by {period === "weekly" ? "Week" : "Month"}
              <span style={{ fontSize: "0.82rem", fontWeight: 400, marginLeft: 8, color: "#666" }}>
                (Invoices + Catering)
              </span>
            </h4>
            {revenueChartData.length === 0 ? (
              <p className="exp-empty">No revenue data.</p>
            ) : (
              <BarChart data={revenueChartData} valueKey="total" labelKey="label" color="#007bff" />
            )}
          </div>

          {/* ── Revenue breakdown table ── */}
          {allLabels.length > 0 && (
            <div className="report-section">
              <h4 className="report-section-title">Revenue Breakdown</h4>
              <div className="exp-table-wrap">
                <table className="exp-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th style={{ textAlign: "right" }}>Invoice Revenue</th>
                      <th style={{ textAlign: "right" }}>Catering Revenue</th>
                      <th style={{ textAlign: "right" }}>Total Revenue</th>
                      <th style={{ textAlign: "right" }}>Expenses</th>
                      <th style={{ textAlign: "right" }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLabels.map((label) => {
                      const inv = getVal(invoiceData, label);
                      const cat = getVal(cateringData, label);
                      const exp = getVal(expenseData, label);
                      const rev = inv + cat;
                      const net = rev - exp;
                      return (
                        <tr key={label}>
                          <td>{label}</td>
                          <td style={{ textAlign: "right" }}>${inv.toFixed(2)}</td>
                          <td style={{ textAlign: "right" }}>${cat.toFixed(2)}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>${rev.toFixed(2)}</td>
                          <td style={{ textAlign: "right", color: "#dc3545" }}>${exp.toFixed(2)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: net >= 0 ? "#28a745" : "#dc3545" }}>
                            {net >= 0 ? "+" : ""}${net.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>${totalInvoice.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>${totalCatering.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>${totalRevenue.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#dc3545" }}>${totalExpense.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: netProfit >= 0 ? "#28a745" : "#dc3545" }}>
                        {netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Expense chart ── */}
          <div className="report-section">
            <h4 className="report-section-title">
              Expenses by {period === "weekly" ? "Week" : "Month"}
            </h4>
            {expenseChartData.length === 0 ? (
              <p className="exp-empty">No expense data.</p>
            ) : (
              <BarChart data={expenseChartData} valueKey="total" labelKey="label" color="#dc3545" />
            )}
          </div>

          {/* ── Expense category breakdown ── */}
          {allExpCategories.length > 0 && (
            <div className="report-section">
              <h4 className="report-section-title">Expense Breakdown by Category</h4>
              <div className="exp-table-wrap">
                <table className="exp-table report-breakdown-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      {allExpCategories.map((c) => (
                        <th key={c} style={{ textAlign: "right" }}>{c}</th>
                      ))}
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseData.map((row, i) => (
                      <tr key={i}>
                        <td>{row.label}</td>
                        {allExpCategories.map((c) => (
                          <td key={c} style={{ textAlign: "right" }}>
                            {row.byCategory?.[c] ? `$${row.byCategory[c].toFixed(2)}` : "—"}
                          </td>
                        ))}
                        <td style={{ textAlign: "right", fontWeight: 700 }}>${(row.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      {allExpCategories.map((c) => (
                        <td key={c} style={{ textAlign: "right", fontWeight: 700 }}>
                          ${expenseData.reduce((s, r) => s + (r.byCategory?.[c] || 0), 0).toFixed(2)}
                        </td>
                      ))}
                      <td style={{ textAlign: "right", fontWeight: 700 }}>${totalExpense.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      flex: "1 1 140px",
      background: color,
      color: "white",
      borderRadius: 8,
      padding: "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>{label}</span>
      <strong style={{ fontSize: "1.15rem" }}>${value.toFixed(2)}</strong>
    </div>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────
const AdminInvoice = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);
  const [activeTab, setActiveTab] = useState("expenses");

  return (
    <div className="section-card">
      <div className="section-header">
        <h2 className="section-title">Expense Tracker</h2>
      </div>

      <div className="inv-sub-tabs">
        {[
          { key: "expenses", label: "Expense Tracker" },
          { key: "reports", label: "Reports" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`inv-sub-tab ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "expenses" && <ExpenseTab storeSlug={storeSlug} />}
      {activeTab === "reports" && <ReportsTab storeSlug={storeSlug} />}
    </div>
  );
};

export default AdminInvoice;
