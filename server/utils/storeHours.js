// Working-hours helper. Determines whether a store is currently open,
// evaluating the store's configured hours in its own timezone (default EST/EDT).

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Returns { dayOfWeek: 0-6, dateStr: "YYYY-MM-DD", minutes: minutesSinceMidnight }
// for the given instant, expressed in the provided IANA timezone.
function getZonedParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const weekdayIndex = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }[map.weekday];

  // Intl may emit "24" for midnight in hour23/hour12:false — normalise to 0.
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(map.minute, 10);

  return {
    dayOfWeek: weekdayIndex,
    dateStr: `${map.year}-${map.month}-${map.day}`,
    minutes: hour * 60 + minute,
  };
}

function parseHHMM(str) {
  if (typeof str !== "string") return null;
  const [h, m] = str.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function to12h(hhmm) {
  const min = parseHHMM(hhmm);
  if (min === null) return hhmm;
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Collect the enabled time windows for a day, supporting both the
// morning/afternoon session shape and the legacy single-window shape.
function daySessions(day) {
  const sessions = [];
  const push = (label, s) => {
    if (!s || s.enabled === false) return;
    const openMin = parseHHMM(s.openTime);
    const closeMin = parseHHMM(s.closeTime);
    if (openMin === null || closeMin === null) return;
    sessions.push({ label, openMin, closeMin, openTime: s.openTime, closeTime: s.closeTime });
  };

  if (day.morning || day.afternoon) {
    push("morning", day.morning);
    push("afternoon", day.afternoon);
  } else if (day.openTime && day.closeTime) {
    // Legacy single-window day.
    push("day", { enabled: true, openTime: day.openTime, closeTime: day.closeTime });
  }
  return sessions;
}

function isWithin(nowMin, openMin, closeMin) {
  // Overnight window (e.g. 18:00 -> 02:00) wraps past midnight.
  return closeMin > openMin
    ? nowMin >= openMin && nowMin < closeMin
    : nowMin >= openMin || nowMin < closeMin;
}

// Evaluate open/closed state for a store at a given instant (defaults to now).
// Returns { open: boolean, reason: string }.
function getStoreOpenState(store, now = new Date()) {
  if (!store) return { open: true, reason: "No store configuration" };

  const timeZone = store.timezone || "America/New_York";
  let parts;
  try {
    parts = getZonedParts(now, timeZone);
  } catch (e) {
    // Bad timezone config should never block ordering.
    return { open: true, reason: "Timezone unavailable" };
  }

  // Holiday check (all-day closure).
  const holidays = Array.isArray(store.holidays) ? store.holidays : [];
  const holiday = holidays.find((h) => h && h.date === parts.dateStr);
  if (holiday) {
    return {
      open: false,
      reason: holiday.name
        ? `Closed for ${holiday.name}`
        : "Closed for a holiday",
    };
  }

  const hours = Array.isArray(store.businessHours) ? store.businessHours : [];
  const day = hours[parts.dayOfWeek];

  // If hours are not configured for this day, default to open (don't block).
  if (!day) return { open: true, reason: "Hours not configured" };

  if (!day.open) {
    return { open: false, reason: `Closed on ${DAY_NAMES[parts.dayOfWeek]}` };
  }

  const sessions = daySessions(day);
  if (sessions.length === 0) {
    // Day marked open but no valid sessions — don't block.
    return { open: true, reason: "Hours not configured" };
  }

  const nowMin = parts.minutes;
  if (sessions.some((s) => isWithin(nowMin, s.openMin, s.closeMin))) {
    return { open: true, reason: "Open" };
  }

  const summary = sessions
    .map((s) => `${to12h(s.openTime)} - ${to12h(s.closeTime)}`)
    .join(" & ");
  return {
    open: false,
    reason: `Closed. Today's hours: ${summary}`,
  };
}

module.exports = { getStoreOpenState, DAY_NAMES };
