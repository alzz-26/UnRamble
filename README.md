# Unramble

**Ramble all week. Submit on Friday.** One place for every report you owe. Speak messy notes each day; an agent keeps the report in your department's exact format up to date, and you download it as a Word file.

Built for **No Hands: The Wispr Challenge** (Builders track).

- **Try it without a key:** `/demo` (sample notes, a saved report, a saved revision)
- **Quick report:** `/`: paste or dictate notes, pick a format, generate. No setup.
- **My projects:** `/projects`: one project per report (internship, lab course, capstone), each with its own format, a dated daily log, every version, and an agent that updates only what your new notes change. "Add a sample project" shows it with no typing.
- Needs a free `GEMINI_API_KEY` on the server for live generation.

## The workspace

| Feature | What it does |
| --- | --- |
| Formats | VIT internship report (full layout), lab experiment record, project progress report, or **your own: upload a past .docx** and its headings, font and margins become the format |
| Daily log | Dictate what you did today with Wispr; each note is dated and kept. New notes are marked until the report has them |
| Agent update | Reads only the new notes and the current report, decides which sections to edit, and returns just those edits. The server checks them against the format and sends the agent back once if they don't fit |
| Fill gaps | The agent's open questions ("What score did you get?"). Answer by voice and it patches the report |
| Fix it by talking | "Shorten the conclusion": only that part changes |
| Versions | Every generate, update and fix is a version with a plain-English change log. View any version, restore it, or download it |
| Storage | In this browser, behind one module (`lib/store.ts`), with Export/Import of a project file. Accounts, per-user privacy and sync are the next step |

## The problem

Every VIT Bhopal internship report follows a fixed format: cover, certificate, acknowledgement, a five-part executive summary, learning objectives, a day-by-day weekly overview table, then Introduction, Internship Discussion, Conclusion and Bibliography, all in Times New Roman with a 1.5" left margin and roman page numbers on the front matter. Remembering what you did takes ten minutes. Turning it into formal prose in someone else's template takes hours.

## How it works

1. **Talk.** Hold the Wispr Flow key and say what you did, in any order. Use **+ Today's date** to keep a running daily log, which becomes the weekly table.
2. **Generate.** The notes and the template spec go to a server route. Gemini sorts each fact into its section and writes it in the department's style. It never invents marks, dates or names: anything missing is left empty and flagged.
3. **Read.** The preview is laid out like the real document. Amber markers show what your notes didn't cover.
4. **Fix it by talking.** Say "shorten the conclusion and mention the cache cut response time to 120 ms". Only those sections change, and they're highlighted.
5. **Download** a `.docx` that matches the template: Letter page, 1"/1.5" margins, Times New Roman 12 pt, centred 16 pt headings, roman then arabic page numbers, an index whose page numbers Word fills in, captioned tables with shaded header rows. Optionally attach your certificate image.

There's also a **likely viva questions** list under the preview, for practising out loud.

## Run locally

```bash
npm install
cp .env.example .env.local   # then add your GEMINI_API_KEY (free from aistudio.google.com)
npm run dev
```

## Deploy (Vercel)

Import the repository, add `GEMINI_API_KEY` under Environment Variables, and deploy. `/demo` works even if the key is missing or the quota runs out.

## Files

| File | What it does |
| --- | --- |
| `lib/template.ts` | The department format: writing rules for the model and page measurements for the exporter, taken from a real submitted report |
| `lib/schema.ts` | The report as structured data (Zod), so revisions touch one section and gaps can be flagged |
| `app/api/generate/route.ts` | Server route: generate or revise with Gemini (free tier: `gemini-flash-latest`, then `gemini-3.8-flash`, `gemini-3.6-flash` and `gemini-flash-lite-latest` as backups if a quota runs out), using a JSON schema for the output |
| `components/Builder.tsx` | Notes box, preview, revision box, export |
| `lib/exportDocx.ts` | Builds the Word file with the `docx` package |
| `lib/demoData.ts` | Demo notes, report and revision |
| `lib/store.ts` | Projects, daily log entries and versions (browser storage, swappable for a database) |
| `lib/formats.ts` | Format presets and the spec text the agent follows |
| `lib/client.ts` | API calls, Word download, reading a past .docx into a format |
| `components/ProjectsHome.tsx`, `components/ProjectWorkspace.tsx` | The projects list and the per-project workspace |

## Roadmap

- Accounts with per-user privacy, and sync across devices
- Reminders to log the day's work
- Shared formats for a whole class or department
