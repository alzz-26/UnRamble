import type { SectionsFormat } from "@/lib/formats";
import { alignSections, sectionByHeading, type Meta, type SectionsReport } from "@/lib/schema";
import { RichList, RichPara } from "./Rich";

type Props = { format: SectionsFormat; meta: Meta; report: SectionsReport; changed: string[]; logoSrc: string };

// Preview for lab records, progress reports and custom formats: a title page,
// then one numbered heading per section of the format.
export default function SectionsPreview({ format, meta, report, changed, logoSrc }: Props) {
  let tableNo = 0;
  const sectionFor = sectionByHeading(alignSections(report, format.sections.map((s) => s.heading)));
  const isChanged = (h: string) => changed.some((c) => c.toLowerCase() === h.toLowerCase());

  return (
    <article className="paper" aria-label="Report preview">
      <div className="r-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="r-logo" src={logoSrc} alt="University logo" />
        <p className="r-cover-big">{(meta.title || format.name).toUpperCase()}</p>
        <p className="r-small">{format.name}</p>
        <p className="r-b r-space">Submitted by</p>
        <p className="r-b">
          {meta.studentName || "Your name"} {meta.regNo && <>&nbsp; ({meta.regNo})</>}
        </p>
        {meta.organisation && <p className="r-small">{meta.organisation}</p>}
        {meta.duration && <p className="r-small">{meta.duration}</p>}
        {meta.guideName && (
          <p className="r-small">
            Submitted to: <b>{meta.guideName}</b>
          </p>
        )}
        <p className="r-b r-space">{meta.school}</p>
        <p className="r-b">{meta.university}</p>
      </div>

      {format.sections.map((f, i) => {
        const s = sectionFor(f.heading);
        const empty = !s || (s.paragraphs.length === 0 && s.items.length === 0 && !s.table);
        const gaps = report.gaps.filter((g) => g.section.toLowerCase().includes(f.heading.toLowerCase()));
        return (
          <section key={f.heading} className={`r-section${isChanged(f.heading) ? " changed" : ""}`} data-section={f.heading}>
            {isChanged(f.heading) && <span className="changed-badge">Updated</span>}
            <h3 className="r-h-left">
              {i + 1}. {f.heading.toUpperCase()}
            </h3>
            {s?.paragraphs.map((p, pi) => <RichPara key={pi} p={p} />)}
            {s && s.items.length > 0 && <RichList items={s.items} />}
            {s?.table && (
              <>
                <p className="r-caption">
                  Table {++tableNo}: {s.table.caption}
                </p>
                <table className="r-table">
                  <thead>
                    <tr>
                      {s.table.headers.map((h, hi) => (
                        <th key={hi}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.map((c, ci) => (
                          <td key={ci}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {empty && (
              <div className="gap" role="note">
                <span className="gap-label">Missing</span>
                {gaps[0]?.whatToSay || `Nothing in your notes for this yet. ${f.guidance}`}
              </div>
            )}
            {!empty &&
              gaps.map((g, gi) => (
                <div key={gi} className="gap gap-thin" role="note">
                  <span className="gap-label">Thin</span>
                  {g.whatToSay}
                </div>
              ))}
          </section>
        );
      })}
    </article>
  );
}
