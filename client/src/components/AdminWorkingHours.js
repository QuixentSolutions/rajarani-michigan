import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { DAY_NAMES, getStoreOpenState } from "../utils/storeHours";

const makeSession = (openTime, closeTime) => ({
  enabled: true,
  openTime,
  closeTime,
});

const makeDay = () => ({
  open: true,
  morning: makeSession("11:30", "15:00"),
  afternoon: makeSession("17:00", "21:30"),
});

// Default weekly schedule used for new stores / when none is saved yet.
//   Sun 11:30-3, 5-9 | Mon closed | Tue-Thu 11:30-3, 5-9:30 | Fri-Sat 11:30-3, 5-10
const openDay = (dinnerClose) => ({
  open: true,
  morning: makeSession("11:30", "15:00"),
  afternoon: makeSession("17:00", dinnerClose),
});

const defaultBusinessHours = () => [
  openDay("21:00"), // Sunday
  {
    open: false,
    morning: { enabled: false, openTime: "11:30", closeTime: "15:00" },
    afternoon: { enabled: false, openTime: "17:00", closeTime: "21:30" },
  }, // Monday closed
  openDay("21:30"), // Tuesday
  openDay("21:30"), // Wednesday
  openDay("21:30"), // Thursday
  openDay("22:00"), // Friday
  openDay("22:00"), // Saturday
];

// Normalise a day coming from the API into the morning/afternoon shape,
// migrating any legacy single-window day.
const normaliseDay = (d) => {
  if (!d) return makeDay();
  const base = makeDay();
  if (d.morning || d.afternoon) {
    return {
      open: d.open !== false,
      morning: { ...base.morning, ...(d.morning || { enabled: false }) },
      afternoon: { ...base.afternoon, ...(d.afternoon || { enabled: false }) },
    };
  }
  // Legacy { open, openTime, closeTime } -> morning session.
  if (d.openTime && d.closeTime) {
    return {
      open: d.open !== false,
      morning: makeSession(d.openTime, d.closeTime),
      afternoon: { ...base.afternoon, enabled: false },
    };
  }
  return { ...base, open: d.open !== false };
};

const SESSIONS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
];

