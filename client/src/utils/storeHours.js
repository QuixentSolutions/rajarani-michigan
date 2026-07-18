// Mirrors server/utils/storeHours.js — used only for customer-facing UX
// (showing "closed" state / disabling the order button). The backend remains
// the source of truth and re-validates on order submit.

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

export function to12h(hhmm) {
  const min = parseHHMM(hhmm);
  if (min === null) return hhmm;
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Collect enabled windows for a day (morning/afternoon sessions, with a
// legacy single-window fallback).
function daySessions(day) {
  const sessions = [];
  const push = (s) => {
    if (!s || s.enabled === false) return;
    const openMin = parseHHMM(s.openTime);
    const closeMin = parseHHMM(s.closeTime);
    if (openMin === null || closeMin === null) return;
    sessions.push({ openMin, closeMin, openTime: s.openTime, closeTime: s.closeTime });
  };

  if (day.morning || day.afternoon) {
    push(day.morning);
    push(day.afternoon);
  } else if (day.openTime && day.closeTime) {
    push({ enabled: true, openTime: day.openTime, closeTime: day.closeTime });
  }
  return sessions;
}

function isWithin(nowMin, openMin, closeMin) {
  return closeMin > openMin
    ? nowMin >= openMin && nowMin < closeMin
    : nowMin >= openMin || nowMin < closeMin;
}

// Returns { open: boolean, reason: string }.
export function getStoreOpenState(store, now = new Date()) {
  if (!store) return { open: true, reason: "" };

  const timeZone = store.timezone || "America/New_York";
  let parts;
  try {
    parts = getZonedParts(now, timeZone);
  } catch (e) {
    return { open: true, reason: "" };
  }

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
  if (!day) return { open: true, reason: "" };

  if (!day.open) {
    return { open: false, reason: `Closed on ${DAY_NAMES[parts.dayOfWeek]}` };
  }

  const sessions = daySessions(day);
  if (sessions.length === 0) return { open: true, reason: "" };

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
