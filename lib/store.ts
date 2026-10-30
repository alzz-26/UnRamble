"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportFormat } from "./formats";
import { EMPTY_META, type AnyReport, type Meta } from "./schema";

// Projects live in this browser for now. Everything goes through this module, so
// swapping it for an account-backed database later doesn't touch the pages.

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD: the day the work happened
  text: string;
  kind: "note" | "answer";
  createdAt: string;
};

export type Version = {
  id: string;
  createdAt: string;
  report: AnyReport;
  source: "generate" | "update" | "revise" | "restore";
  changes: string[];
  coveredEntryIds: string[];
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  format: ReportFormat;
  meta: Meta;
  entries: Entry[];
  versions: Version[]; // oldest first; the last one is current
  sample?: boolean; // the ready-made example project
};

// Storage keys keep the app's original name so projects saved before the rename still load.
const KEY = "report-builder:projects:v1";
const MAX_VERSIONS = 30;
const EVENT = "report-builder:projects-changed";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const now = () => new Date().toISOString();
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function readAll(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function writeAll(projects: Project[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
  } catch (e) {
    // Most likely the browser's storage quota: drop the oldest versions and retry once.
    const trimmed = projects.map((p) => ({ ...p, versions: p.versions.slice(-5) }));
    localStorage.setItem(KEY, JSON.stringify(trimmed));
    console.warn("Storage was full; kept the last 5 versions of each project.", e);
  }
  window.dispatchEvent(new Event(EVENT));
}

export const listProjects = readAll;

// Personal details (name, registration number, university…) carry over to the
// next project, so they are typed once.
const PROFILE_KEY = "report-builder:profile:v1";
const PROFILE_FIELDS = ["studentName", "regNo", "degree", "branch", "school", "university", "academicYear", "guideName", "guideDept"] as const;

export function loadProfile(): Partial<Meta> {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveProfile(meta: Meta) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(Object.fromEntries(PROFILE_FIELDS.map((k) => [k, meta[k]]))));
  } catch {
    // Not critical: the details just won't be prefilled next time.
  }
}

export function createProject(name: string, format: ReportFormat, meta: Partial<Meta> = {}): Project {
  const p: Project = {
    id: uid(),
    name: name.trim() || "Untitled project",
    createdAt: now(),
    updatedAt: now(),
    format,
    meta: { ...EMPTY_META, ...meta },
    entries: [],
    versions: [],
  };
  writeAll([p, ...readAll()]);
  return p;
}

export function saveProject(p: Project) {
  const next = { ...p, updatedAt: now(), versions: p.versions.slice(-MAX_VERSIONS) };
  writeAll(readAll().map((x) => (x.id === p.id ? next : x)));
  return next;
}

export function deleteProject(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function importProject(json: string): Project {
  const p = JSON.parse(json) as Project;
  if (!p || !Array.isArray(p.entries) || !p.format) throw new Error("That file isn't an Unramble project.");
  const copy = { ...p, id: uid(), updatedAt: now() };
  writeAll([copy, ...readAll()]);
  return copy;
}

export function exportProject(p: Project) {
  const blob = new Blob([JSON.stringify(p, null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${p.name.replace(/[^\w-]+/g, "_")}.unramble.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Entries that the current version has not seen yet.
export function pendingEntries(p: Project): Entry[] {
  const covered = new Set(p.versions.at(-1)?.coveredEntryIds ?? []);
  return p.entries.filter((e) => !covered.has(e.id));
}

export function notesText(entries: Entry[]): string {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((e) => `[${dayLabel(e.date)}]${e.kind === "answer" ? " (answer to a question about a gap)" : ""} ${e.text}`)
    .join("\n\n");
}

export function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${dt.toLocaleDateString("en-GB", { weekday: "short" })} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

// React hooks. They re-read storage whenever any page in this tab changes it.
export function useProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    const refresh = () => setProjects(readAll());
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return projects;
}

export function useProject(id: string) {
  const projects = useProjects();
  const project = projects === null ? undefined : (projects.find((p) => p.id === id) ?? null);
  const update = useCallback((fn: (p: Project) => Project) => {
    const current = readAll().find((p) => p.id === id);
    if (current) saveProject(fn(current));
  }, [id]);
  return { project, update };
}