const AdminWorkingHours = () => {
  const storeSlug = useSelector((state) => state.store.selectedStore?.slug);

  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [holidays, setHolidays] = useState([]);
  const [timezone, setTimezone] = useState("America/New_York");
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStore = useCallback(async () => {
    if (!storeSlug) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stores/${storeSlug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load store");

      const bh =
        Array.isArray(data.businessHours) && data.businessHours.length === 7
          ? data.businessHours.map(normaliseDay)
          : defaultBusinessHours();
      setBusinessHours(bh);
      setHolidays(Array.isArray(data.holidays) ? data.holidays : []);
      setTimezone(data.timezone || "America/New_York");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const setDayOpen = (index, open) => {
    setBusinessHours((prev) =>
      prev.map((d, i) => (i === index ? { ...d, open } : d)),
    );
  };

  const setSessionField = (index, sessionKey, field, value) => {
    setBusinessHours((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, [sessionKey]: { ...d[sessionKey], [field]: value } }
          : d,
      ),
    );
  };

  const addHoliday = () => {
    if (!newHoliday.date) {
      setError("Please pick a holiday date.");
      return;
    }
    if (holidays.some((h) => h.date === newHoliday.date)) {
      setError("That date is already added.");
      return;
    }
    setError("");
    setHolidays((prev) =>
      [...prev, { date: newHoliday.date, name: newHoliday.name.trim() }].sort(
        (a, b) => a.date.localeCompare(b.date),
      ),
    );
    setNewHoliday({ date: "", name: "" });
  };

  const removeHoliday = (date) => {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  };

  const save = async () => {
    if (!window.confirm("Save working hours for this store?")) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/stores/${storeSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessHours, holidays, timezone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSuccess("Working hours saved successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="section-card">
        <div style={{ padding: "2rem" }}>Loading working hours…</div>
      </div>
    );
  }

  const openState = getStoreOpenState({ businessHours, holidays, timezone });

  const inputStyle = {
    padding: "6px 10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const renderSession = (dayIndex, day, sessionKey, label) => {
    const s = day[sessionKey] || {};
    const disabled = !day.open || !s.enabled;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: day.open ? "pointer" : "not-allowed",
            minWidth: 110,
            opacity: day.open ? 1 : 0.5,
          }}
        >
          <input
            type="checkbox"
            checked={!!s.enabled}
            disabled={!day.open}
            onChange={(e) =>
              setSessionField(dayIndex, sessionKey, "enabled", e.target.checked)
            }
          />
          {label}
        </label>
        <input
          type="time"
          value={s.openTime || ""}
          disabled={disabled}
          onChange={(e) =>
            setSessionField(dayIndex, sessionKey, "openTime", e.target.value)
          }
          style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
        />
        <span style={{ color: "#999" }}>to</span>
        <input
          type="time"
          value={s.closeTime || ""}
          disabled={disabled}
          onChange={(e) =>
            setSessionField(dayIndex, sessionKey, "closeTime", e.target.value)
          }
          style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
        />
      </div>
    );
  };

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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 20,
            background: openState.open ? "#e6f7ec" : "#fdecea",
            color: openState.open ? "#1e7e34" : "#c0392b",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: openState.open ? "#28a745" : "#e74c3c",
            }}
          />
          {openState.open
            ? "Currently OPEN"
            : `Currently CLOSED — ${openState.reason}`}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            backgroundColor: saving ? "#8bbcf7" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save Working Hours"}
        </button>
      </div>

      <div className="table-container" style={{ padding: "2rem" }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            {success}
          </div>
        )}

        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Online orders (pickup &amp; delivery) can only be placed while the
          store is open. Each day has a separate <strong>morning</strong> and{" "}
          <strong>afternoon</strong> session, so you can close in between. Times
          are in Eastern Time (<strong>{timezone}</strong>).
        </p>

        {/* Weekly hours */}
        <h3 style={{ marginBottom: "1rem", color: "#333" }}>Weekly Hours</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {businessHours.map((day, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: "14px 16px",
                background: day.open ? "#fff" : "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: day.open ? 12 : 0,
                }}
              >
                <strong style={{ fontSize: 15 }}>{DAY_NAMES[i]}</strong>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!day.open}
                    onChange={(e) => setDayOpen(i, e.target.checked)}
                  />
                  {day.open ? "Open this day" : "Closed all day"}
                </label>
              </div>
              {day.open && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {SESSIONS.map((sess) => (
                    <div key={sess.key}>
                      {renderSession(i, day, sess.key, sess.label)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Holidays */}
        <h3 style={{ margin: "2rem 0 1rem", color: "#333" }}>Holidays</h3>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          The store is closed all day on these dates and will not accept online
          orders.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) =>
              setNewHoliday((p) => ({ ...p, date: e.target.value }))
            }
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Holiday name (e.g. Thanksgiving)"
            value={newHoliday.name}
            onChange={(e) =>
              setNewHoliday((p) => ({ ...p, name: e.target.value }))
            }
            style={{ ...inputStyle, minWidth: 240 }}
          />
          <button
            onClick={addHoliday}
            style={{
              padding: "7px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Add Holiday
          </button>
        </div>

        {holidays.length === 0 ? (
          <p style={{ color: "#999" }}>No holidays configured.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Date</th>
                <th style={{ padding: "10px" }}>Name</th>
                <th style={{ padding: "10px", width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.date} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{h.date}</td>
                  <td style={{ padding: "10px" }}>{h.name || "—"}</td>
                  <td style={{ padding: "10px" }}>
                    <button
                      onClick={() => removeHoliday(h.date)}
                      style={{
                        padding: "5px 12px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminWorkingHours;
