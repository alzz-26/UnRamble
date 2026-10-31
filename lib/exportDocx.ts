import {
  AlignmentType,
  Bookmark,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  NumberFormat,
  Packer,
  PageBreak,
  PageNumber,
  PageReference,
  Paragraph,
  HeightRule,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  VerticalMergeType,
  WidthType,
} from "docx";
import { codeSpans, shotLabel } from "./rich";
import { alignSections, sectionByHeading, type Meta, type Report, type ReportPara, type ReportTable, type SectionsReport } from "./schema";
import type { SectionsFormat } from "./formats";
import { FORMAT as F } from "./template";

export type Certificate = { data: ArrayBuffer; type: "png" | "jpg"; width: number; height: number };

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const p = (text: string, opts: { bold?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number } = {}) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: opts.after !== undefined ? { after: opts.after } : undefined,
    children: [new TextRun({ text, bold: opts.bold, size: opts.size })],
  });

const centred = (text: string, size?: number, bold = true, after?: number) =>
  p(text, { bold, size, align: AlignmentType.CENTER, after });

// Text with `code` in backticks set in a code font.
const textRuns = (text: string) =>
  codeSpans(text).map((s) => (s.code ? new TextRun({ text: s.text, font: "Consolas", size: 21 }) : new TextRun(s.text)));

// An empty dashed box with its label, for the student to paste a screenshot into.
const shotBox = (label: string) => {
  const dashed = { style: BorderStyle.DASHED, size: 6, color: "999999" };
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          height: { value: 2600, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              borders: { top: dashed, bottom: dashed, left: dashed, right: dashed },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, italics: true, color: "808080", size: 20 })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ children: [], spacing: { after: 120 } }),
  ];
};

const para = (x: ReportPara) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    children: [...(x.lead ? [new TextRun({ text: `${x.lead} `, bold: true })] : []), ...textRuns(x.text)],
  });

const block = (x: ReportPara) => {
  const shot = x.lead ? null : shotLabel(x.text);
  return shot ? shotBox(shot) : [para(x)];
};

// Numbered list; a screenshot placeholder between steps becomes a box and doesn't take a number.
const numbered = (items: string[]) => {
  let n = 0;
  return items.flatMap((t) => {
    const shot = shotLabel(t);
    if (shot) return shotBox(shot);
    n++;
    return [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 360, hanging: 360 },
        children: [new TextRun(`${n}.\t`), ...textRuns(t)],
        tabStops: [{ type: "left", position: 360 }],
      }),
    ];
  });
};

const h1 = (text: string, bookmark: string, pageBreak = true) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: pageBreak,
    children: [new Bookmark({ id: bookmark, children: [new TextRun(text)] })],
  });

const h2 = (text: string, bookmark: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new Bookmark({ id: bookmark, children: [new TextRun(text)] })],
  });

const cellText = (text: string, opts: { bold?: boolean; italic?: boolean } = {}) =>
  text.split("\n").map(
    (line) =>
      new Paragraph({
        spacing: { after: 0, line: 240 },
        children: [new TextRun({ text: line, size: F.tableTextSize, bold: opts.bold, italics: opts.italic })],
      }),
  );

const headerCell = (text: string) =>
  new TableCell({
    shading: { type: ShadingType.CLEAR, color: "auto", fill: F.tableHeaderFill },
    children: cellText(text, { bold: true }),
  });

function table(t: ReportTable, n: number) {
  return [
    centred(`Table ${n}: ${t.caption}`, undefined, true, 80),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({ tableHeader: true, children: t.headers.map(headerCell) }),
        ...t.rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: cellText(c) })) })),
      ],
    }),
    new Paragraph({ children: [] }),
  ];
}

