import { FORMAT, TEMPLATE_NAME, TEMPLATE_SPEC } from "./template";

// A report format: either the full college internship layout (its own rich schema and
// exporter), or a list of headings that the general "sections" engine fills in.

export type PageSetup = {
  font: string;
  bodySize: number; // half-points
  margin: { top: number; right: number; bottom: number; left: number }; // twips
};

export type SectionsFormat = {
  kind: "sections";
  id: string;
  name: string;
  description: string;
  sections: { heading: string; guidance: string }[];
  style: string;
  page: PageSetup;
};

export type InternshipFormat = { kind: "internship"; id: "internship-report"; name: string; description: string };

export type ReportFormat = InternshipFormat | SectionsFormat;

const DEFAULT_PAGE: PageSetup = { font: FORMAT.font, bodySize: FORMAT.bodySize, margin: FORMAT.margin };

export const INTERNSHIP_REPORT: InternshipFormat = {
  kind: "internship",
  id: "internship-report",
  name: TEMPLATE_NAME,
  description: "Cover, certificate, executive summary, weekly overview tables, chapters 1–4. Taken from a submitted report.",
};

// Projects saved before the internship format was renamed still carry its old kind.
export function upgradeFormat(f: ReportFormat | { kind: string }): ReportFormat {
  return f.kind === "sections" || f.kind === "internship" ? (f as ReportFormat) : INTERNSHIP_REPORT;
}

export const LAB_REPORT: SectionsFormat = {
  kind: "sections",
  id: "lab-report",
  name: "Lab experiment record",
  description: "Aim, software, theory, procedure, observations, result. One experiment per report.",
  sections: [
    { heading: "Aim", guidance: "One or two sentences: what the experiment sets out to do." },
    { heading: "Software and Hardware Required", guidance: "Tools, versions and machines as a list." },
    { heading: "Theory", guidance: "The concept behind the experiment, in 1–3 short paragraphs." },
    { heading: "Procedure", guidance: "Numbered steps in the order they were done, including commands." },
    { heading: "Observations", guidance: "What happened, with readings or outputs; use a table for repeated measurements." },
    { heading: "Result", guidance: "One paragraph: what was achieved, with the key output." },
    { heading: "Conclusion", guidance: "What was learnt and any limitation." },
  ],
  style: "Formal, past tense, third person. Short paragraphs. Commands and outputs exactly as the student said them.",
  page: DEFAULT_PAGE,
};

export const PROGRESS_REPORT: SectionsFormat = {
  kind: "sections",
  id: "progress-report",
  name: "Project progress report",
  description: "Weekly or fortnightly capstone update: work done, results, challenges, next steps.",
  sections: [
    { heading: "Summary", guidance: "Three or four sentences: where the project stands this period." },
    { heading: "Work Completed", guidance: "What was built or done, grouped by component; dates where given." },
    { heading: "Results and Evidence", guidance: "Measurements, screenshots mentioned, test results; a table if several." },
    { heading: "Challenges and Resolutions", guidance: "A table: challenge | how it was handled (or 'open')." },
    { heading: "Plan for Next Period", guidance: "Numbered list of next tasks, with owners or dates if given." },
  ],
  style: "Formal, concise, past tense for work done and future tense for the plan.",
  page: DEFAULT_PAGE,
};

export const PRESET_FORMATS: ReportFormat[] = [INTERNSHIP_REPORT, LAB_REPORT, PROGRESS_REPORT];

export function sectionsSpec(f: SectionsFormat): string {
  return `FORMAT: ${f.name}.
Sections, in this order (use these headings exactly):
${f.sections.map((s, i) => `${i + 1}. ${s.heading} — ${s.guidance}`).join("\n")}

Style: ${f.style}
Each section has paragraphs (with an optional bold run-in lead), an optional numbered list ("items") and an optional table. Leave a section's parts empty when the notes have nothing for it.`;
}

export function formatSpec(f: ReportFormat): string {
  return f.kind === "sections" ? sectionsSpec(f) : TEMPLATE_SPEC;
}

export function newFormatId() {
  return `custom-${Math.random().toString(36).slice(2, 8)}`;
}

export { DEFAULT_PAGE };
