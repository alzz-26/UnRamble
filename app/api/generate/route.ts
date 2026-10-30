import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import {
  applyReportPatch,
  applySectionsPatch,
  ReportPatchSchema,
  ReportSchema,
  SectionsPatchSchema,
  SectionsReportSchema,
  type AnyReport,
  type Meta,
  type Report,
  type SectionsReport,
} from "@/lib/schema";
import { formatSpec, type ReportFormat } from "@/lib/formats";

// Generation can take a minute; give the function room on Vercel.
export const maxDuration = 300;

// Free-tier Gemini models, tried in order: if the first is over its quota or
// unavailable, the next one takes the request.
const MODELS = (process.env.GEMINI_MODEL || "gemini-flash-latest,gemini-3.8-flash,gemini-3.6-flash,gemini-flash-lite-latest")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const RULES = `Rules that matter more than polish:
- Never invent facts. Names, dates, marks, scores, versions, ports, URLs, results and numbers come only from the notes or the student's details. If something is missing, leave that part empty rather than guessing, and add an entry to "gaps" saying which section is thin and what the student should say to fill it.
- Bibliography or references: cite only sources the notes mention, plus the official documentation of tools the notes name (e.g. "React documentation, https://react.dev") and the student's own repository. Never cite a book, paper or author the student did not mention; if they mention none, add a gap asking which books or course material they used.
- Weekly overview (when the format has one): fill "lab" only when the notes say there was a lab or hands-on exercise that day; otherwise leave it "". Do not pad days with activities the notes don't describe.
- Executive summary fields (when the format has them) hold only the paragraph text; the bold leads are added by the exporter. List items must not start with their own numbers.
- The notes are dictated, so they are out of order, repeat themselves and contain filler ("um", "so basically", corrections like "no wait, it was port 8081"). Use the corrected version and drop the filler.
- Put every fact in the section where the format says it belongs, even if it was said in passing.
- Write in the format's formal style; keep the student's technical detail.
- vivaQuestions: questions an examiner would ask about this specific work, not generic ones.`;

const system = (format: ReportFormat) =>
  `You turn a student's spoken, rambling notes into a college report in their department's exact format, and keep that report up to date as they add notes.\n\n${formatSpec(format)}\n\n${RULES}`;

const jsonSchema = (s: z.ZodType) => {
  const { $schema: _, ...rest } = z.toJSONSchema(s) as Record<string, unknown>;
  return rest;
};

const SCHEMAS = {
  report: jsonSchema(ReportSchema),
  sections: jsonSchema(SectionsReportSchema),
  reportPatch: jsonSchema(ReportPatchSchema),
  sectionsPatch: jsonSchema(SectionsPatchSchema),
  format: jsonSchema(
    z.object({
      name: z.string(),
      description: z.string(),
      sections: z.array(z.object({ heading: z.string(), guidance: z.string() })),
      style: z.string(),
    }),
  ),
};

type Body =
  | { mode: "generate"; format: ReportFormat; notes: string; meta: Meta }
  | { mode: "patch"; format: ReportFormat; report: AnyReport; meta: Meta; instruction?: string; newNotes?: string }
  | { mode: "extract-format"; outline: string; fileName: string };

