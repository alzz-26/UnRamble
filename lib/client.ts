"use client";

import type { Certificate } from "./exportDocx";
import { DEFAULT_PAGE, newFormatId, type ReportFormat, type SectionsFormat } from "./formats";
import { isSectionsReport, type AnyReport, type Meta } from "./schema";

// Browser-side helpers shared by the quick page and the project workspace.

export const PLACEHOLDER_LOGO = "/logo-placeholder.png";

export type ApiResult = { report: AnyReport; changes: string[]; model?: string };

export async function callApi<T = ApiResult>(body: object): Promise<T> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 504) throw new Error("The AI took longer than the server allows (5 min). Please try again; it's usually faster the second time.");
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export function readImage(file: File): Promise<Certificate & { url: string }> {
  return new Promise(async (resolve, reject) => {
    const type = file.type === "image/png" ? "png" : "jpg";
    const data = await file.arrayBuffer();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ data, type, width: img.naturalWidth, height: img.naturalHeight, url });
    img.onerror = () => reject(new Error("That image could not be read."));
    img.src = url;
  });
}

export async function placeholderLogo(): Promise<Certificate> {
  const res = await fetch(PLACEHOLDER_LOGO);
  return { data: await res.arrayBuffer(), type: "png", width: 766, height: 300 };
}

export async function downloadReport(
  format: ReportFormat,
  meta: Meta,
  report: AnyReport,
  images: { logo?: Certificate | null; certificate?: Certificate | null } = {},
) {
  const { buildDocx, buildSectionsDocx } = await import("./exportDocx");
  const logo = images.logo ?? (await placeholderLogo());
  const blob =
    format.kind === "sections" && isSectionsReport(report)
      ? await buildSectionsDocx(format, meta, report, logo)
      : await buildDocx(meta, report as Parameters<typeof buildDocx>[1], images.certificate, logo);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(meta.studentName || "Report").replace(/\s+/g, "_")}_${(meta.title || format.name).replace(/[^\w]+/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// Read a past report (.docx) into a short outline the format extractor can work
// from, and take its page setup (font, margins) straight from the file.
export async function readDocxOutline(file: File): Promise<{ outline: string; page: SectionsFormat["page"] }> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("That doesn't look like a Word (.docx) file.");
  const styles = (await zip.file("word/styles.xml")?.async("string")) ?? "";

  const lines: string[] = [];
  for (const p of xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []) {
    const text = decodeXml((p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("").trim());
    if (!text) continue;
    const style = p.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? "";
    const bold = /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(p);
    const heading = /heading|title/i.test(style) || (bold && text.length < 80);
    lines.push(heading ? `# ${text}` : `  ${text.slice(0, 140)}`);
  }

  const mar = xml.match(/<w:pgMar ([^>]*)\/>/)?.[1] ?? "";
  const num = (k: string, d: number) => Number(mar.match(new RegExp(`w:${k}="(\\d+)"`))?.[1] ?? d);
  const font =
    styles.match(/<w:style [^>]*w:styleId="Normal"[\s\S]*?w:ascii="([^"]+)"/)?.[1] ??
    xml.match(/w:ascii="([^"]+)"/)?.[1] ??
    DEFAULT_PAGE.font;
  const size = Number(styles.match(/<w:style [^>]*w:styleId="Normal"[\s\S]*?<w:sz w:val="(\d+)"/)?.[1] ?? DEFAULT_PAGE.bodySize);

  return {
    outline: lines.join("\n"),
    page: {
      font,
      bodySize: size,
      margin: {
        top: num("top", DEFAULT_PAGE.margin.top),
        right: num("right", DEFAULT_PAGE.margin.right),
        bottom: num("bottom", DEFAULT_PAGE.margin.bottom),
        left: num("left", DEFAULT_PAGE.margin.left),
      },
    },
  };
}

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export async function formatFromDocx(file: File): Promise<SectionsFormat> {
  const { outline, page } = await readDocxOutline(file);
  const { format } = await callApi<{ format: Omit<SectionsFormat, "kind" | "id" | "page"> }>({
    mode: "extract-format",
    outline,
    fileName: file.name,
  });
  return { kind: "sections", id: newFormatId(), ...format, page };
}

// The same, from text the student pastes: a sample report copied out of a PDF,
// a list of headings, or the format instructions their department gave them.
export async function formatFromText(text: string): Promise<SectionsFormat> {
  const { format } = await callApi<{ format: Omit<SectionsFormat, "kind" | "id" | "page"> }>({
    mode: "extract-format",
    outline: text,
    fileName: "pasted sample",
  });
  return { kind: "sections", id: newFormatId(), ...format, page: DEFAULT_PAGE };
}

export function changedHeadings(before: AnyReport | null, after: AnyReport): string[] {
  if (!before || !isSectionsReport(before) || !isSectionsReport(after)) return [];
  const old = new Map(before.sections.map((s) => [s.heading.toLowerCase(), JSON.stringify(s)]));
  return after.sections.filter((s) => old.get(s.heading.toLowerCase()) !== JSON.stringify(s)).map((s) => s.heading);
}