function weekTable(w: Report["weeks"][number], wi: number) {
  const label = `${ORDINAL[wi] ?? `${wi + 1}th`} WEEK`;
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [1300, 1300, 700, 5000],
      rows: [
        new TableRow({ tableHeader: true, children: [label, "DATE", "DAY", "NAME OF THE TOPIC/MODULE COMPLETED"].map(headerCell) }),
        ...w.days.map(
          (d, di) =>
            new TableRow({
              children: [
                new TableCell({
                  verticalMerge: di === 0 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
                  children: di === 0 ? cellText(label, { bold: true }) : [new Paragraph({ children: [] })],
                }),
                new TableCell({ children: cellText(d.date) }),
                new TableCell({ children: cellText(d.day) }),
                new TableCell({
                  children: [...cellText(d.topic), ...(d.lab ? cellText(`Lab: ${d.lab}`, { italic: true }) : [])],
                }),
              ],
            }),
        ),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 80 },
      children: [new TextRun({ text: `Summary: ${w.summary}`, bold: true, size: F.weeklySummarySize })],
    }),
  ];
}

function pageFooter() {
  return new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })],
  });
}

const pageProps = (numbers?: { format: (typeof NumberFormat)[keyof typeof NumberFormat] }) => ({
  page: {
    size: F.page,
    margin: { ...F.margin, header: 720, footer: 720 },
    ...(numbers ? { pageNumbers: { start: 1, formatType: numbers.format } } : {}),
  },
});

