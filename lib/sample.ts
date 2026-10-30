"use client";

import { DEMO_META, DEMO_NOTES, DEMO_REPORT } from "./demoData";
import { INTERNSHIP_REPORT } from "./formats";
import { createProject, listProjects, now, saveProject, uid, type Entry, type Project } from "./store";

const SEEDED_KEY = "report-builder:sample-seeded";
export const isSample = (p: Project) => !!p.sample || p.name.startsWith("Sample ·");

// The first visit to My projects gets one sample project. It's added only once:
// if the student deletes it, it stays deleted (they can restore it from the page).
export function ensureDefaultSample() {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return;
    if (!listProjects().some(isSample)) createSampleProject();
    localStorage.setItem(SEEDED_KEY, "1");
  } catch {
    // Storage blocked: the page still works, just without the sample.
  }
}

// A ready-made project for first-time visitors and judges: three weeks of daily
// notes already turned into a report, plus one new note waiting for the agent.
export function createSampleProject() {
  const p = createProject("Sample · Full Stack internship", INTERNSHIP_REPORT, DEMO_META);
  const [week1, week2, week3, wrap] = DEMO_NOTES.split(/\n\n+/);
  const entry = (date: string, text: string): Entry => ({ id: uid(), date, text, kind: "note", createdAt: now() });
  const covered = [
    entry("2026-05-23", week1),
    entry("2026-05-30", week2),
    entry("2026-06-05", week3),
    entry("2026-06-05", wrap),
  ];
  const pending = entry(
    "2026-06-10",
    "okay so update, I got the certificate on 10th June, and the final evaluation was 46 out of 50, the mentor said the code review fixes and the k6 test were the best part.",
  );
  return saveProject({
    ...p,
    sample: true,
    entries: [...covered, pending],
    versions: [
      {
        id: uid(),
        createdAt: now(),
        report: DEMO_REPORT,
        source: "generate",
        changes: ["Wrote the full report from all notes"],
        coveredEntryIds: covered.map((e) => e.id),
      },
    ],
  });
}
