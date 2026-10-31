import { codeSpans, shotLabel } from "@/lib/rich";
import type { ReportPara } from "@/lib/schema";

// The preview's side of lib/rich.ts: the Word exporter draws the same things.

export function RichText({ text }: { text: string }) {
  return (
    <>
      {codeSpans(text).map((s, i) => (s.code ? <code key={i} className="r-icode">{s.text}</code> : <span key={i}>{s.text}</span>))}
    </>
  );
}

export function ShotBox({ label }: { label: string }) {
  return <div className="r-shot">{label}</div>;
}

export function RichPara({ p }: { p: ReportPara }) {
  const shot = p.lead ? null : shotLabel(p.text);
  if (shot) return <ShotBox label={shot} />;
  return (
    <p>
      {p.lead && <b>{p.lead} </b>}
      <RichText text={p.text} />
    </p>
  );
}

// Numbered steps; a screenshot placeholder between them is a box and takes no number.
export function RichList({ items }: { items: string[] }) {
  let n = 0;
  return (
    <ol>
      {items.map((t, i) => {
        const shot = shotLabel(t);
        if (shot)
          return (
            <li key={i} className="r-shot-li">
              <ShotBox label={shot} />
            </li>
          );
        n++;
        return (
          <li key={i} value={n}>
            <RichText text={t} />
          </li>
        );
      })}
    </ol>
  );
}
