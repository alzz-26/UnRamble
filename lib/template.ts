// The department format, taken from a real VIT Bhopal internship report that was
// submitted and accepted. Two halves: the writing rules Claude follows, and the
// page measurements the Word exporter follows.

export const TEMPLATE_NAME = "VIT Bhopal — Internship Report (SCSE)";

export const TEMPLATE_SPEC = `
DEPARTMENT FORMAT: VIT Bhopal University, School of Computing Science and Engineering — Internship Report.

Order of the document (the cover, certificate and certification pages are generated from the student's details, you do not write them):
1. ACKNOWLEDGEMENT — 4 to 5 short justified paragraphs. Thank, in this order: the internship organisation and programme; the trainer or mentor by name; the Dean and Program Chair (only if named in the notes); the College Internship Guide; department staff, family and friends. First person ("I would like to thank..."). Signed by the student (the exporter adds the signature).
2. EXECUTIVE SUMMARY / ABSTRACT — exactly five paragraphs, each with a bold run-in lead:
   "The company." who offered and delivered the internship, and its duration.
   "The problem or opportunity." the industry problem the internship's subject solves.
   "Methodology." how the learning was organised: concept modules, lab sessions, assignments, project, scores.
   "Key parts and findings." the main project and the main finding.
   "Benefits to the institution." why this report is useful to the college and juniors.
3. LEARNING OBJECTIVES / INTERNSHIP OBJECTIVES — 6 to 9 numbered objectives, each starting "To ..." (e.g. "To build a Jenkins CI/CD pipeline triggered by changes in a GitHub repository.").
4. WEEKLY OVERVIEW OF INTERNSHIP ACTIVITIES — one table per week. Each row: DATE (DD/MM/YYYY), DAY (Mon, Tue, ...), NAME OF THE TOPIC/MODULE COMPLETED. A practical session on that day goes in "lab" as a short phrase (rendered in italics as "Lab: ..."). Sundays or days off are "Holiday". After each week, a one-sentence "Summary:" of that week. Include only days the notes give you evidence for.
5. 1. INTRODUCTION — opening paragraph on why the subject matters; a paragraph with lead "About the organisation."; an "at a glance" table (Item | Details: Duration, tracks, graded work, final project, repository); a paragraph with lead "Need for <subject>." describing the problem the subject solves; end by saying what Chapters 2, 3 and 4 contain.
6. 2. INTERNSHIP DISCUSSION — numbered subsections 2.1, 2.2, ...:
   2.1 Objectives Achieved and Concepts Learned (a table Objective area | How it was achieved, then concept paragraphs with bold leads);
   then one subsection per lab block, assignment and the final project (Goal / architecture table / pipeline or method / Verification);
   last: Results, Skills and Challenges (marks table if marks are given, "Observations.", "Skills learned.", and a Challenge | How it was addressed table).
7. 3. CONCLUSION — 2 paragraphs: what was achieved overall; the main lesson and future work.
8. 4. BIBLIOGRAPHY — numbered references, IEEE-like: "A. Author, Title, Publisher, Year." and official documentation / course material / VTOP record / the student's repository.

Style of the department:
- Formal, past tense, third person in the body ("A Maven project was created..."), first person only in the Acknowledgement.
- Concrete over generic: tool names, versions, ports, commands, numbers and results exactly as the student said them.
- Short paragraphs (3–6 sentences). Tables are captioned "Table N: ..." (the exporter numbers them; give only the caption text).
- Indian/British spelling (organisation, containerise, programme).
`.trim();

// Page and type measurements, read out of the submitted .docx.
export const FORMAT = {
  font: "Times New Roman",
  bodySize: 24, // half-points: 12 pt
  h1Size: 32, // 16 pt, bold, centred
  h2Size: 28, // 14 pt, bold, left
  tableTextSize: 20, // 10 pt
  weeklySummarySize: 21, // 10.5 pt
  lineSpacing: 276, // 1.15
  spacingAfter: 200,
  page: { width: 12240, height: 15840 }, // US Letter, in twips
  margin: { top: 1440, right: 1440, bottom: 1440, left: 2160 }, // 1", 1", 1", 1.5"
  tableHeaderFill: "D9E2F3",
};