class Failure extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// One structured call, falling through the model list on quota or availability errors.
async function ask(ai: GoogleGenAI, sys: string, prompt: string, schema: unknown): Promise<{ data: unknown; model: string }> {
  let lastError = "";
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: sys,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          maxOutputTokens: 32768,
          // Sorting notes into a fixed template needs little deliberation; low thinking keeps it fast.
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        throw new Failure("The report came back incomplete. Try again, or split the notes.", 502);
      }
      if (!response.text) throw new Failure("Gemini returned nothing for this. Try rewording it.", 422);
      return { data: JSON.parse(response.text), model };
    } catch (err) {
      if (err instanceof Failure) throw err;
      if (err instanceof SyntaxError) {
        lastError = "The answer came back as broken JSON.";
        continue;
      }
      if (err instanceof ApiError) {
        console.error(`[generate] ${model} failed: ${err.status} ${err.message.slice(0, 300)}`);
        if ([404, 429, 500, 503].includes(err.status)) {
          lastError =
            err.status === 429
              ? "The free Gemini quota is used up for now. Wait a minute, or try again tomorrow."
              : `Gemini is unavailable right now (${err.status}).`;
          continue;
        }
        throw new Failure(`Gemini rejected the request: ${err.message}`, 502);
      }
      throw err;
    }
  }
  throw new Failure(`${lastError} The /demo page still works.`, 503);
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "No API key is set on this server. Open /demo to try the tool with a saved example." },
      { status: 503 },
    );
  }
  const body = (await req.json()) as Body;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    if (body.mode === "extract-format") return Response.json(await extractFormat(ai, body.outline, body.fileName));
    if (body.mode === "generate") return Response.json(await generate(ai, body.format, body.notes, body.meta));
    return Response.json(await patch(ai, body));
  } catch (err) {
    if (err instanceof Failure) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const detailsOf = (meta: Meta) =>
  `Student's details (for reference; the cover page is generated from these):\n${JSON.stringify(meta, null, 2)}`;

async function generate(ai: GoogleGenAI, format: ReportFormat, notes: string, meta: Meta) {
  if (!notes?.trim()) throw new Failure("Say some notes first.", 400);
  const prompt = `${detailsOf(meta)}\n\nThe student's dictated notes:\n<notes>\n${notes}\n</notes>\n\nWrite the full report.`;
  const isInternship = format.kind !== "sections";
  const { data, model } = await ask(ai, system(format), prompt, isInternship ? SCHEMAS.report : SCHEMAS.sections);
  const parsed = (isInternship ? ReportSchema : SectionsReportSchema).safeParse(data);
  if (!parsed.success) throw new Failure("The report came back in the wrong shape. Try again.", 502);
  return { report: tidy(parsed.data), model, changes: ["Wrote the full report from all notes"] };
}

// The agent step: read the current report and what's new, decide which sections to
// edit, and return only those. The server applies the edits, checks the result
// against the format, and sends the agent back once if the result doesn't hold.
async function patch(ai: GoogleGenAI, body: Extract<Body, { mode: "patch" }>) {
  const { format, report, meta, instruction, newNotes } = body;
  if (!instruction?.trim() && !newNotes?.trim()) throw new Failure("Nothing new to add.", 400);

  const isInternship = format.kind !== "sections";
  const task = [
    newNotes?.trim() &&
      `New notes the student added since this version (fold every fact into the right section; extend the weekly table if there is one; close any gap these notes answer):\n<new_notes>\n${newNotes}\n</new_notes>`,
    instruction?.trim() && `The student asked for this change:\n<change>\n${instruction}\n</change>`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let prompt = `${detailsOf(meta)}\n\nThe current report:\n<report>\n${JSON.stringify(report)}\n</report>\n\n${task}\n\nReturn only what changes. For every part you leave as it is, return null${
    isInternship ? "" : " (and leave it out of \"sections\")"
  }. A part you do change must be returned complete. List each edit in "changes".`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, model } = await ask(ai, system(format), prompt, isInternship ? SCHEMAS.reportPatch : SCHEMAS.sectionsPatch);
    let next: AnyReport | null = null;
    let changes: string[] = [];
    let problem = "";

    if (isInternship) {
      const p = ReportPatchSchema.safeParse(data);
      if (p.success) {
        next = applyReportPatch(report as Report, p.data);
        changes = p.data.changes;
        if (!ReportSchema.safeParse(next).success) problem = "the edited report no longer matches the format";
      } else problem = "the edits were not in the expected shape";
    } else {
      const p = SectionsPatchSchema.safeParse(data);
      if (p.success) {
        const order = format.sections.map((s) => s.heading);
        const unknown = p.data.sections.filter((s) => !order.some((h) => h.toLowerCase() === s.heading.toLowerCase()));
        if (unknown.length) problem = `these headings are not in the format: ${unknown.map((s) => s.heading).join(", ")}`;
        else {
          next = applySectionsPatch(report as SectionsReport, p.data, order);
          changes = p.data.changes;
        }
      } else problem = "the edits were not in the expected shape";
    }

    if (!problem && next) return { report: tidy(next), changes: changes.length ? changes : ["No changes were needed"], model };
    prompt += `\n\nYour previous answer could not be applied: ${problem}. Fix that and answer again.`;
  }
  throw new Failure("The agent's edits could not be applied. Try again, or use Generate full report.", 502);
}

async function extractFormat(ai: GoogleGenAI, outline: string, fileName: string) {
  if (!outline?.trim()) throw new Failure("That file had no readable text.", 400);
  const sys = `You read the outline of a report a student already submitted and describe its format so new reports can be written the same way. List the main section headings in order (skip the cover page, certificate, table of contents and page furniture), with one line of guidance per section saying what goes in it, and describe the writing style in two sentences. Name the format briefly, e.g. "DBMS lab record".`;
  const { data } = await ask(ai, sys, `File: ${fileName}\n\n<outline>\n${outline.slice(0, 30000)}\n</outline>`, SCHEMAS.format);
  return { format: data };
}

// The exporter adds numbering and the executive-summary leads itself, so strip
// them if the model repeated them in the text.
const ES_LEADS: Record<keyof Report["executiveSummary"], RegExp> = {
  company: /^\s*the company\.\s*/i,
  problem: /^\s*the problem or opportunity\.\s*/i,
  methodology: /^\s*methodology\.\s*/i,
  findings: /^\s*key parts and findings\.\s*/i,
  benefits: /^\s*benefits to the institution\.\s*/i,
};
const stripNumber = (s: string) => s.replace(/^\s*(\[\d+\]|\d+[.)])\s+/, "");

function tidy<T extends AnyReport>(r: T): T {
  if ("sections" in r) {
    return { ...r, sections: r.sections.map((s) => ({ ...s, items: s.items.map(stripNumber) })) };
  }
  const es = { ...r.executiveSummary };
  for (const k of Object.keys(ES_LEADS) as (keyof typeof ES_LEADS)[]) es[k] = es[k].replace(ES_LEADS[k], "");
  return {
    ...r,
    executiveSummary: es,
    learningObjectives: r.learningObjectives.map(stripNumber),
    bibliography: r.bibliography.map(stripNumber),
  };
}
