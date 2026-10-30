import type { Meta, Report } from "./schema";

// Sample data for /demo (placeholder company, mentor and guide names), so judges can try the whole
// flow without an API key, a microphone or a network call.

export const DEMO_META: Meta = {
  title: "Full Stack Web Development (MERN)",
  studentName: "Alisha Basa",
  regNo: "23BCE10XXX",
  degree: "BACHELOR OF TECHNOLOGY",
  branch: "COMPUTER SCIENCE AND ENGINEERING",
  school: "SCHOOL OF COMPUTING SCIENCE AND ENGINEERING",
  university: "VIT BHOPAL UNIVERSITY",
  academicYear: "2026 – 2027",
  organisation: "XYZ Technologies Pvt. Ltd.",
  duration: "18th May, 2026 to 5th June, 2026",
  guideName: "Dr. PQR",
  guideDept: "SCOPE",
};

export const DEMO_NOTES = `okay so week one, this was XYZ, the full stack internship, 18th May was the Monday we started. First day was just onboarding and um setting up Node 20 and VS Code and git, and our mentor is ABC, Mr. ABC, he's a senior dev there. Tuesday was JavaScript refresher, closures, promises, async await. Wednesday React basics, components, props, state, and in the evening lab we made a counter app and a todo app. Thursday was React hooks, useEffect, and the lab was fetching from a public API. Friday Express and Node, REST basics, lab we made a small notes API with Express. Saturday was MongoDB and Mongoose, lab was connecting the notes API to MongoDB Atlas. Sunday off.

week two, 25th May Monday, authentication, JWT, bcrypt, the lab was login and signup for the notes app. Tuesday 26th, so this is when we got the project, the project is CampusEats, it's a canteen pre-order app for a college, students order and pick up without standing in the queue. Wednesday we designed the schema, users, menu items, orders, and the order status goes placed, preparing, ready, collected. Thursday 28th built the menu and order APIs in Express. Friday 29th, React frontend for the menu and the cart. Saturday 30th, no wait, Saturday was a half day, we did a code review with ABC and he made us split the order controller because it was 400 lines.

week three, 1st June Monday, we added Redis caching for the menu endpoint because the menu was being fetched on every page load. Tuesday 2nd June, GitHub Actions, CI that runs the Jest tests and lint on every push. Wednesday deployed backend on Render and frontend on Vercel, and the Atlas connection string was in the env variables not in the code. Thursday 4th load testing with k6, and the problem was the orders endpoint was slow under 200 users because there was no index on the status field, we added an index. Friday 5th June final demo to the XYZ team and submitted the repo, github.com/xyz/campuseats.

Challenges, CORS errors when the frontend on Vercel called the Render backend, fixed by setting the allowed origin. Also the Render free instance sleeps so first request took like 40 seconds, we added a note in the README and a health ping. Skills, React, Express, MongoDB, JWT, Redis, CI with GitHub Actions, and also I learnt to read other people's code during review. My guide is Dr. PQR.`;

