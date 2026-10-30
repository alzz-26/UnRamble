import { z } from "zod";

// The report travels as structured data, section by section, so a revision can
// change one section and leave the rest alone, and empty sections can be flagged.

const Para = z.object({
  lead: z.string().describe('Bold run-in lead ending with a full stop, e.g. "Goal." — or "" for a plain paragraph'),
  text: z.string(),
});

const Table = z.object({
  caption: z.string().describe('Caption text without the "Table N:" prefix'),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const Day = z.object({
  date: z.string().describe("DD/MM/YYYY"),
  day: z.string().describe("Mon, Tue, Wed, Thu, Fri, Sat or Sun"),
  topic: z.string(),
  lab: z.string().describe('Practical session that day as a short phrase, or ""'),
});

const Week = z.object({
  days: z.array(Day),
  summary: z.string(),
});

const Subsection = z.object({
  title: z.string().describe('Without the number, e.g. "Lab Sessions"'),
  paragraphs: z.array(Para),
  table: Table.nullable(),
  code: z.string().describe('A short listing (Jenkinsfile stages, commands) or ""'),
  codeCaption: z.string().describe('Caption for the listing, or ""'),
});

export const ReportSchema = z.object({
  acknowledgement: z.array(z.string()),
  executiveSummary: z.object({
    company: z.string(),
    problem: z.string(),
    methodology: z.string(),
    findings: z.string(),
    benefits: z.string(),
  }),
  learningObjectives: z.array(z.string()),
  weeks: z.array(Week),
  introduction: z.object({
    paragraphs: z.array(Para),
    glanceTable: Table.nullable(),
  }),
  discussion: z.array(Subsection),
  conclusion: z.array(z.string()),
  bibliography: z.array(z.string()),
  gaps: z
    .array(z.object({ section: z.string(), whatToSay: z.string() }))
    .describe("Sections the notes did not give enough material for, and what the student should say to fill them"),
  vivaQuestions: z.array(z.string()).describe("6 to 8 questions an examiner is likely to ask about this report"),
});

export type Report = z.infer<typeof ReportSchema>;
export type ReportPara = z.infer<typeof Para>;
export type ReportTable = z.infer<typeof Table>;

// Details for the cover and certificate pages. Typed once by the student, not generated.
export type Meta = {
  title: string;
  studentName: string;
  regNo: string;
  degree: string;
  branch: string;
  school: string;
  university: string;
  academicYear: string;
  organisation: string;
  duration: string;
  guideName: string;
  guideDept: string;
};

export const EMPTY_META: Meta = {
  title: "",
  studentName: "",
  regNo: "",
  degree: "BACHELOR OF TECHNOLOGY",
  branch: "COMPUTER SCIENCE AND ENGINEERING",
  school: "SCHOOL OF COMPUTING SCIENCE AND ENGINEERING",
  university: "VIT BHOPAL UNIVERSITY",
  academicYear: "2026 – 2027",
  organisation: "",
  duration: "",
  guideName: "",
  guideDept: "SCOPE",
};

// The sections a revision can touch, in document order, for change highlighting.
export const SECTION_KEYS = [
  "acknowledgement",
  "executiveSummary",
  "learningObjectives",
  "weeks",
  "introduction",
  "discussion",
  "conclusion",
  "bibliography",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export function changedSections(before: Report | null, after: Report): SectionKey[] {
  if (!before) return [];
  return SECTION_KEYS.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}

// ---------------------------------------------------------------------------
// General "sections" reports: lab reports, progress reports and custom formats.
// The format lists the headings; each section holds paragraphs, a list and a table.

const Section = z.object({
  heading: z.string().describe("Exactly one of the headings the format lists"),
  paragraphs: z.array(Para),
  items: z.array(z.string()).describe("A numbered list for this section (steps, objectives, references), or []"),
  table: Table.nullable(),
});

const Gap = z.object({ section: z.string(), whatToSay: z.string() });

export const SectionsReportSchema = z.object({
  sections: z.array(Section),
  gaps: z.array(Gap).describe("Sections the notes did not give enough material for, and what the student should say to fill them"),
  vivaQuestions: z.array(z.string()).describe("6 to 8 questions an examiner is likely to ask about this report"),
});
export type SectionsReport = z.infer<typeof SectionsReportSchema>;
export type ReportSection = z.infer<typeof Section>;

// ---------------------------------------------------------------------------
// Agent edits: the model returns only what changed. null means "leave as it is".

const changes = z
  .array(z.string())
  .describe('One short line per edit, past tense, e.g. "Added Thu 04/06 to Week 3" or "Closed gap: marks"');

export const ReportPatchSchema = z.object({
  acknowledgement: ReportSchema.shape.acknowledgement.nullable(),
  executiveSummary: ReportSchema.shape.executiveSummary.nullable(),
  learningObjectives: ReportSchema.shape.learningObjectives.nullable(),
  weeks: ReportSchema.shape.weeks.nullable(),
  introduction: ReportSchema.shape.introduction.nullable(),
  discussion: ReportSchema.shape.discussion.nullable(),
  conclusion: ReportSchema.shape.conclusion.nullable(),
  bibliography: ReportSchema.shape.bibliography.nullable(),
  gaps: ReportSchema.shape.gaps.nullable().describe("The full, updated gap list, or null if unchanged"),
  vivaQuestions: ReportSchema.shape.vivaQuestions.nullable(),
  changes,
});
export type ReportPatch = z.infer<typeof ReportPatchSchema>;

export const SectionsPatchSchema = z.object({
  sections: z.array(Section).describe("Only the sections that changed, each complete; matched to the report by heading"),
  gaps: z.array(Gap).nullable().describe("The full, updated gap list, or null if unchanged"),
  vivaQuestions: z.array(z.string()).nullable(),
  changes,
});
export type SectionsPatch = z.infer<typeof SectionsPatchSchema>;

export type AnyReport = Report | SectionsReport;
export const isSectionsReport = (r: AnyReport): r is SectionsReport => "sections" in r;

// Apply an agent's edits. Pure, so it runs the same on the server and in the browser.
export function applyReportPatch(r: Report, p: ReportPatch): Report {
  const next = { ...r };
  for (const k of [...SECTION_KEYS, "gaps", "vivaQuestions"] as const) {
    const v = p[k];
    if (v !== null && v !== undefined) (next as Record<string, unknown>)[k] = v;
  }
  return next;
}

export function applySectionsPatch(r: SectionsReport, p: SectionsPatch, order: string[]): SectionsReport {
  const byHeading = new Map(r.sections.map((s) => [s.heading.toLowerCase(), s]));
  for (const s of p.sections) byHeading.set(s.heading.toLowerCase(), s);
  const known = order.map((h) => byHeading.get(h.toLowerCase())).filter((s): s is ReportSection => !!s);
  const extra = [...byHeading.values()].filter((s) => !order.some((h) => h.toLowerCase() === s.heading.toLowerCase()));
  return {
    sections: [...known, ...extra],
    gaps: p.gaps ?? r.gaps,
    vivaQuestions: p.vivaQuestions ?? r.vivaQuestions,
  };
}
