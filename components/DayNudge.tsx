"use client";

import { useState } from "react";
import { DEFAULT_REMINDER, downloadIcs, googleCalendarUrl, loggedToday, streak, type Reminder } from "@/lib/reminder";
import type { Project } from "@/lib/store";

// Above the composer: did you log today, how long is the streak, and a one-tap
// daily reminder that goes into the student's own calendar.
export default function DayNudge({ project, onSave }: { project: Project; onSave: (r: Reminder) => void }) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState<Reminder>(project.reminder ?? DEFAULT_REMINDER);
  const done = loggedToday(project);
  const days = streak(project);
  const url = typeof window === "undefined" ? "" : window.location.href;

  return (
    <div className={`nudge${done ? " nudge-done" : ""}`}>
      <div className="nudge-row">
        <span className="nudge-dot" aria-hidden="true" />
        <span className="nudge-text">
          {done ? "Logged today" : "Nothing logged today yet"}
          {days > 0 && <span className="nudge-streak"> · {days}-day streak</span>}
        </span>
        <button className="link-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
          {project.reminder ? `Reminder ${fmt(project.reminder)}` : "Remind me daily"}
        </button>
      </div>
      {open && (
        <div className="nudge-panel">
          <div className="nudge-fields">
            <label className="date-field">
              <span className="muted small">At</span>
              <input type="time" value={r.time} onChange={(e) => setR({ ...r, time: e.target.value || DEFAULT_REMINDER.time })} />
            </label>
            <label className="nudge-check">
              <input type="checkbox" checked={r.weekdays} onChange={(e) => setR({ ...r, weekdays: e.target.checked })} />
              <span className="small">Weekdays only</span>
            </label>
          </div>
          <div className="row-gap">
            <a
              className="btn-secondary"
              href={googleCalendarUrl(project, r, url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSave(r)}
            >
              Add to Google Calendar
            </a>
            <button
              className="btn-ghost"
              onClick={() => {
                downloadIcs(project, r, url);
                onSave(r);
              }}
            >
              Apple / Outlook (.ics)
            </button>
          </div>
          <p className="muted small nudge-note">
            It rings on your phone like any calendar event and opens this project, so logging takes a minute while you still
            remember the day.
          </p>
        </div>
      )}
    </div>
  );
}

function fmt(r: Reminder) {
  return `${r.time}${r.weekdays ? " · weekdays" : " · daily"}`;
}
