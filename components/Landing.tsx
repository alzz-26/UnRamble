import Link from "next/link";
import Logo from "./Logo";

// A spoken-sounding waveform: louder in the middle, where the actual facts are.
const WAVE = [8, 14, 22, 30, 18, 40, 52, 34, 20, 12, 26, 44, 60, 48, 30, 16, 10, 24, 38, 56, 64, 46, 28, 14, 20, 36, 50, 58, 42, 26, 12, 8, 16, 30, 44, 62, 54, 36, 22, 14, 10, 22, 34, 48, 40, 28, 18, 12, 20, 32, 46, 56, 38, 24, 14, 8, 12, 18, 26, 20, 14, 10, 8, 6];

const STEPS = [
  ["01 · Talk", "A minute a day", "Dictate today's work into your project's log. Out of order is fine. Corrections are fine. “No wait, port 8081” is fine."],
  ["02 · Agent", "Edits, not rewrites", "The agent reads only what's new, patches the sections it affects, checks its own work, and logs every change in plain English."],
  ["03 · Done", "A .docx that passes", "Cover page, certificate, roman numerals, weekly tables, captions. The boring 80% of the report, already right."],
];

const PERKS = [
  ["It asks what you forgot", "“What score did you get?” Answer out loud and the gap closes."],
  ["It won't invent your marks", "No data, no number. You get a marker instead of a fabrication."],
  ["It remembers every version", "Undo is a list, not a prayer."],
  ["Fix it by talking", "“Make the methodology shorter.” Done. Nothing else moved."],
  ["Viva warm-up", "Likely examiner questions about your own work, ready to rehearse."],
  ["Your format, learned", "Upload last semester's .docx. It copies headings, font, margins."],
];

const FORMATS = [
  ["Preset", "Internship report", "The full college layout, weekly tables included."],
  ["Preset", "Lab record", "Aim to conclusion, one experiment at a time."],
  ["Preset", "Progress report", "For capstone check-ins and guide meetings."],
];

const FAQ = [
  ["Account?", "None. Projects live in your browser; export a file to move them."],
  ["Which AI?", "Gemini on the free tier. The demo needs no key."],
  ["Does it hallucinate?", "It's instructed not to, and it flags missing facts instead. Read before you submit."],
  ["Do I have to talk?", "Typing works. Talking is just faster, and that's the whole point."],
];

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-wrap lp-nav">
        <Link href="/" className="brand" aria-label="Unramble home">
          <Logo />
          <span className="brand-name">unramble</span>
        </Link>
        <nav aria-label="Main" className="lp-links">
          <a href="#how">How it works</a>
          <a href="#formats">Formats</a>
          <a href="#faq">FAQ</a>
          <Link href="/demo">Demo</Link>
          <Link href="/projects" className="nav-cta">
            My projects
          </Link>
        </nav>
      </header>

      <section className="lp-wrap lp-hero">
        <p className="lp-rec">
          <span className="lp-rec-dot" aria-hidden="true" />
          REC · hold your Wispr key
        </p>
        <h1>
          Ramble all week.
          <br />
          <span className="lp-mark">Submit on Friday.</span>
        </h1>
        <p className="lp-lede">
          Talk like you would to a friend who asked “so what did you actually do?” Unramble hears the facts, drops the
          filler, and files everything into your department&apos;s report format.
        </p>
        <div className="lp-ctas">
          <Link href="/demo" className="lp-btn lp-btn-main">
            Try the demo
          </Link>
          <Link href="/projects" className="lp-btn">
            Start a project
          </Link>
        </div>
        <p className="lp-small">Free · no sign-up · your notes stay in your browser</p>
      </section>

      <section className="lp-wrap lp-studio">
        <div className="lp-wave" aria-hidden="true">
          {WAVE.map((h, i) => (
            <span key={i} style={{ height: h }} className={i > 18 && i < 44 ? "on" : ""} />
          ))}
        </div>
        <div className="lp-compare">
          <div className="lp-said">
            <p className="lp-label">YOU SAID · THU 04 JUN</p>
            <p>
              <s>um okay so</s> load testing with k6, <s>and the the</s> orders endpoint was slow under 200 users{" "}
              <s>because like</s> there was no index on status, <s>no wait</s> we added one
            </p>
          </div>
          <div className="lp-paper">
            <p className="lp-label">IN YOUR REPORT · 2.5 VERIFICATION</p>
            <p>
              A k6 load test showed that the orders endpoint slowed down under 200 concurrent users because the status field
              had no index; an index was added.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-strip">
        <div className="lp-wrap">
          <span>Your report, minus the 2 a.m. formatting.</span>
          <span className="lp-dot">·</span>
          <span>Spoken like a student. Written like a report.</span>
          <span className="lp-dot">·</span>
          <span>Ctrl+C, Ctrl+V, Ctrl+Cry — retired.</span>
        </div>
      </section>

      <section id="how" className="lp-wrap lp-section">
        <p className="lp-label lp-accent">01 — 02 — 03</p>
        <h2>Talk. Agent. Done.</h2>
        <div className="lp-grid3">
          {STEPS.map(([tag, title, body]) => (
            <div key={tag} className="lp-card">
              <p className="lp-label">{tag.toUpperCase()}</p>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-wrap lp-grid3 lp-perks">
          {PERKS.map(([title, body]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="formats" className="lp-wrap lp-section">
        <h2>Comes in four flavours</h2>
        <div className="lp-grid4">
          {FORMATS.map(([tag, title, body]) => (
            <div key={title} className="lp-card">
              <p className="lp-label">{tag.toUpperCase()}</p>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
          <Link href="/projects" className="lp-card lp-card-lime">
            <p className="lp-label">YOURS</p>
            <h3>Bring your own →</h3>
            <p>A past .docx or a pasted list of headings.</p>
          </Link>
        </div>
      </section>

      <section id="faq" className="lp-wrap lp-section">
        <h2>Fair questions</h2>
        <div className="lp-grid2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="lp-card">
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-wrap lp-final">
        <h2>
          Less typing.
          <br />
          <span className="lp-mark">More submitting.</span>
        </h2>
        <div className="lp-ctas">
          <Link href="/demo" className="lp-btn lp-btn-main">
            Try the demo
          </Link>
          <Link href="/projects" className="lp-btn">
            Start a project
          </Link>
          <Link href="/quick" className="lp-btn lp-btn-text">
            Quick one-off report
          </Link>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">
          <span>Built by voice with Wispr Flow · No Hands challenge</span>
          <a href="https://github.com/alzz-26/UnRamble">github.com/alzz-26/UnRamble</a>
        </div>
      </footer>
    </div>
  );
}
