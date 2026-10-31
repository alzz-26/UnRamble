# Unramble

**Ramble all week. Submit on Friday.**

Live: **https://un-ramble-ten.vercel.app**

---

## The problem, as my own story

I am pursuing a four-year B.Tech in Computer Science, and I will be graduating in 2027. Since 2023 we have been assigned multiple lab records, project reports, internship reports and so on.

Every time, to be honest, my habit was the same: try to remember everything at the end, on the last day of submission. I would recall what I had done over the past three or four weeks, give it to Claude or something similar, and try to make the report in the given format.

It takes a lot of time, and more time goes into correcting the format: small gaps, heading changes, font changes, colour issues. All of this together takes up hours, and in the meantime the work I had actually done gets lost somewhere.

So I thought: what if there was a website where I could log my progress every day, and get my report done gradually instead of doing it all at the last moment?

## Unramble, the solution

With Unramble I log my progress each day, or over any period, as small notes. Using Wispr, I just talk: the daily work I did, small checkpoints, whatever I like. Even a small installation script counts.

While I do that, I can see how my progress looks in the fully prepared report, in the format given by my department. An agent works in the background: it **updates only the sections that changed** instead of regenerating the whole report or record. I can ask for edits by speaking, and at the end I download it as a **Word file in my department's format**.

It also helps me stay systematic, and note down the smaller things I worked on each day as part of the curriculum.

## Features

- [x] **Three preset formats** (internship report, lab record, progress report), plus **your own custom format** read from a past `.docx` or a pasted list of headings
- [x] **Projects**: each project has its own format, notes, cover details and versions, so nothing gets mixed. Projects can be exported and imported as a `.unramble.json` file
- [x] **Daily reminders** at a time that suits you: add them to **Google Calendar**, or download an **.ics** file for your phone or desktop calendar. A streak and a "not logged today" nudge keep you going
- [x] **Versions** of every generated report: view or restore any older one, and the sections the agent changed are highlighted
- [x] **Fix it by talking**: say what to change ("shorten the conclusion") and only that part is edited
- [x] **Gap questions**: missing information is marked in the report instead of being made up, and you can answer the questions by voice
- [x] **Possible viva questions** about your own work
- [x] **Word export** with cover page, logo, certificate page, roman page numbers, index and weekly tables

> **Note:** for now, everything is saved in your browser's storage. If you clear the browser history, cache or cookies, your projects may be lost. Use **Export** on a project to keep a backup.

## Why not just use ChatGPT or Claude?

- It keeps a **dated log over weeks**, instead of relying on your memory at the end.
- It **edits instead of rewriting** everything, and keeps every version.
- It **asks about the gaps** instead of making up marks or books.
- The **exact format is saved once** and reused every time.

## Use of Wispr Flow

This entire tool was built with Claude Code, and the prompts were given using Wispr Flow, holding down my own configured shortcut keys.

The tool itself is designed mainly for voice input. Wispr Flow helped in many ways. The most amazing thing I noticed is how nicely it handles corrections: whenever I spoke unnaturally, repeated myself or corrected myself mid-sentence, it dropped the parts that weren't needed and wrote only what I meant.

It is quite fast compared with the other voice input tools available, and it works well in the mobile app too. I have used it quite a bit.

## Tech stack

1. **Next.js 15** with React 19 and TypeScript
2. **Gemini API (free tier)** through `@google/genai`, with JSON-schema output validated by Zod, and several backup models
3. **docx** for building the Word file in the browser, and **JSZip** for reading a custom format from a `.docx`
4. **Browser localStorage** for projects (no login)
5. Hosted on **Vercel**

## How to try it

There are three things you can try on the website:

1. **Demo** (`/demo`): a ready-made description is already filled in. Just click **Generate report**, and the report appears straight away. This mode makes no API calls.
2. **Quick report** (`/quick`): a one-time complete report. Give the full description of your project or lab, choose a preset format or enter your own, and get the full report. You can customise the cover page, your university's logo and so on.
3. **My projects** (`/projects`): separate projects for separate works, each with its daily log, versions, its own format and its own details. Open the **sample project** and press **Update report** to watch the agent add one new note.

Quick report and My projects use live API calls.

### Run it locally

```bash
git clone https://github.com/alzz-26/UnRamble.git
cd UnRamble
npm install
```

Create a file named `.env.local` in the project folder with your own Gemini key (free from Google AI Studio):

```
GEMINI_API_KEY=your-key-here
```

Then start it and open http://localhost:3000:

```bash
npm run dev
```

## Known limitations

- The main one right now is the **free-tier Gemini API key**. While testing, the API often reported high demand for some models. The website falls back to several backup models, but generation may still fail sometimes.
- A request can occasionally run past the **5-minute limit** of Vercel's free hosting during heavy usage. Reloading and trying again usually works.
- If the free quota runs out, the live site stops generating until it resets. In that case, contact me and I will set up a new API key so you can try the website.

## Future scope

1. Sign in and sync across devices
2. Connecting Google Calendar directly
3. Pulling in GitHub commits automatically
4. A whole class sharing one department format
5. A mobile app for easier daily logging

---

Made for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow) by Alisha Basa.

> 🎙️ **About this README:** I spoke it with Wispr Flow, then Claude tidied the grammar and formatting and corrected a few technical details. The story and the points are my own words.
