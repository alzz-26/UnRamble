"use client";

import { useEffect, useState } from "react";

// A running clock for live AI calls. Gemini's free tier takes a minute or two
// for a full report, and a ticking clock makes that wait feel like progress.
export default function Elapsed() {
  const [start] = useState(() => Date.now());
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [start]);
  const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <span className="elapsed">
      {clock} · {s < 150 ? "usually 1–2 min" : "taking longer than usual, still working"}
    </span>
  );
}
