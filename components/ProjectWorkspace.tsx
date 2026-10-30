"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "./AppHeader";
import ConfirmButton from "./ConfirmButton";
import FormatPicker from "./FormatPicker";
import ReportView, { changedParts, partLabel } from "./ReportView";
import { callApi, downloadReport, PLACEHOLDER_LOGO, readImage } from "@/lib/client";
import type { Certificate } from "@/lib/exportDocx";
import type { Meta } from "@/lib/schema";
import {
  dayLabel,
  exportProject,
  notesText,
  now,
  pendingEntries,
  today,
  uid,
  useProject,
  type Entry,
  type Project,
  type Version,
} from "@/lib/store";

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

const SOURCE_LABEL: Record<Version["source"], string> = {
  generate: "Full report written",
  update: "Agent update",
  revise: "Voice fix",
  restore: "Restored",
};

type Tab = "talk" | "gaps" | "activity";

export default function ProjectWorkspace({ id }: { id: string }) {
  const { project, update } = useProject(id);
  const [viewing, setViewing] = useState<number | null>(null); // version index, null = latest
  const [changed, setChanged] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "agent" | "full" | "revise" | "export">("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("talk");
  const [instruction, setInstruction] = useState("");
  const [logo, setLogo] = useState<(Certificate & { url: string }) | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [panelHeight, setPanelHeight] = useState(230);
  const paneRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (changed.length === 0) return;
    previewRef.current?.querySelector(`[data-section="${CSS.escape(changed[0])}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [changed]);

  const pending = useMemo(() => (project ? pendingEntries(project) : []), [project]);

  if (project === undefined) return <div className="shell" />;
  if (project === null)
    return (
      <div className="shell">
        <AppHeader />
        <div className="pane empty-home">
          <p className="empty-title">Project not found</p>
          <p className="muted">It may have been deleted, or it was saved in a different browser.</p>
          <Link className="btn-primary" href="/projects">
            Back to my projects
          </Link>
        </div>
      </div>
    );

  const p = project;
  const latest = p.versions.at(-1) ?? null;
  const shownIndex = viewing ?? p.versions.length - 1;
  const shown = p.versions[shownIndex] ?? null;
  const isOld = shown !== null && shownIndex !== p.versions.length - 1;

  function addVersion(v: Omit<Version, "id" | "createdAt">) {
    update((cur) => ({ ...cur, versions: [...cur.versions, { ...v, id: uid(), createdAt: now() }] }));
    setViewing(null);
  }

  async function run(kind: "agent" | "full" | "revise", label: string, fn: () => Promise<void>) {
    setError("");
    setBusy(kind);
    setStatus(label);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
      setStatus("");
    }
  }

  // The agent: with no report yet it writes one from every note; after that it reads
  // only the notes the current version hasn't seen and edits just the parts they touch.
  function runAgent(cur: Project = p) {
    const fresh = pendingEntries(cur);
    const base = cur.versions.at(-1);
    const allIds = cur.entries.map((e) => e.id);
    if (!base) {
      return run("full", `Writing the report from ${cur.entries.length} notes…`, async () => {
        const r = await callApi({ mode: "generate", format: cur.format, notes: notesText(cur.entries), meta: cur.meta });
        addVersion({ report: r.report, source: "generate", changes: r.changes, coveredEntryIds: allIds });
        setChanged([]);
      });
    }
    return run("agent", `Agent is reading ${fresh.length} new note${fresh.length === 1 ? "" : "s"} and editing the report…`, async () => {
      const r = await callApi({ mode: "patch", format: cur.format, report: base.report, meta: cur.meta, newNotes: notesText(fresh) });
      addVersion({ report: r.report, source: "update", changes: r.changes, coveredEntryIds: allIds });
      setChanged(changedParts(base.report, r.report));
      setTab("activity");
    });
  }

  function regenerateAll() {
    run("full", `Rewriting the whole report from ${p.entries.length} notes…`, async () => {
      const r = await callApi({ mode: "generate", format: p.format, notes: notesText(p.entries), meta: p.meta });
      addVersion({ report: r.report, source: "generate", changes: r.changes, coveredEntryIds: p.entries.map((e) => e.id) });
      setChanged(changedParts(latest?.report ?? null, r.report));
    });
  }

  function revise() {
    if (!latest || !instruction.trim()) return;
    run("revise", "Agent is applying your change…", async () => {
      const r = await callApi({ mode: "patch", format: p.format, report: latest.report, meta: p.meta, instruction });
      addVersion({ report: r.report, source: "revise", changes: [`“${instruction.trim()}”`, ...r.changes], coveredEntryIds: latest.coveredEntryIds });
      setChanged(changedParts(latest.report, r.report));
      setInstruction("");
    });
  }

  function addEntry(date: string, text: string, kind: Entry["kind"] = "note") {
    const e: Entry = { id: uid(), date, text: text.trim(), kind, createdAt: now() };
    let next: Project = p;
    update((cur) => (next = { ...cur, entries: [...cur.entries, e] }));
    return next;
  }

  function answerGap(question: string, answer: string) {
    const next = addEntry(today(), `About “${question}”: ${answer}`, "answer");
    runAgent(next);
  }

  function restore(i: number) {
    const v = p.versions[i];
    addVersion({ report: v.report, source: "restore", changes: [`Went back to the version from ${fmtTime(v.createdAt)}`], coveredEntryIds: v.coveredEntryIds });
    setChanged(changedParts(latest?.report ?? null, v.report));
  }

  async function download() {
    if (!shown) return;
    setBusy("export");
    try {
      await downloadReport(p.format, p.meta, shown.report, { logo, certificate });
    } catch (e) {
      setError(`Export failed: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  }

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    const pane = paneRef.current;
    if (!pane) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const rect = pane.getBoundingClientRect();
      setPanelHeight(clamp(rect.bottom - ev.clientY - 16, rect.height));
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
    setPanelHeight((h) => clamp(h + step, paneRef.current?.getBoundingClientRect().height ?? 800));
  }

  const agentLabel = !latest
    ? p.entries.length
      ? `Write report from ${p.entries.length} note${p.entries.length === 1 ? "" : "s"}`
      : "Add a note to start"
    : pending.length
      ? `Update report with ${pending.length} new note${pending.length === 1 ? "" : "s"}`
      : "Report is up to date";

  return (
    <div className="shell">
      <AppHeader
        subtitle={p.format.name}
        right={
          <button className="btn-ghost" onClick={() => exportProject(p)} title="Save a backup of this project as a file">
            Export project
          </button>
        }
      />

      <div className="project-bar">
        <Link href="/projects" className="back-link">
          ← My projects
        </Link>
        <input
          className="project-name"
          value={p.name}
          onChange={(e) => update((cur) => ({ ...cur, name: e.target.value }))}
          aria-label="Project name"
        />
      </div>

      <main className="workspace">
        <section className="pane pane-notes" aria-label="Daily log">
          <div className="pane-head">
            <h2>1 · Daily log</h2>
            <span className="muted small">
              {p.entries.length} notes{pending.length > 0 && latest ? ` · ${pending.length} new` : ""}
            </span>
          </div>
          <Composer onAdd={(date, text) => addEntry(date, text)} />
          <button className="btn-primary btn-wide" onClick={() => runAgent()} disabled={!!busy || p.entries.length === 0 || (!!latest && pending.length === 0)}>
            {busy === "agent" || busy === "full" ? status : agentLabel}
          </button>
          <EntryList
            entries={p.entries}
            pendingIds={new Set(latest ? pending.map((e) => e.id) : [])}
            onEdit={(id, text) => update((cur) => ({ ...cur, entries: cur.entries.map((e) => (e.id === id ? { ...e, text } : e)) }))}
            onDelete={(id) => update((cur) => ({ ...cur, entries: cur.entries.filter((e) => e.id !== id) }))}
          />
          <details className="details">
            <summary>Report format · {p.format.name}</summary>
            <div className="details-body">
              <FormatPicker value={p.format} onChange={(f) => update((cur) => ({ ...cur, format: f }))} />
              {latest && (
                <p className="muted small">
                  After changing the format, press <b>Rewrite all</b> above the report so every section follows it.
                </p>
              )}
            </div>
          </details>
          <details className="details">
            <summary>Cover page details{p.meta.studentName ? ` · ${p.meta.studentName}` : ""}</summary>
            <div className="fields">
              {META_FIELDS.map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input value={p.meta[key]} onChange={(e) => update((cur) => ({ ...cur, meta: { ...cur.meta, [key]: e.target.value } }))} />
                </label>
              ))}
              <label>
                <span>University logo (image; a placeholder is used until you add one)</span>
                <input type="file" accept="image/png,image/jpeg" onChange={async (e) => setLogo(e.target.files?.[0] ? await readImage(e.target.files[0]) : null)} />
              </label>
              {p.format.kind === "vit-internship" && (
                <label>
                  <span>Internship certificate (image, optional)</span>
                  <input type="file" accept="image/png,image/jpeg" onChange={async (e) => setCertificate(e.target.files?.[0] ? await readImage(e.target.files[0]) : null)} />
                </label>
              )}
            </div>
          </details>
        </section>

        <section className="pane pane-report" aria-label="Report" ref={paneRef}>
          <div className="pane-head">
            <h2>2 · Report</h2>
            <div className="row-gap">
              {p.versions.length > 0 && (
                <select
                  className="version-select"
                  value={shownIndex}
                  onChange={(e) => {
                    setViewing(Number(e.target.value));
                    setChanged([]);
                  }}
                  aria-label="Version"
                >
                  {p.versions.map((v, i) => (
                    <option key={v.id} value={i}>
                      v{i + 1} · {SOURCE_LABEL[v.source]} · {fmtTime(v.createdAt)}
                      {i === p.versions.length - 1 ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              )}
              {p.entries.length > 0 && latest && (
                <button className="btn-ghost" onClick={regenerateAll} disabled={!!busy} title="Rewrite every section from all notes">
                  Rewrite all
                </button>
              )}
              {shown && (
                <button className="btn-primary" onClick={download} disabled={!!busy}>
                  {busy === "export" ? "Building .docx…" : isOld ? "Download this version" : "Download Word file"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {isOld && (
            <div className="old-banner">
              You&apos;re looking at v{shownIndex + 1}. <button onClick={() => restore(shownIndex)}>Restore it as current</button>
              <button onClick={() => setViewing(null)}>Back to current</button>
            </div>
          )}

          <div className="preview-scroll" ref={previewRef}>
            {(busy === "full" || busy === "agent") && !shown && <div className="paper skeleton" aria-busy="true" />}
            {busy && shown && <div className="agent-status">{status}</div>}
            {!shown && !busy && (
              <div className="empty">
                <p className="empty-title">No report yet</p>
                <p className="muted">
                  Add what you did today in the log, as many days as you like. Press the button under it any time to see the
                  report so far; the agent then keeps it up to date as you add more.
                </p>
              </div>
            )}
            {shown && (
              <ReportView
                format={p.format}
                meta={p.meta}
                report={shown.report}
                changed={isOld ? [] : changed}
                logoSrc={logo?.url ?? PLACEHOLDER_LOGO}
              />
            )}
          </div>

          {shown && (
            <>
              <div
                className="split-handle"
                role="separator"
                aria-orientation="horizontal"
                aria-label="Drag to resize the preview and the panel below"
                tabIndex={0}
                onPointerDown={startResize}
                onKeyDown={resizeByKey}
                title="Drag to resize"
              >
                <span />
              </div>
              <div className="bottom-panel" style={{ "--revise-h": `${panelHeight}px` } as React.CSSProperties}>
                <div className="tabs" role="tablist">
                  {(
                    [
                      ["talk", "Fix it by talking"],
                      ["gaps", `Fill gaps (${shown.report.gaps.length})`],
                      ["activity", `Activity (${p.versions.length})`],
                    ] as [Tab, string][]
                  ).map(([t, label]) => (
                    <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? " tab-on" : ""}`} onClick={() => setTab(t)}>
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "talk" && (
                  <div className="tab-body">
                    <textarea
                      className="revise-box"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="Hold your Wispr key: “shorten the methodology and mention the sensor failed on day two”"
                    />
                    <div className="row">
                      <span className="muted small">The agent edits only the parts you mention, and saves a new version.</span>
                      <button className="btn-primary" onClick={revise} disabled={!!busy || !instruction.trim() || isOld}>
                        {busy === "revise" ? "Applying…" : "Apply change"}
                      </button>
                    </div>
                  </div>
                )}

                {tab === "gaps" && (
                  <div className="tab-body scroll">
                    {shown.report.gaps.length === 0 ? (
                      <p className="muted">No gaps. The agent has everything it asked for.</p>
                    ) : (
                      shown.report.gaps.map((g, i) => (
                        <GapQuestion key={`${shownIndex}-${i}`} section={g.section} question={g.whatToSay} disabled={!!busy || isOld} onAnswer={(a) => answerGap(g.whatToSay, a)} />
                      ))
                    )}
                  </div>
                )}

                {tab === "activity" && (
                  <ol className="tab-body scroll activity" reversed>
                    {[...p.versions].reverse().map((v, ri) => {
                      const i = p.versions.length - 1 - ri;
                      return (
                        <li key={v.id} className={i === shownIndex ? "act-on" : ""}>
                          <div className="act-head">
                            <b>
                              v{i + 1} · {SOURCE_LABEL[v.source]}
                            </b>
                            <span className="muted small">{fmtTime(v.createdAt)}</span>
                            {i !== shownIndex && (
                              <button className="link-btn" onClick={() => { setViewing(i === p.versions.length - 1 ? null : i); setChanged([]); }}>
                                View
                              </button>
                            )}
                          </div>
                          <ul>
                            {v.changes.map((c, ci) => (
                              <li key={ci}>{c}</li>
                            ))}
                            {i > 0 &&
                              changedParts(p.versions[i - 1].report, v.report).length > 0 && (
                                <li className="muted">Sections touched: {changedParts(p.versions[i - 1].report, v.report).map(partLabel).join(", ")}</li>
                              )}
                          </ul>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Composer({ onAdd }: { onAdd: (date: string, text: string) => void }) {
  const [date, setDate] = useState(today());
  const [text, setText] = useState("");
  return (
    <div className="composer">
      <div className="mic-head">
        <MicIcon />
        <div>
          <p className="mic-title">Today&apos;s log</p>
          <p className="mic-sub">hold Wispr key · talk · release</p>
        </div>
      </div>
      <textarea
        id="notes"
        className="notes notes-short"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="okay so today we set up Jenkins in a container, um, the build failed first because the Docker socket wasn't mounted…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim()) {
            onAdd(date, text);
            setText("");
          }
        }}
      />
      <div className="row">
        <label className="date-field">
          <span className="muted small">Day</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} />
        </label>
        <button
          className="btn-secondary"
          disabled={!text.trim()}
          onClick={() => {
            onAdd(date, text);
            setText("");
          }}
        >
          Add to log
        </button>
      </div>
    </div>
  );
}

function EntryList({
  entries,
  pendingIds,
  onEdit,
  onDelete,
}: {
  entries: Entry[];
  pendingIds: Set<string>;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))) {
      m.set(e.date, [...(m.get(e.date) ?? []), e]);
    }
    return [...m.entries()];
  }, [entries]);

  if (entries.length === 0) return <p className="muted small log-empty">Your notes will appear here, one day at a time.</p>;

  return (
    <div className="log">
      {byDay.map(([date, list]) => (
        <div key={date} className="log-day">
          <div className="log-date">{dayLabel(date)}</div>
          {list.map((e) => (
            <div key={e.id} className={`log-entry${pendingIds.has(e.id) ? " log-new" : ""}`}>
              {pendingIds.has(e.id) && <span className="pill">new</span>}
              {e.kind === "answer" && <span className="pill pill-soft">gap answer</span>}
              {editing === e.id ? (
                <>
                  <textarea className="notes notes-edit" value={draft} onChange={(ev) => setDraft(ev.target.value)} />
                  <div className="row-gap">
                    <button className="btn-secondary" onClick={() => { onEdit(e.id, draft); setEditing(null); }}>
                      Save
                    </button>
                    <button className="link-btn" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>{e.text}</p>
                  <div className="log-actions">
                    <button className="link-btn" onClick={() => { setEditing(e.id); setDraft(e.text); }}>
                      Edit
                    </button>
                    <ConfirmButton className="link-btn" question="Delete this note?" onConfirm={() => onDelete(e.id)} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GapQuestion({ section, question, disabled, onAnswer }: { section: string; question: string; disabled: boolean; onAnswer: (a: string) => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="gap-q">
      <p>
        <span className="gap-label">{section}</span> {question}
      </p>
      <div className="gap-q-row">
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Hold your Wispr key and answer…" rows={2} />
        <button className="btn-secondary" disabled={disabled || !answer.trim()} onClick={() => onAnswer(answer)}>
          Answer
        </button>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <span className="mic-badge" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    </span>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function clamp(h: number, paneHeight: number) {
  return Math.round(Math.max(150, Math.min(h, paneHeight - 220)));
}