export async function buildDocx(
  meta: Meta,
  r: Report,
  certificate?: Certificate | null,
  logo?: Certificate | null,
): Promise<Blob> {
  let tableNo = 0;
  const es = r.executiveSummary;

  // The university logo sits on the cover and the certificate page, about 2.6" wide as in the template.
  const logoPara = () =>
    logo
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            children: [new ImageRun({ type: logo.type, data: logo.data, transformation: fit(logo.width, logo.height, 250, 110) })],
          }),
        ]
      : [new Paragraph({ children: [], spacing: { before: 1600 } })];

  // --- Cover, certificate and certification pages (no page numbers) ---
  const cover = [
    new Paragraph({ children: [], spacing: { before: 1200 } }),
    centred("INTERNSHIP REPORT", 44),
    centred("on", undefined, false),
    centred(meta.title, 32),
    centred("A report submitted in partial fulfillment of the requirements for the Award of Degree of", undefined, false),
    centred(meta.degree, 28),
    centred("In"),
    centred(meta.branch, 28),
    centred("By"),
    centred(`${meta.studentName.toUpperCase()}   Regd. No.: ${meta.regNo}`, 26),
    centred(`Under Supervision of ${meta.organisation}`),
    centred(`(Duration: ${meta.duration})`),
    ...logoPara(),
    centred(meta.school, 26),
    centred(meta.university, 26),
    centred(meta.academicYear, 26),
  ];

  const certificatePage = [
    new Paragraph({ children: [new PageBreak()] }),
    centred(meta.school, 26),
    centred(meta.university, 26, true, logo ? 0 : 600),
    ...(logo ? logoPara() : []),
    centred("CERTIFICATE", 36, true, 400),
    p(
      `This is to certify that the “Internship report” submitted by ${meta.studentName.toUpperCase()} (Regd. No.: ${meta.regNo}) is work done by the student and submitted during ${meta.academicYear} academic year, in partial fulfillment of the requirements for the award of the degree of ${meta.degree} in ${meta.branch}, at ${meta.organisation.replace(/\.\s*$/, "")}.`,
    ),
    new Paragraph({ children: [], spacing: { before: 1400 } }),
    p("College Internship Guide", { bold: true, align: AlignmentType.LEFT, after: 0 }),
    p(meta.guideName, { align: AlignmentType.LEFT, after: 0 }),
    p(meta.guideDept, { align: AlignmentType.LEFT }),
  ];

  const certificationPage = [
    new Paragraph({ children: [new PageBreak()] }),
    centred("CERTIFICATION", 32),
    centred("Internship certificate provided by the internship institution", undefined, false, 300),
    certificate
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: certificate.type,
              data: certificate.data,
              transformation: fit(certificate.width, certificate.height, 560, 700),
            }),
          ],
        })
      : centred("[ Insert the internship completion certificate here ]", undefined, false),
  ];

  // --- Front matter (roman page numbers) ---
  const index: [string, string, string][] = [
    ["", "Acknowledgement", "ack"],
    ["", "Executive Summary / Abstract", "abs"],
    ["", "Learning Objectives", "obj"],
    ["", "Weekly Overview of Internship Activities", "weekly"],
    ["1.", "INTRODUCTION", "ch1"],
    ["2.", "INTERNSHIP DISCUSSION", "ch2"],
    ...r.discussion.map((s, i): [string, string, string] => ["", `2.${i + 1}     ${s.title}`, `ch2_${i + 1}`]),
    ["3.", "CONCLUSION", "ch3"],
    ["4.", "BIBLIOGRAPHY", "ch4"],
  ];

  const front = [
    h1("ACKNOWLEDGEMENT", "ack", false),
    ...r.acknowledgement.map((t) => p(t)),
    p(meta.studentName.toUpperCase(), { bold: true, align: AlignmentType.RIGHT, after: 0 }),
    p(`(${meta.regNo})`, { bold: true, align: AlignmentType.RIGHT }),

    h1("EXECUTIVE SUMMARY / ABSTRACT", "abs"),
    ...(
      [
        ["The company.", es.company],
        ["The problem or opportunity.", es.problem],
        ["Methodology.", es.methodology],
        ["Key parts and findings.", es.findings],
        ["Benefits to the institution.", es.benefits],
      ] as const
    )
      .filter(([, t]) => t)
      .map(([lead, text]) => para({ lead, text })),

    h1("INDEX", "index"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [900, 6200, 1200],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: ["SNo.", "Contents", "Page No."].map(
            (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }),
          ),
        }),
        ...index.map(
          ([no, title, id]) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: no, bold: !!no })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: !!no })] })] }),
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new PageReference(id)] })],
                }),
              ],
            }),
        ),
      ],
    }),

    h1("LEARNING OBJECTIVES / INTERNSHIP OBJECTIVES", "obj"),
    ...numbered(r.learningObjectives),

    h1("WEEKLY OVERVIEW OF INTERNSHIP ACTIVITIES", "weekly"),
    ...r.weeks.flatMap((w, wi) => weekTable(w, wi)),
  ];

  // --- Main chapters (arabic page numbers) ---
  const intro = r.introduction;
  const main = [
    h1("1. INTRODUCTION", "ch1", false),
    ...intro.paragraphs.flatMap((x, i) => [
      para(x),
      ...(i === 1 && intro.glanceTable ? table(intro.glanceTable, ++tableNo) : []),
    ]),
    ...(intro.paragraphs.length < 2 && intro.glanceTable ? table(intro.glanceTable, ++tableNo) : []),

    h1("2. INTERNSHIP DISCUSSION", "ch2"),
    ...r.discussion.flatMap((s, i) => [
      h2(`2.${i + 1} ${s.title}`, `ch2_${i + 1}`),
      ...(i === 0 && s.table ? table(s.table, ++tableNo) : []),
      ...s.paragraphs.flatMap(block),
      ...(i !== 0 && s.table ? table(s.table, ++tableNo) : []),
      ...(s.code
        ? [
            ...(s.codeCaption ? [centred(s.codeCaption, undefined, true, 60)] : []),
            ...s.code.split("\n").map(
              (line) =>
                new Paragraph({
                  spacing: { after: 0, line: 240 },
                  children: [new TextRun({ text: line, font: "Courier New", size: 19 })],
                }),
            ),
            new Paragraph({ children: [] }),
          ]
        : []),
    ]),

    h1("3. CONCLUSION", "ch3"),
    ...r.conclusion.map((t) => p(t)),

    h1("4. BIBLIOGRAPHY", "ch4"),
    ...numbered(r.bibliography),
  ];

  const doc = new Document({
    creator: meta.studentName,
    title: `Internship Report — ${meta.title}`,
    features: { updateFields: true }, // fills the index page numbers when Word opens it
    styles: {
      default: {
        document: {
          run: { font: F.font, size: F.bodySize },
          paragraph: { spacing: { after: F.spacingAfter, line: F.lineSpacing } },
        },
        heading1: {
          run: { font: F.font, size: F.h1Size, bold: true, color: "000000" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 160 }, keepNext: true, keepLines: true },
        },
        heading2: {
          run: { font: F.font, size: F.h2Size, bold: true, color: "000000" },
          paragraph: { spacing: { before: 240 }, keepNext: true, keepLines: true },
        },
      },
    },
    sections: [
      { properties: pageProps(), children: [...cover, ...certificatePage, ...certificationPage] },
      { properties: pageProps({ format: NumberFormat.LOWER_ROMAN }), footers: { default: pageFooter() }, children: front },
      { properties: pageProps({ format: NumberFormat.DECIMAL }), footers: { default: pageFooter() }, children: main },
    ],
  });

  return Packer.toBlob(doc);
}

