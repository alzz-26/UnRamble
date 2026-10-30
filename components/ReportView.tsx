import ReportPreview from "./ReportPreview";
import SectionsPreview from "./SectionsPreview";
import type { ReportFormat } from "@/lib/formats";
import { changedSections, isSectionsReport, type AnyReport, type Meta, type SectionKey } from "@/lib/schema";
import { changedHeadings } from "@/lib/client";

type Props = { format: ReportFormat; meta: Meta; report: AnyReport; changed: string[]; logoSrc: string };

// The paper preview for any format, with the gap summary above and viva questions below.
export default function ReportView({ format, meta, report, changed, logoSrc }: Props) {
  const gapCount = report.gaps.length;
  return (
    <>
      {gapCount > 0 && (
        <div className="gaps-summary">
          <b>
            {gapCount} thing{gapCount > 1 ? "s" : ""} to add.
          </b>{" "}
          Look for the amber markers.
        </div>
      )}
      {format.kind === "sections" && isSectionsReport(report) ? (
        <SectionsPreview format={format} meta={meta} report={report} changed={changed} logoSrc={logoSrc} />
      ) : !isSectionsReport(report) ? (
        <ReportPreview meta={meta} report={report} changed={changed as SectionKey[]} logoSrc={logoSrc} />
      ) : (
        <div className="error">This report was written for a different format. Generate it again.</div>
      )}
      {report.vivaQuestions.length > 0 && (
        <aside className="viva">
          <h3>Likely viva questions</h3>
          <p className="muted small">Not in the Word file. Practise answering these out loud.</p>
          <ol>
            {report.vivaQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </aside>
      )}
    </>
  );
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  acknowledgement: "Acknowledgement",
  executiveSummary: "Executive Summary",
  learningObjectives: "Learning Objectives",
  weeks: "Weekly Overview",
  introduction: "Introduction",
  discussion: "Internship Discussion",
  conclusion: "Conclusion",
  bibliography: "Bibliography",
};

// Which parts of the report differ between two versions, as preview keys.
export function changedParts(before: AnyReport | null, after: AnyReport): string[] {
  if (!before) return [];
  if (isSectionsReport(after)) return changedHeadings(before, after);
  return isSectionsReport(before) ? [] : changedSections(before, after);
}

export function partLabel(key: string) {
  return SECTION_LABELS[key as SectionKey] ?? key;
}
