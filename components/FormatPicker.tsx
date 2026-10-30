"use client";

import { useState } from "react";
import { formatFromDocx, formatFromText } from "@/lib/client";
import { PRESET_FORMATS, type ReportFormat, type SectionsFormat } from "@/lib/formats";

const isCustom = (f: ReportFormat): f is SectionsFormat => f.kind === "sections" && f.id.startsWith("custom");

// Pick a preset format, or build your own from a sample: upload a past .docx, or
// paste a sample / list of headings. A custom format's headings stay editable.
export default function FormatPicker({ value, onChange }: { value: ReportFormat; onChange: (f: ReportFormat) => void }) {
  const [custom, setCustom] = useState<SectionsFormat | null>(isCustom(value) ? value : null);
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");

  async function read(kind: "file" | "text", file?: File) {
    setError("");
    setReading(kind === "file" ? "Reading your report…" : "Reading your sample…");
    try {
      const f = kind === "file" && file ? await formatFromDocx(file) : await formatFromText(pasted);
      setCustom(f);
      onChange(f);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReading("");
    }
  }

  function edit(next: SectionsFormat) {
    setCustom(next);
    onChange(next);
  }

  const options: ReportFormat[] = [...PRESET_FORMATS, ...(custom ? [custom] : [])];

  return (
    <div className="format-picker">
      <div className="formats" role="radiogroup" aria-label="Report format">
        {options.map((f) => (
          <label key={f.id} className={`format-option${value.id === f.id ? " selected" : ""}`}>
            <input type="radio" name="format" checked={value.id === f.id} onChange={() => onChange(f)} />
            <span>
              <b>{f.name}</b>
              <span className="muted small">
                {isCustom(f) ? `Your format · ${f.sections.map((s) => s.heading).join(" · ")}` : f.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {isCustom(value) && <FormatEditor format={value} onChange={edit} />}

      {!open ? (
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
          + {custom ? "Replace my format with another sample" : "Create my own format from a sample"}
        </button>
      ) : (
        <div className="custom-panel">
          <div className="pane-head">
            <b>Create a format from a sample</b>
            <button type="button" className="link-btn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <label className="format-option format-upload">
            <span>
              <b>Upload a report you already submitted (.docx)</b>
              <span className="muted small">Its headings become the sections; its font and margins become the page setup.</span>
            </span>
            <input type="file" accept=".docx" disabled={!!reading} onChange={(e) => e.target.files?.[0] && read("file", e.target.files[0])} />
          </label>
          <div className="or">or</div>
          <label className="field">
            <span>Paste a sample, or just list the headings your department wants</span>
            <textarea
              className="notes paste-box"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={"e.g.\nAim\nApparatus\nTheory\nProcedure\nObservation table\nCalculations\nResult\nPrecautions\n\n…or paste a whole sample report copied from a PDF."}
            />
          </label>
          <button type="button" className="btn-primary" disabled={!!reading || !pasted.trim()} onClick={() => read("text")}>
            {reading || "Read the format"}
          </button>
          {reading && !pasted && <p className="muted small">{reading}</p>}
          {error && <div className="error">{error}</div>}
          <p className="muted small">Reading a sample uses the AI once (about 20–40 seconds). You can edit the headings afterwards.</p>
        </div>
      )}
    </div>
  );
}

function FormatEditor({ format, onChange }: { format: SectionsFormat; onChange: (f: SectionsFormat) => void }) {
  const set = (i: number, part: "heading" | "guidance", v: string) =>
    onChange({ ...format, sections: format.sections.map((s, j) => (j === i ? { ...s, [part]: v } : s)) });
  const move = (i: number, d: -1 | 1) => {
    const s = [...format.sections];
    const j = i + d;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    onChange({ ...format, sections: s });
  };
  return (
    <div className="format-editor">
      <label className="field">
        <span>Format name</span>
        <input value={format.name} onChange={(e) => onChange({ ...format, name: e.target.value })} />
      </label>
      <span className="muted small">
        Sections, in order. Page: {format.page.font}, {format.page.bodySize / 2} pt, left margin {(format.page.margin.left / 1440).toFixed(2)}&quot;
      </span>
      <ol className="section-list">
        {format.sections.map((s, i) => (
          <li key={i}>
            <input className="sec-heading" value={s.heading} onChange={(e) => set(i, "heading", e.target.value)} aria-label="Heading" />
            <input className="sec-guidance" value={s.guidance} onChange={(e) => set(i, "guidance", e.target.value)} aria-label="What goes here" placeholder="What goes in this section" />
            <span className="sec-actions">
              <button type="button" className="link-btn" onClick={() => move(i, -1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" className="link-btn" onClick={() => move(i, 1)} aria-label="Move down">
                ↓
              </button>
              <button
                type="button"
                className="link-btn"
                onClick={() => onChange({ ...format, sections: format.sections.filter((_, j) => j !== i) })}
                aria-label="Remove section"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="link-btn"
        onClick={() => onChange({ ...format, sections: [...format.sections, { heading: "New section", guidance: "" }] })}
      >
        + Add a section
      </button>
    </div>
  );
}