export const DEMO_REPORT: Report = {
  acknowledgement: [
    "First, I would like to thank XYZ Technologies Pvt. Ltd. for the opportunity to undergo the Full Stack Web Development (MERN) internship, and for the structured sessions, labs and project work that made the three weeks productive.",
    "I thank my mentor, Mr. ABC, Senior Developer at XYZ Technologies, who guided the daily sessions, reviewed my code and pushed me to write cleaner, smaller modules.",
    "I would like to thank my College Internship Guide, Dr. PQR, for the support and advice given in completing the internship and this report.",
    "I am extremely grateful to my department staff members, family and friends who helped me in the successful completion of this internship.",
  ],
  executiveSummary: {
    company:
      "The internship was offered by XYZ Technologies Pvt. Ltd. and ran for three weeks, from 18 May to 5 June 2026, under the guidance of a senior developer as mentor.",
    problem:
      "College canteens serve hundreds of students in short breaks, so queues are long and food is often not ready when students arrive. Web applications that take orders in advance and show their status can remove most of this waiting.",
    methodology:
      "Daily concept sessions on JavaScript, React, Node.js, Express and MongoDB ran alongside evening labs in which each concept was applied immediately. From the second week the work moved to a full project, with a code review, automated testing, deployment and load testing.",
    findings:
      "The final project, CampusEats, is a canteen pre-order application built on the MERN stack with JWT authentication, Redis caching for the menu and an order status flow (placed, preparing, ready, collected). It was tested in GitHub Actions, deployed on Render and Vercel and load-tested with k6. The main finding was that performance problems came from the data layer: an index on the order status field fixed the slow orders endpoint under 200 concurrent users.",
    benefits:
      "The report documents a complete, deployed full-stack project with its repository, so juniors can follow the same path from a first API to a tested, deployed application.",
  },
  learningObjectives: [
    "To strengthen modern JavaScript, including closures, promises and async/await.",
    "To build component-based user interfaces with React and React hooks.",
    "To design and build REST APIs with Node.js and Express.",
    "To model data with MongoDB and Mongoose and host it on MongoDB Atlas.",
    "To implement authentication with JWT and password hashing with bcrypt.",
    "To improve performance with Redis caching and database indexing.",
    "To set up continuous integration with GitHub Actions and Jest.",
    "To deploy a full-stack application to Render and Vercel and load-test it with k6.",
  ],
  weeks: [
    {
      days: [
        { date: "18/05/2026", day: "Mon", topic: "Onboarding; setting up Node.js 20, VS Code and Git", lab: "" },
        { date: "19/05/2026", day: "Tue", topic: "JavaScript refresher – closures, promises, async/await", lab: "" },
        { date: "20/05/2026", day: "Wed", topic: "React basics – components, props and state", lab: "Counter and to-do applications" },
        { date: "21/05/2026", day: "Thu", topic: "React hooks – useState and useEffect", lab: "Fetching data from a public API" },
        { date: "22/05/2026", day: "Fri", topic: "Node.js and Express – REST fundamentals", lab: "Notes REST API in Express" },
        { date: "23/05/2026", day: "Sat", topic: "MongoDB and Mongoose", lab: "Connecting the notes API to MongoDB Atlas" },
        { date: "24/05/2026", day: "Sun", topic: "Holiday", lab: "" },
      ],
      summary: "Environment set up, JavaScript refreshed, and React, Express and MongoDB each applied in a lab.",
    },
    {
      days: [
        { date: "25/05/2026", day: "Mon", topic: "Authentication with JWT and bcrypt", lab: "Sign-up and login for the notes application" },
        { date: "26/05/2026", day: "Tue", topic: "Project brief – CampusEats canteen pre-order application", lab: "" },
        { date: "27/05/2026", day: "Wed", topic: "Schema design – users, menu items, orders and order status", lab: "" },
        { date: "28/05/2026", day: "Thu", topic: "Menu and order APIs in Express", lab: "" },
        { date: "29/05/2026", day: "Fri", topic: "React frontend – menu and cart", lab: "" },
        { date: "30/05/2026", day: "Sat", topic: "Code review with the mentor (half day)", lab: "Order controller split into smaller modules" },
        { date: "31/05/2026", day: "Sun", topic: "Holiday", lab: "" },
      ],
      summary: "Authentication learned and the CampusEats project designed and built, ending with a code review.",
    },
    {
      days: [
        { date: "01/06/2026", day: "Mon", topic: "Redis caching for the menu endpoint", lab: "" },
        { date: "02/06/2026", day: "Tue", topic: "Continuous integration with GitHub Actions", lab: "Jest tests and lint on every push" },
        { date: "03/06/2026", day: "Wed", topic: "Deployment – backend on Render, frontend on Vercel", lab: "" },
        { date: "04/06/2026", day: "Thu", topic: "Load testing with k6", lab: "Index added on the order status field" },
        { date: "05/06/2026", day: "Fri", topic: "Final demonstration to the XYZ team; repository submitted", lab: "" },
      ],
      summary: "The project was cached, tested, deployed, load-tested and demonstrated.",
    },
  ],
  introduction: {
    paragraphs: [
      {
        lead: "",
        text: "Most software that students and businesses use every day is a web application: a user interface in the browser, an API on a server and a database behind it. The MERN stack – MongoDB, Express, React and Node.js – lets one developer build all three layers in JavaScript, which makes it a common choice for start-ups and for first full-stack projects.",
      },
      {
        lead: "About the organisation.",
        text: "XYZ Technologies Pvt. Ltd. builds web applications for clients and ran this internship with daily sessions, evening labs and a mentored project. The mentor, Mr. ABC, is a senior developer at the company.",
      },
      {
        lead: "Need for full-stack development.",
        text: "A feature is only useful when every layer works together: the screen, the API, the data and the deployment. Developers who understand only one layer hand problems to each other; a full-stack developer can follow a slow page down to a missing database index. Chapter 2 describes what was learned and built, Chapter 3 concludes and Chapter 4 lists the references.",
      },
    ],
    glanceTable: {
      caption: "Internship programme at a glance",
      headers: ["Item", "Details"],
      rows: [
        ["Duration", "18 May – 5 June 2026 (three weeks)"],
        ["Mentor", "Mr. ABC, Senior Developer"],
        ["Concept track", "JavaScript, React, Node.js, Express, MongoDB, authentication"],
        ["Final project", "CampusEats – canteen pre-order application"],
        ["Repository", "github.com/xyz/campuseats"],
      ],
    },
  },
  discussion: [
    {
      title: "Objectives Achieved and Concepts Learned",
      table: {
        caption: "How the internship objectives were achieved",
        headers: ["Objective area", "How it was achieved"],
        rows: [
          ["JavaScript and React", "Daily sessions; counter, to-do and API-fetch labs; CampusEats frontend"],
          ["Express and MongoDB", "Notes API lab connected to MongoDB Atlas; CampusEats APIs"],
          ["Authentication", "JWT and bcrypt lab; login and sign-up in the project"],
          ["Performance", "Redis cache for the menu; index on the order status field"],
          ["CI and deployment", "GitHub Actions with Jest; Render and Vercel deployment"],
        ],
      },
      paragraphs: [
        {
          lead: "React.",
          text: "Interfaces were built from components that receive props and hold state. Hooks such as useEffect were used to load data from an API when a component appears.",
        },
        {
          lead: "Express and MongoDB.",
          text: "Express routes handle HTTP requests and return JSON. Mongoose models define the shape of documents in MongoDB, which was hosted on MongoDB Atlas.",
        },
      ],
      code: "",
      codeCaption: "",
    },
    {
      title: "Final Project: CampusEats",
      table: {
        caption: "Architecture of the final project",
        headers: ["Layer", "Tools", "Role"],
        rows: [
          ["Frontend", "React, deployed on Vercel", "Menu, cart and order status screens"],
          ["API", "Node.js, Express, JWT", "Menu and order endpoints; login and sign-up"],
          ["Data", "MongoDB Atlas, Mongoose", "Users, menu items and orders"],
          ["Cache", "Redis", "Caches the menu endpoint"],
          ["CI", "GitHub Actions, Jest", "Tests and lint on every push"],
          ["Hosting", "Render", "Runs the backend; connection string in environment variables"],
        ],
      },
      paragraphs: [
        {
          lead: "Goal.",
          text: "Let students order from the college canteen in advance and collect their food without standing in the queue.",
        },
        {
          lead: "Design.",
          text: "The schema has three collections: users, menu items and orders. Each order moves through four states – placed, preparing, ready and collected – so a student can see when the food is ready.",
        },
        {
          lead: "Review and refactoring.",
          text: "In the mentor's code review, the order controller had grown to 400 lines; it was split into smaller modules so that each handled one responsibility.",
        },
        {
          lead: "Verification.",
          text: "The menu was cached in Redis because it was being fetched on every page load. A k6 load test showed that the orders endpoint slowed down under 200 concurrent users because the status field had no index; an index was added. The application was demonstrated to the XYZ team on 5 June 2026.",
        },
      ],
      code: "",
      codeCaption: "",
    },
    {
      title: "Results, Skills and Challenges",
      table: {
        caption: "Challenges and solutions",
        headers: ["Challenge", "How it was addressed"],
        rows: [
          ["CORS errors when the Vercel frontend called the Render backend", "Set the allowed origin on the backend"],
          ["Render's free instance sleeps; the first request took about 40 seconds", "Added a health ping and a note in the README"],
          ["Slow orders endpoint under 200 concurrent users", "Added an index on the order status field"],
          ["Order controller grew to 400 lines", "Split into smaller modules after code review"],
        ],
      },
      paragraphs: [
        {
          lead: "Skills learned.",
          text: "Technical: React, Express, MongoDB, JWT authentication, Redis caching, Jest and continuous integration with GitHub Actions, and deployment on Render and Vercel. Professional: reading and improving other people's code during review.",
        },
      ],
      code: "",
      codeCaption: "",
    },
  ],
  conclusion: [
    "The three-week Full Stack Web Development internship at XYZ Technologies covered every layer of a web application, from React components to Express APIs, MongoDB data, caching, testing and deployment. The concept sessions were applied the same evening in labs, and the final project, CampusEats, brought them together into a deployed application that was load-tested and demonstrated to the company.",
    "The main lesson is that a working feature depends on all layers at once: the slowest part of CampusEats was not the code but a missing database index. As future work, the application can add payments, notifications when an order is ready and a dashboard for canteen staff.",
  ],
  bibliography: [
    "React documentation, https://react.dev, 2026.",
    "Express documentation, https://expressjs.com, 2026.",
    "MongoDB and Mongoose documentation, 2026.",
    "A. Basa, CampusEats – canteen pre-order application. https://github.com/xyz/campuseats",
  ],
  gaps: [
    {
      section: "Acknowledgement",
      whatToSay: "Your notes don't name the Dean or the Program Chair. Say their names if your department expects them to be thanked.",
    },
    {
      section: "Results, Skills and Challenges",
      whatToSay: "No marks or certificate details were mentioned. Say your score or grade and when the certificate was issued.",
    },
    {
      section: "Bibliography",
      whatToSay: "Only documentation and your repository are cited. Mention any book or course material you used.",
    },
  ],
  vivaQuestions: [
    "Why did you cache the menu endpoint in Redis but not the orders endpoint?",
    "How does a JWT prove who the user is, and where did you store it on the client?",
    "What would happen to an order if two staff members changed its status at the same time?",
    "Why did the missing index on the status field slow down the orders endpoint under load?",
    "What does your GitHub Actions workflow run, and what happens when a test fails?",
    "How did you fix the CORS error, and why does the browser enforce CORS at all?",
    "Why is the Atlas connection string kept in environment variables?",
  ],
};

export const DEMO_REVISION =
  "Shorten the conclusion to one paragraph, and in the project section mention that the Redis cache brought the menu API down from about 900 milliseconds to 120.";

// What a revision for DEMO_REVISION returns: only the conclusion and the project section change.
export function demoRevised(r: Report): Report {
  const next: Report = structuredClone(r);
  next.conclusion = [
    "The three-week internship at XYZ Technologies covered every layer of a web application, and the final project, CampusEats, brought them together into a deployed, load-tested canteen pre-order application. The main lesson is that a working feature depends on all layers at once; future work includes payments, ready-for-pickup notifications and a staff dashboard.",
  ];
  const project = next.discussion[1];
  project.paragraphs[3] = {
    lead: "Verification.",
    text: "The menu was cached in Redis because it was being fetched on every page load, which brought the menu API's response time down from about 900 milliseconds to 120 milliseconds. A k6 load test showed that the orders endpoint slowed down under 200 concurrent users because the status field had no index; an index was added. The application was demonstrated to the XYZ team on 5 June 2026.",
  };
  return next;
}
