import { today, type Project } from "./store";

// Daily nudges without a server: the reminder lives in the student's own
// calendar (Google, or any app that opens an .ics file), so it rings on their
// phone even when Unramble isn't open.

export type Reminder = { time: string; weekdays: boolean }; // time is "HH:MM", local

export const DEFAULT_REMINDER: Reminder = { time: "19:00", weekdays: true };

function shift(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export const loggedToday = (p: Project) => p.entries.some((e) => e.date === today());

// Days in a row with at least one note. Today doesn't break the streak until it's over.
export function streak(p: Project) {
  const days = new Set(p.entries.map((e) => e.date));
  let d = days.has(today()) ? today() : shift(today(), -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = shift(d, -1);
  }
  return n;
}

function event(p: Project, r: Reminder, url: string) {
  const start = `${today().replaceAll("-", "")}T${r.time.replace(":", "")}00`;
  const [h, m] = r.time.split(":").map(Number);
  const endMin = Math.min(h * 60 + m + 10, 23 * 60 + 59);
  const end = `${today().replaceAll("-", "")}T${String(Math.floor(endMin / 60)).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00`;
  return {
    title: `Unramble: log today's work (${p.name})`,
    details: `One minute: hold your Wispr key and say what you did today.\n${url}`,
    start,
    end,
    rrule: r.weekdays ? "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" : "RRULE:FREQ=DAILY",
  };
}

export function googleCalendarUrl(p: Project, r: Reminder, url: string) {
  const e = event(p, r, url);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    details: e.details,
    dates: `${e.start}/${e.end}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recur: e.rrule,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export function downloadIcs(p: Project, r: Reminder, url: string) {
  const e = event(p, r, url);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unramble//Daily log reminder//EN",
    "BEGIN:VEVENT",
    `UID:unramble-${p.id}@unramble`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${e.start}`,
    `DTEND:${e.end}`,
    e.rrule,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(e.details)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(e.title)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `unramble-reminder-${p.name.replace(/[^\w-]+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
