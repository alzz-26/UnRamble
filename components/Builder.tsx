"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "./AppHeader";
import ReportView, { changedParts, partLabel } from "./ReportView";
import FormatPicker from "./FormatPicker";
import { EMPTY_META, type AnyReport, type Meta } from "@/lib/schema";
import { DEMO_META, DEMO_NOTES, DEMO_REPORT, DEMO_REVISION, demoRevised } from "@/lib/demoData";
import { PRESET_FORMATS, VIT_INTERNSHIP, type ReportFormat } from "@/lib/formats";
import { callApi, downloadReport, PLACEHOLDER_LOGO, readImage } from "@/lib/client";
import { createProject, now, saveProject, today, uid } from "@/lib/store";
import type { Certificate } from "@/lib/exportDocx";
import type { Report } from "@/lib/schema";

const META_FIELDS: [keyof Meta, string][] = [
  ["title", "Report title"],
  ["studentName", "Your name"],
  ["regNo", "Registration no."],
  ["organisation", "Organisation / course"],
  ["duration", "Duration / date"],
  ["guideName", "Guide / faculty"],
  ["guideDept", "Guide's school"],
  ["academicYear", "Academic year"],
  ["degree", "Degree"],
  ["branch", "Branch"],
  ["school", "School"],
  ["university", "University"],
];

const STORE_KEY = "report-builder:v1";

