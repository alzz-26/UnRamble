import type { Meta, Report, ReportPara, ReportTable, SectionKey } from "@/lib/schema";
import { RichPara } from "./Rich";

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

type Props = { meta: Meta; report: Report; changed: SectionKey[]; logoSrc: string };

// Which gap entries belong to a section, matched loosely on the name Claude used.
const GAP_WORDS: Record<SectionKey, string[]> = {
  acknowledgement: ["acknowledg"],
  executiveSummary: ["executive", "abstract", "summary"],
  learningObjectives: ["objective"],
  weeks: ["week"],
  introduction: ["introduction"],
  discussion: ["discussion", "lab", "assignment", "project", "result", "challenge", "skill"],
  conclusion: ["conclusion"],
  bibliography: ["bibliograph", "reference"],
};

export default function ReportPreview({ meta, report, changed, logoSrc }: Props) {
  let tableNo = 0;
  const nextTable = () => ++tableNo;

  const gapsFor = (key: SectionKey) =>
    report.gaps.filter((g) => GAP_WORDS[key].some((w) => g.section.toLowerCase().includes(w)));

  const section = (key: SectionKey, empty: boolean, children: React.ReactNode) => (
    <section className={`r-section${changed.includes(key) ? " changed" : ""}`} data-section={key}>
      {changed.includes(key) && <span className="changed-badge">Updated</span>}
      {children}
      {empty && <Gap text={gapsFor(key)[0]?.whatToSay} />}
      {!empty && gapsFor(key).map((g, i) => <Gap key={i} text={g.whatToSay} thin />)}
    </section>
  );

  const es = report.executiveSummary;
  const esParas: [string, string][] = [
    ["The company.", es.company],
    ["The problem or opportunity.", es.problem],
    ["Methodology.", es.methodology],
    ["Key parts and findings.", es.findings],
    ["Benefits to the institution.", es.benefits],
  ];

  return (
    <article className="paper" aria-label="Report preview">
      <div className="r-cover">
        <p className="r-cover-big">INTERNSHIP REPORT</p>
        <p>on</p>
        <p className="r-cover-title">{meta.title || "Internship title"}</p>
        <p className="r-small">A report submitted in partial fulfillment of the requirements for the Award of Degree of</p>
        <p className="r-b">{meta.degree}</p>
        <p>In</p>
        <p className="r-b">{meta.branch}</p>
        <p>By</p>
        <p className="r-b">
          {meta.studentName || "Your name"} &nbsp; Regd. No.: {meta.regNo || "—"}
        </p>
        <p className="r-small">Under Supervision of {meta.organisation || "—"}</p>
        <p className="r-small">(Duration: {meta.duration || "—"})</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="r-logo" src={logoSrc} alt="University logo" />
        <p className="r-b">{meta.school}</p>
        <p className="r-b">{meta.university}</p>
        <p className="r-b">{meta.academicYear}</p>
      </div>

      {section(
        "acknowledgement",
        report.acknowledgement.length === 0,
        <>
          <h2>ACKNOWLEDGEMENT</h2>
          {report.acknowledgement.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {report.acknowledgement.length > 0 && (
            <p className="r-sign">
              {meta.studentName.toUpperCase()}
              <br />({meta.regNo})
            </p>
          )}
        </>,
      )}

      {section(
        "executiveSummary",
        esParas.every(([, t]) => !t),
        <>
          <h2>EXECUTIVE SUMMARY / ABSTRACT</h2>
          {esParas.map(([lead, text]) =>
            text ? (
              <p key={lead}>
                <b>{lead}</b> {text}
              </p>
            ) : (
              <Gap key={lead} text={`Nothing yet for "${lead.replace(".", "")}".`} thin />
            ),
          )}
        </>,
      )}

      {section(
        "learningObjectives",
        report.learningObjectives.length === 0,
        <>
          <h2>LEARNING OBJECTIVES / INTERNSHIP OBJECTIVES</h2>
          <ol>
            {report.learningObjectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ol>
        </>,
      )}

      {section(
        "weeks",
        report.weeks.length === 0,
        <>
          <h2>WEEKLY OVERVIEW OF INTERNSHIP ACTIVITIES</h2>
          {report.weeks.map((w, wi) => (
            <div key={wi} className="r-week">
              <table className="r-table">
                <thead>
                  <tr>
                    <th>{ORDINAL[wi] ?? `${wi + 1}th`} WEEK</th>
                    <th>DATE</th>
                    <th>DAY</th>
                    <th>NAME OF THE TOPIC/MODULE COMPLETED</th>
                  </tr>
                </thead>
                <tbody>
                  {w.days.map((d, di) => (
                    <tr key={di}>
                      {di === 0 && <td rowSpan={w.days.length} className="r-weeklabel">{ORDINAL[wi] ?? `${wi + 1}th`} WEEK</td>}
                      <td>{d.date}</td>
                      <td>{d.day}</td>
                      <td>
                        {d.topic}
                        {d.lab && (
                          <>
                            <br />
                            <i>Lab: {d.lab}</i>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {w.summary && (
                <p className="r-weeksum">
                  <b>Summary:</b> {w.summary}
                </p>
              )}
            </div>
          ))}
        </>,
      )}

      {section(
        "introduction",
        report.introduction.paragraphs.length === 0,
        <>
          <h2>1. INTRODUCTION</h2>
          {report.introduction.paragraphs.map((p, i) => (
            <span key={i}>
              <Para p={p} />
              {i === 1 && report.introduction.glanceTable && <Table t={report.introduction.glanceTable} n={nextTable()} />}
            </span>
          ))}
          {report.introduction.paragraphs.length < 2 && report.introduction.glanceTable && (
            <Table t={report.introduction.glanceTable} n={nextTable()} />
          )}
        </>,
      )}

      {section(
        "discussion",
        report.discussion.length === 0,
        <>
          <h2>2. INTERNSHIP DISCUSSION</h2>
          {report.discussion.map((s, i) => (
            <div key={i}>
              <h3>
                2.{i + 1} {s.title}
              </h3>
              {i === 0 && s.table && <Table t={s.table} n={nextTable()} />}
              {s.paragraphs.map((p, pi) => (
                <RichPara key={pi} p={p} />
              ))}
              {i !== 0 && s.table && <Table t={s.table} n={nextTable()} />}
              {s.code && (
                <figure className="r-code">
                  {s.codeCaption && <figcaption>{s.codeCaption}</figcaption>}
                  <pre>{s.code}</pre>
                </figure>
              )}
            </div>
          ))}
        </>,
      )}

      {section(
        "conclusion",
        report.conclusion.length === 0,
        <>
          <h2>3. CONCLUSION</h2>
          {report.conclusion.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </>,
      )}

      {section(
        "bibliography",
        report.bibliography.length === 0,
        <>
          <h2>4. BIBLIOGRAPHY</h2>
          <ol>
            {report.bibliography.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ol>
        </>,
      )}
    </article>
  );
}

function Para({ p }: { p: ReportPara }) {
  return (
    <p>
      {p.lead && <b>{p.lead} </b>}
      {p.text}
    </p>
  );
}

function Table({ t, n }: { t: ReportTable; n: number }) {
  return (
    <>
      <p className="r-caption">
        Table {n}: {t.caption}
      </p>
      <table className="r-table">
        <thead>
          <tr>
            {t.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Gap({ text, thin }: { text?: string; thin?: boolean }) {
  return (
    <div className={`gap${thin ? " gap-thin" : ""}`} role="note">
      <span className="gap-label">{thin ? "Thin" : "Missing"}</span>
      {text || "Your notes didn't cover this section. Say a few lines about it and revise."}
    </div>
  );
}
