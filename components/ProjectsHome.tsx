"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppHeader from "./AppHeader";
import ConfirmButton from "./ConfirmButton";
import FormatPicker from "./FormatPicker";
import { PRESET_FORMATS, type ReportFormat } from "@/lib/formats";
import { loggedToday, streak } from "@/lib/reminder";
import { createSampleProject, ensureDefaultSample, isSample } from "@/lib/sample";
import { EMPTY_META, type Meta } from "@/lib/schema";
import {
  createProject,
  deleteProject,
  exportProject,
  importProject,
  loadProfile,
  now,
  pendingEntries,
  saveProfile,
  saveProject,
  today,
  uid,
  useProjects,
  type Project,
} from "@/lib/store";

export default function ProjectsHome() {
  const projects = useProjects();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => ensureDefaultSample(), []);

  function openForm() {
    setCreating(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function onImport(file: File | undefined) {
    if (!file) return;
    try {
      const p = importProject(await file.text());
      router.push(`/projects/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="shell">
      <AppHeader subtitle="One place for every report you owe: daily notes in, finished report out." />

      <section className="home-head">
        <div>
          <h2 className="home-title">My projects</h2>
          <p className="muted">
            One project per report: an internship, a lab course, a capstone. Each keeps its own format, a dated log of
            your notes and every version of the report.
          </p>
        </div>
        <div className="row-gap">
          <button className="btn-primary" onClick={openForm}>
            + New project
          </button>
          <button className="btn-ghost" onClick={() => importRef.current?.click()} title="Open a project file you exported earlier">

            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => onImport(e.target.files?.[0])}
          />
        </div>
      </section>

      {error && <div className="error">{error}</div>}
      {creating && (
        <div ref={formRef}>
          <NewProject onCancel={() => setCreating(false)} onCreated={(p) => router.push(`/projects/${p.id}`)} />
        </div>
      )}

      {projects !== null && (
        <div className="cards">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
          {!creating && (
            <button className="card card-add" onClick={openForm}>
              <span>+ New project</span>
              <span className="muted small">Name it, pick or create a format, add your details and today&apos;s first note</span>
            </button>
          )}
        </div>
      )}

      <p className="muted small privacy-note">
        Projects are saved in this browser only. Use Export to back one up or move it to another device. Accounts and
        sync are on the roadmap.
        {projects !== null && !projects.some(isSample) && (
          <>
            {" "}
            <button className="link-btn" onClick={() => createSampleProject()}>
              Restore the sample project
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const pending = pendingEntries(p).length;
  const days = new Set(p.entries.map((e) => e.date)).size;
  return (
    <article className="card">
      <Link href={`/projects/${p.id}`} className="card-main">
        <h3>
          {p.name} {isSample(p) && <span className="pill pill-soft">Sample</span>}
        </h3>
        <p className="muted small">{p.format.name}</p>
        <div className="card-stats">
          <span>
            <b>{p.entries.length}</b> notes · {days} day{days === 1 ? "" : "s"}
          </span>
          <span>
            <b>{p.versions.length}</b> version{p.versions.length === 1 ? "" : "s"}
          </span>
          {pending > 0 && p.versions.length > 0 && <span className="pill">{pending} new</span>}
          {!isSample(p) && (loggedToday(p) ? <span className="pill">Logged today · {streak(p)}-day streak</span> : <span className="pill pill-warn">Not logged today</span>)}
        </div>
        <p className="muted small">Updated {new Date(p.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
      </Link>
      <div className="card-actions">
        <button className="btn-ghost" onClick={() => exportProject(p)}>
          Export
        </button>
        <ConfirmButton question="Delete this project and all its notes?" onConfirm={() => deleteProject(p.id)} />
      </div>
    </article>
  );
}

const MAIN_FIELDS: [keyof Meta, string, string][] = [
  ["title", "Report title (on the cover)", "e.g. DevOps, Agile & Design Thinking"],
  ["studentName", "Your name", "e.g. Alisha Basa"],
  ["regNo", "Registration no.", "e.g. 23BCE10XXX"],
  ["organisation", "Organisation / course", "e.g. XYZ Technologies Pvt. Ltd."],
  ["duration", "Duration / date", "e.g. 20th May, 2025 to 10th July, 2025"],
  ["guideName", "Guide / faculty", "e.g. Dr. PQR"],
];
const MORE_FIELDS: [keyof Meta, string][] = [
  ["guideDept", "Guide's school"],
  ["academicYear", "Academic year"],
  ["degree", "Degree"],
  ["branch", "Branch"],
  ["school", "School"],
  ["university", "University"],
];

function NewProject({ onCancel, onCreated }: { onCancel: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<ReportFormat>(PRESET_FORMATS[0]);
  const [meta, setMeta] = useState<Meta>(EMPTY_META);
  const [note, setNote] = useState("");
  const [noteDate, setNoteDate] = useState(today());

  // Prefill the personal details used last time.
  useEffect(() => setMeta((m) => ({ ...m, ...loadProfile() })), []);

  function create() {
    const finalMeta = { ...meta, title: meta.title || name };
    saveProfile(finalMeta);
    const p = createProject(name || meta.title, format, finalMeta);
    const withNote = note.trim()
      ? saveProject({ ...p, entries: [{ id: uid(), date: noteDate, text: note.trim(), kind: "note", createdAt: now() }] })
      : p;
    onCreated(withNote);
  }

  const field = ([key, label, placeholder]: [keyof Meta, string, string?]) => (
    <label key={key}>
      <span>{label}</span>
      <input value={meta[key]} placeholder={placeholder} onChange={(e) => setMeta({ ...meta, [key]: e.target.value })} />
    </label>
  );

  return (
    <section className="pane new-project">
      <div className="pane-head">
        <h2>New project</h2>
        <button className="link-btn" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="np-step">
        <span className="np-num">1</span>
        <label className="field">
          <span>Project name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DevOps internship report" />
        </label>
      </div>

      <div className="np-step">
        <span className="np-num">2</span>
        <div className="field">
          <span>Report format: pick one, or create your own from a sample</span>
          <FormatPicker
            value={format}
            onChange={(f) => {
              setFormat(f);
              if (!name && f.id.startsWith("custom")) setName(f.name);
            }}
          />
        </div>
      </div>

      <div className="np-step">
        <span className="np-num">3</span>
        <div className="field">
          <span>Cover page details (your name, registration no. and university are remembered for next time)</span>
          <div className="fields">{MAIN_FIELDS.map(field)}</div>
          <details className="details">
            <summary>More details: degree, branch, school, university, year</summary>
            <div className="fields">{MORE_FIELDS.map(([k, l]) => field([k, l]))}</div>
          </details>
        </div>
      </div>

      <div className="np-step">
        <span className="np-num">4</span>
        <div className="field">
          <span>First note (optional): hold your Wispr key and say what you did</span>
          <textarea
            className="notes notes-short"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="okay so on day one we set up the Ubuntu VM and Git, and the trainer showed…"
          />
          <label className="date-field">
            <span className="muted small">Day</span>
            <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value || today())} />
          </label>
        </div>
      </div>

      <div className="row-gap">
        <button className="btn-primary" onClick={create} disabled={!name.trim() && !meta.title.trim()}>
          Create project
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