// Scale an image to fit a box (in pixels) without distorting it.
function fit(w: number, h: number, maxW: number, maxH: number) {
  const s = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

// Lab records, progress reports and custom formats: a title page, then one
// numbered heading per section, in the format's page setup.
export async function buildSectionsDocx(
  format: SectionsFormat,
  meta: Meta,
  r: SectionsReport,
  logo?: Certificate | null,
): Promise<Blob> {
  let tableNo = 0;
  const sectionFor = sectionByHeading(alignSections(r, format.sections.map((s) => s.heading)));

  const titlePage = [
    ...(logo
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 600 },
            children: [new ImageRun({ type: logo.type, data: logo.data, transformation: fit(logo.width, logo.height, 250, 110) })],
          }),
        ]
      : [new Paragraph({ children: [], spacing: { before: 1600 } })]),
    centred((meta.title || format.name).toUpperCase(), 36),
    centred(format.name, undefined, false, 800),
    centred("Submitted by", undefined, true, 60),
    centred(`${meta.studentName}${meta.regNo ? ` (${meta.regNo})` : ""}`, 26),
    ...(meta.organisation ? [centred(meta.organisation, undefined, false)] : []),
    ...(meta.duration ? [centred(meta.duration, undefined, false)] : []),
    ...(meta.guideName ? [centred(`Submitted to: ${meta.guideName}`, undefined, false)] : []),
    new Paragraph({ children: [], spacing: { before: 1200 } }),
    centred(meta.school, 26),
    centred(meta.university, 26),
  ];

  const body = format.sections.flatMap((f, i) => {
    const s = sectionFor(f.heading);
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: i === 0,
        children: [new TextRun(`${i + 1}. ${f.heading.toUpperCase()}`)],
      }),
      ...(s ? s.paragraphs.flatMap(block) : []),
      ...(s ? numbered(s.items) : []),
      ...(s?.table ? table(s.table, ++tableNo) : []),
    ];
  });

  const page = { size: F.page, margin: { ...format.page.margin, header: 720, footer: 720 } };
  const doc = new Document({
    creator: meta.studentName,
    title: meta.title || format.name,
    styles: {
      default: {
        document: {
          run: { font: format.page.font, size: format.page.bodySize },
          paragraph: { spacing: { after: F.spacingAfter, line: F.lineSpacing } },
        },
        heading2: {
          run: { font: format.page.font, size: F.h2Size, bold: true, color: "000000" },
          paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, keepLines: true },
        },
      },
    },
    sections: [
      { properties: { page }, children: titlePage },
      {
        properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        footers: { default: pageFooter() },
        children: body,
      },
    ],
  });
  return Packer.toBlob(doc);
}