function load(): { notes: string; meta: Meta; format?: ReportFormat; formatId?: string } | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// The quick, no-setup page: notes in, report out. "Save as project" moves it into
// the workspace, where the log, versions and agent updates live.
export default function Builder({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta>(demo ? DEMO_META : EMPTY_META);
  const [notes, setNotes] = useState(demo ? DEMO_NOTES : "");
  const [format, setFormat] = useState<ReportFormat>(VIT_INTERNSHIP);
  const [report, setReport] = useState<AnyReport | null>(null);
  const [changed, setChanged] = useState<string[]>([]);
  const [lastChanges, setLastChanges] = useState<string[]>([]);
  const [instruction, setInstruction] = useState(demo ? DEMO_REVISION : "");
  const [busy, setBusy] = useState<"" | "generate" | "revise" | "export">("");
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(demo);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [logo, setLogo] = useState<(Certificate & { url: string }) | null>(null);
  const [reviseHeight, setReviseHeight] = useState(200);
  const previewRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  // Becomes true once saved notes have been put into state, so the first render's
  // empty values are never written over what was saved.
  const [hydrated, setHydrated] = useState(false);

  // Keep the student's notes and details between visits.
  useEffect(() => {
    if (demo) return;
    const saved = load();
    if (saved) {
      setNotes(saved.notes ?? "");
      setMeta({ ...EMPTY_META, ...saved.meta });
      const f = saved.format ?? PRESET_FORMATS.find((x) => x.id === saved.formatId);
      if (f) setFormat(f);
    }
    setHydrated(true);
  }, [demo]);

  useEffect(() => {
    if (demo || !hydrated) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ notes, meta, format }));
    } catch {
      // Storage can be blocked; the page still works without it.
    }
  }, [demo, hydrated, notes, meta, format]);

  useEffect(() => {
    if (changed.length === 0) return;
    const first = previewRef.current?.querySelector(`[data-section="${CSS.escape(changed[0])}"]`);
    first?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [changed]);

  async function generate() {
    setError("");
    setBusy("generate");
    try {
      const next = demo ? await pretend(DEMO_REPORT) : (await callApi({ mode: "generate", format, notes, meta })).report;
      setReport(next);
      setChanged([]);
      setLastChanges([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function revise() {
    if (!report) return;
    setError("");
    setBusy("revise");
    try {
      const r = demo
        ? { report: await pretend(demoRevised(report as Report)), changes: ["Shortened the conclusion to one paragraph", "Added the Redis response-time result to 2.2"] }
        : await callApi({ mode: "patch", format, report, meta, instruction });
      setChanged(changedParts(report, r.report));
      setLastChanges(r.changes);
      setReport(r.report);
      setInstruction("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function download() {
    if (!report) return;
    setBusy("export");
    try {
      await downloadReport(format, meta, report, { logo, certificate });
    } catch (e) {
      setError(`Export failed: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  }

  function saveAsProject() {
    const p = createProject(meta.title || format.name, format, meta);
    const entry = { id: uid(), date: today(), text: notes, kind: "note" as const, createdAt: now() };
    saveProject({
      ...p,
      entries: notes.trim() ? [entry] : [],
      versions: report
        ? [{ id: uid(), createdAt: now(), report, source: "generate", changes: ["Brought over from the quick report page"], coveredEntryIds: notes.trim() ? [entry.id] : [] }]
        : [],
    });
    router.push(`/projects/${p.id}`);
  }

  function stampToday() {
    const d = new Date();
    const day = d.toLocaleDateString("en-GB", { weekday: "short" });
    const date = d.toLocaleDateString("en-GB");
    setNotes((n) => `${n.trimEnd()}${n.trim() ? "\n\n" : ""}[${day} ${date}] `);
    document.getElementById("notes")?.focus();
  }

  // Drag the bar between the preview and the revision box to share the height between them.
  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    const pane = paneRef.current;
    if (!pane) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const rect = pane.getBoundingClientRect();
      setReviseHeight(clampRevise(rect.bottom - ev.clientY - 16, rect.height));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function resizeByKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.key === "ArrowUp" ? 24 : e.key === "ArrowDown" ? -24 : 0;
    if (!step) return;
    e.preventDefault();
    setReviseHeight((h) => clampRevise(h + step, paneRef.current?.getBoundingClientRect().height ?? 800));
  }

  return (
    <div className="shell">
      <AppHeader
        right={
          demo ? (
            <>
              <span className="chip chip-demo">Demo · saved example, no API call</span>
              <Link className="chip chip-link" href="/">
                ← Back to the app
              </Link>
            </>
          ) : undefined
        }
      />

      <main className="workspace">
        <section className="pane pane-notes" aria-label="Your notes">
          <div className="pane-head">
            <h2>1 · Talk</h2>
            <button className="btn-ghost" onClick={stampToday} type="button">
              + Today&apos;s date
            </button>
          </div>
          {!demo && (
            <details className="details format-details">
              <summary>Format · {format.name}</summary>
              <div className="details-body">
                <FormatPicker
                  value={format}
                  onChange={(f) => {
                    setFormat(f);
                    if (f.kind !== format.kind) setReport(null);
                  }}
                />
              </div>
            </details>
          )}
          <p className="hint">
            <kbd>Hold your Wispr key</kbd> and talk: what you did, what broke, the numbers. Out of order is fine. For a
            report you&apos;ll add to over days, <Link href="/projects">start a project</Link> instead.
          </p>
          <textarea
            id="notes"
            className="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="okay so today we set up Jenkins in a container, um, the build failed first because the Docker socket wasn't mounted…"
            spellCheck={false}
          />
          <div className="row">
            <span className="muted small">{notes.trim() ? `${notes.trim().split(/\s+/).length} words` : "No notes yet"}</span>
            <button className="btn-primary" onClick={generate} disabled={!!busy || !notes.trim()}>
              {busy === "generate" ? "Writing your report (1–2 min)…" : report ? "Regenerate report" : "Generate report"}
            </button>
          </div>

          <details className="details" open={showDetails} onToggle={(e) => setShowDetails((e.target as HTMLDetailsElement).open)}>
            <summary>
              Cover page details{demo ? " (editable: changes show on the cover)" : meta.studentName ? ` · ${meta.studentName}` : ""}
            </summary>
            <div className="fields">
              {META_FIELDS.map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input value={meta[key]} onChange={(e) => setMeta({ ...meta, [key]: e.target.value })} />
                </label>
              ))}
              {format.kind === "vit-internship" && (
                <label>
                  <span>Internship certificate (image, optional)</span>
                  <input type="file" accept="image/png,image/jpeg" onChange={async (e) => setCertificate(e.target.files?.[0] ? await readImage(e.target.files[0]) : null)} />
                </label>
              )}
              <label>
                <span>University logo (image; a placeholder is used until you add one)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={async (e) => {
                    if (logo) URL.revokeObjectURL(logo.url);
                    setLogo(e.target.files?.[0] ? await readImage(e.target.files[0]) : null);
                  }}
                />
              </label>
            </div>
          </details>
        </section>

        <section className="pane pane-report" aria-label="Report" ref={paneRef}>
          <div className="pane-head">
            <h2>2 · Read</h2>
            {report && (
              <div className="row-gap">
                {!demo && (
                  <button className="btn-ghost" onClick={saveAsProject} disabled={!!busy} title="Keep adding notes to this report over days">
                    Save as project
                  </button>
                )}
                <button className="btn-primary" onClick={download} disabled={!!busy}>
                  {busy === "export" ? "Building .docx…" : "Download Word file"}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <div className="preview-scroll" ref={previewRef}>
            {busy === "generate" && <Skeleton />}
            {!report && !busy && (
              <div className="empty">
                <p className="empty-title">Your report appears here</p>
                <p className="muted">
                  Laid out like the real document: headings, numbering, tables. Sections your notes didn&apos;t cover get a
                  marker, so you know what to add.
                </p>
              </div>
            )}
            {report && busy !== "generate" && (
              <ReportView format={format} meta={meta} report={report} changed={changed} logoSrc={logo?.url ?? PLACEHOLDER_LOGO} />
            )}
          </div>

          {report && (
            <div
              className="split-handle"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Drag to resize the preview and the revision box"
              tabIndex={0}
              onPointerDown={startResize}
              onKeyDown={resizeByKey}
              title="Drag to resize"
            >
              <span />
            </div>
          )}

          {report && (
            <div className="revise" style={{ "--revise-h": `${reviseHeight}px` } as React.CSSProperties}>
              <h2>3 · Fix it by talking</h2>
              <textarea
                className="revise-box"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Hold your Wispr key: “shorten the methodology and mention the sensor failed on day two”"
                rows={3}
              />
              <div className="row">
                <span className="muted small">
                  {lastChanges.length > 0
                    ? `${lastChanges.join(" · ")}${changed.length ? ` (${changed.map(partLabel).join(", ")})` : ""}`
                    : "The agent edits only the parts you mention."}
                  {demo && " In the demo this plays a saved revision."}
                </span>
                <button className="btn-primary" onClick={revise} disabled={!!busy || !instruction.trim()}>
                  {busy === "revise" ? "Applying…" : "Apply change"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="paper skeleton" aria-busy="true" aria-label="Writing the report">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} style={{ width: `${60 + ((i * 37) % 40)}%` }} />
      ))}
    </div>
  );
}

function clampRevise(h: number, paneHeight: number) {
  return Math.round(Math.max(140, Math.min(h, paneHeight - 220)));
}

// Demo mode: a short pause so the flow reads like the real thing.
function pretend<T>(value: T, ms = 1400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
