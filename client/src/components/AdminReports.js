import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return `$${(n || 0).toFixed(2)}`;
}

function mergeLabels(...datasets) {
  return [...new Set(datasets.flatMap((d) => d.map((r) => r.label)))].sort();
}

function getVal(dataset, label, key = "total") {
  return (dataset.find((r) => r.label === label) || {})[key] || 0;
}

// ── Summary card ─────────────────────────────────────────────────────────────

function SCard({ label, value, color, sub }) {
  return (
    <div style={{
      flex: "1 1 150px", background: color, color: "#fff",
      borderRadius: 10, padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 3,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <span style={{ fontSize: "0.75rem", opacity: 0.88 }}>{label}</span>
      <strong style={{ fontSize: "1.2rem" }}>{fmt(value)}</strong>
      {sub && <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>{sub}</span>}
    </div>
  );
}

// ── Bar chart (CSS-only) ─────────────────────────────────────────────────────

function BarChart({ data, valueKey = "total", labelKey = "label", color = "#007bff" }) {
  if (!data || data.length === 0)
    return <p style={{ color: "#999", padding: "12px 0" }}>No data for this period.</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((row, i) => {
        const pct = ((row[valueKey] || 0) / max) * 100;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem" }}>
            <span style={{ width: 120, flexShrink: 0, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row[labelKey]}
            </span>
            <div style={{ flex: 1, background: "#e9ecef", borderRadius: 4, height: 18 }}>
              <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: "100%", transition: "width 0.4s" }} />
            </div>
            <span style={{ width: 80, textAlign: "right", fontWeight: 600, color: "#333" }}>
              {fmt(row[valueKey])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h4 style={{
        fontSize: "0.95rem", fontWeight: 700, color: "#333",
        borderBottom: "2px solid #e9ecef", paddingBottom: 8, marginBottom: 16,
      }}>{title}</h4>
      {children}
    </div>
  );
}

// ── Responsive table ─────────────────────────────────────────────────────────

function RTable({ head, rows, foot }) {
  const thStyle = { background: "#f8f9fa", padding: "8px 12px", fontWeight: 700, fontSize: "0.8rem", color: "#444", whiteSpace: "nowrap", borderBottom: "2px solid #dee2e6" };
  const tdStyle = { padding: "7px 12px", fontSize: "0.82rem", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
  const tfStyle = { padding: "8px 12px", fontSize: "0.82rem", fontWeight: 700, background: "#f8f9fa", borderTop: "2px solid #dee2e6" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ ...thStyle, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              {row.map((cell, j) => <td key={j} style={{ ...tdStyle, textAlign: j > 0 ? "right" : "left" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
        {foot && <tfoot><tr>{foot.map((f, i) => <td key={i} style={{ ...tfStyle, textAlign: i > 0 ? "right" : "left" }}>{f}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

// ── Period toggle ────────────────────────────────────────────────────────────

function PeriodToggle({ period, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {["daily", "weekly", "monthly"].map((p) => (
        <button key={p} onClick={() => onChange(p)} style={{
          padding: "6px 16px", borderRadius: 20, border: "1px solid #ccc", cursor: "pointer",
          fontSize: "0.82rem", fontWeight: 600,
          background: period === p ? "#343a40" : "#fff",
          color: period === p ? "#fff" : "#333",
        }}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ── Main AdminReports component ───────────────────────────────────────────────

const AdminReports = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(false);

  // datasets
  const [onlineOrders, setOnlineOrders] = useState([]);   // invoice
  const [catering, setCatering] = useState([]);
  const [dineInSales, setDineInSales] = useState([]);     // manual-sales type=dinein
  const [partnerSales, setPartnerSales] = useState([]);   // delivery-partner-sales
  const [expenses, setExpenses] = useState([]);

  const load = useCallback(async () => {
    if (!storeSlug) return;
    setLoading(true);
    try {
      const [invRes, catRes, dineRes, partRes, expRes] = await Promise.all([
        fetch(`/stores/${storeSlug}/invoice/reports/${period}`),
        fetch(`/stores/${storeSlug}/catering/reports/${period}`),
        fetch(`/stores/${storeSlug}/manual-sales/reports/${period}?type=dinein`),
        fetch(`/stores/${storeSlug}/delivery-partner-sales/reports/${period}`),
        fetch(`/stores/${storeSlug}/expense/reports/${period}`),
      ]);
      const [inv, cat, dine, part, exp] = await Promise.all([
        invRes.json(), catRes.json(), dineRes.json(), partRes.json(), expRes.json(),
      ]);
      setOnlineOrders(Array.isArray(inv) ? inv : []);
      setCatering(Array.isArray(cat) ? cat : []);
      setDineInSales(Array.isArray(dine) ? dine : []);
      setPartnerSales(Array.isArray(part) ? part : []);
      setExpenses(Array.isArray(exp) ? exp : []);
    } catch (e) {
      console.error("Reports load error", e);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, period]);

  useEffect(() => { load(); }, [load]);

  // ── Computed totals ────────────────────────────────────────────────────────

  const totOnlineOrders  = onlineOrders.reduce((s, r) => s + (r.total || 0), 0);
  const totCatering      = catering.reduce((s, r) => s + (r.total || 0), 0);
  const totDineInCash    = dineInSales.reduce((s, r) => s + (r.cash || 0), 0);
  const totDineInCard    = dineInSales.reduce((s, r) => s + (r.cardGross || 0), 0);
  const totDineIn        = totDineInCash + totDineInCard;
  const totPartnerGross  = partnerSales.reduce((s, r) => s + (r.gross || 0), 0);
  const totPartnerComm   = partnerSales.reduce((s, r) => s + (r.commission || 0), 0);
  const totPartnerNet    = partnerSales.reduce((s, r) => s + (r.net || 0), 0);
  const totExpenses      = expenses.reduce((s, r) => s + (r.total || 0), 0);
  const totRevenue       = totOnlineOrders + totCatering + totDineIn + totPartnerNet;
  const netProfit        = totRevenue - totExpenses;

  // ── Unified label set ──────────────────────────────────────────────────────
  const allLabels = mergeLabels(onlineOrders, catering, dineInSales, partnerSales, expenses);

  const periodLabel = period === "daily" ? "Day" : period === "weekly" ? "Week" : "Month";

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <PeriodToggle period={period} onChange={setPeriod} />
        <button onClick={load} disabled={loading} style={{
          marginLeft: "auto", padding: "6px 18px", borderRadius: 6,
          border: "1px solid #ccc", background: "#fff", cursor: "pointer",
          fontSize: "0.82rem", fontWeight: 600,
        }}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#999", padding: 24, textAlign: "center" }}>Loading reports…</p>
      ) : (
        <>
          {/* ── P&L Summary Cards ── */}
          <Section title="Overall Summary">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <SCard label="Online Orders (Invoice)" value={totOnlineOrders} color="#28a745" />
              <SCard label="Catering Revenue" value={totCatering} color="#17a2b8" />
              <SCard label="Dine-In Sales" value={totDineIn} sub={`Cash: ${fmt(totDineInCash)} / Card: ${fmt(totDineInCard)}`} color="#6f42c1" />
              <SCard label="Online Partner Sales (Net)" value={totPartnerNet} sub={`Gross: ${fmt(totPartnerGross)} − Commission: ${fmt(totPartnerComm)}`} color="#fd7e14" />
              <SCard label="Total Revenue" value={totRevenue} color="#007bff" />
              <SCard label="Total Expenses" value={totExpenses} color="#dc3545" />
              <SCard label="Net Profit / Loss" value={netProfit} color={netProfit >= 0 ? "#155724" : "#721c24"} />
            </div>
          </Section>

          {/* ── Consolidated P&L Table ── */}
          {allLabels.length > 0 && (
            <Section title={`Consolidated P&L by ${periodLabel}`}>
              <RTable
                head={["Period", "Online Orders", "Catering", "Dine-In", "Partner (Net)", "Total Revenue", "Expenses", "Net"]}
                rows={allLabels.map((label) => {
                  const inv  = getVal(onlineOrders, label);
                  const cat  = getVal(catering, label);
                  const dine = getVal(dineInSales, label, "cash") + getVal(dineInSales, label, "cardGross");
                  const part = getVal(partnerSales, label, "net");
                  const exp  = getVal(expenses, label);
                  const rev  = inv + cat + dine + part;
                  const net  = rev - exp;
                  return [
                    label,
                    fmt(inv),
                    fmt(cat),
                    fmt(dine),
                    fmt(part),
                    <strong>{fmt(rev)}</strong>,
                    <span style={{ color: "#dc3545" }}>{fmt(exp)}</span>,
                    <strong style={{ color: net >= 0 ? "#28a745" : "#dc3545" }}>{net >= 0 ? "+" : ""}{fmt(net)}</strong>,
                  ];
                })}
                foot={[
                  "Total",
                  fmt(totOnlineOrders),
                  fmt(totCatering),
                  fmt(totDineIn),
                  fmt(totPartnerNet),
                  fmt(totRevenue),
                  fmt(totExpenses),
                  <span style={{ color: netProfit >= 0 ? "#28a745" : "#dc3545" }}>{netProfit >= 0 ? "+" : ""}{fmt(netProfit)}</span>,
                ]}
              />
            </Section>
          )}

          {/* ── Online Orders ── */}
          <Section title={`Online Orders by ${periodLabel}`}>
            <BarChart data={onlineOrders} color="#28a745" />
          </Section>

          {/* ── Catering ── */}
          <Section title={`Catering Revenue by ${periodLabel}`}>
            <BarChart data={catering} color="#17a2b8" />
          </Section>

          {/* ── Dine-In Sales ── */}
          <Section title={`Dine-In Sales by ${periodLabel}`}>
            <BarChart data={dineInSales.map((r) => ({ ...r, total: (r.cash || 0) + (r.cardGross || 0) }))} color="#6f42c1" />
            {dineInSales.length > 0 && (
              <RTable
                head={["Period", "Cash", "Card (Gross)", "Card (Net)", "Total"]}
                rows={dineInSales.map((r) => [
                  r.label,
                  fmt(r.cash),
                  fmt(r.cardGross),
                  fmt(r.cardNet),
                  <strong>{fmt((r.cash || 0) + (r.cardGross || 0))}</strong>,
                ])}
                foot={["Total", fmt(totDineInCash), fmt(totDineInCard), fmt(dineInSales.reduce((s, r) => s + (r.cardNet || 0), 0)), fmt(totDineIn)]}
              />
            )}
          </Section>

          {/* ── Online Partner Sales ── */}
          <Section title={`Online Partner Sales by ${periodLabel}`}>
            <BarChart data={partnerSales.map((r) => ({ ...r, total: r.gross || 0 }))} color="#fd7e14" />
            {partnerSales.length > 0 && (
              <RTable
                head={["Period", "Gross", "Commission", "Net Received"]}
                rows={partnerSales.map((r) => [
                  r.label,
                  fmt(r.gross),
                  <span style={{ color: "#dc3545" }}>{fmt(r.commission)}</span>,
                  <strong style={{ color: "#28a745" }}>{fmt(r.net)}</strong>,
                ])}
                foot={["Total", fmt(totPartnerGross), fmt(totPartnerComm), fmt(totPartnerNet)]}
              />
            )}
          </Section>

          {/* ── Expenses ── */}
          <Section title={`Expenses by ${periodLabel}`}>
            <BarChart data={expenses} color="#dc3545" />
            {expenses.length > 0 && (() => {
              const cats = [...new Set(expenses.flatMap((r) => Object.keys(r.byCategory || {})))];
              if (cats.length === 0) return null;
              return (
                <div style={{ marginTop: 16 }}>
                  <RTable
                    head={["Period", ...cats, "Total"]}
                    rows={expenses.map((r) => [
                      r.label,
                      ...cats.map((c) => r.byCategory?.[c] ? fmt(r.byCategory[c]) : "—"),
                      <strong>{fmt(r.total)}</strong>,
                    ])}
                    foot={[
                      "Total",
                      ...cats.map((c) => fmt(expenses.reduce((s, r) => s + (r.byCategory?.[c] || 0), 0))),
                      fmt(totExpenses),
                    ]}
                  />
                </div>
              );
            })()}
          </Section>
        </>
      )}
    </div>
  );
};

export default AdminReports;
