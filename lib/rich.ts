// Small bits of formatting the model can use inside plain text, read the same
// way by the on-screen preview and the Word exporter so the two always match.

// "[Insert screenshot: output of git stash]" on its own becomes an empty box to paste into.
const SHOT = /^\s*\[\s*(?:insert\s+)?((?:screenshot|image|figure|output|photo|diagram)\b[^\]]*)\]\s*$/i;

export function shotLabel(text: string): string | null {
  const m = text.match(SHOT);
  return m ? m[1].replace(/^(\w)/, (c) => c.toUpperCase()) : null;
}

// `git push` in backticks is set in a code font.
export function codeSpans(text: string): { text: string; code: boolean }[] {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((t) => (t.startsWith("`") && t.endsWith("`") && t.length > 2 ? { text: t.slice(1, -1), code: true } : { text: t, code: false }));
}
