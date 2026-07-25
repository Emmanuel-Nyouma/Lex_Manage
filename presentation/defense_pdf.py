# -*- coding: utf-8 -*-
"""
LexManage — B.Tech Defense Preparation Guide (PDF)
Generates a NotebookLM-ready document: speaking script, stack rationale,
and an extensive jury Q&A (security + African law-firm focus).
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, HRFlowable, ListFlowable, ListItem)
from reportlab.platypus.tableofcontents import TableOfContents

# ── Brand palette ─────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#0E1B3A")
NAVY2  = colors.HexColor("#16264F")
AMBER  = colors.HexColor("#B45309")
AMBERL = colors.HexColor("#F59E0B")
INK    = colors.HexColor("#0F172A")
SLATE  = colors.HexColor("#334155")
SLATEL = colors.HexColor("#64748B")
ICE    = colors.HexColor("#E2E8F0")
SOFT   = colors.HexColor("#F1F5F9")
SOFT2  = colors.HexColor("#F8FAFC")
GREEN  = colors.HexColor("#0E7A53")

styles = getSampleStyleSheet()

def S(name, **kw):
    base = kw.pop("parent", styles["Normal"])
    return ParagraphStyle(name, parent=base, **kw)

H0    = S("H0", fontName="Helvetica-Bold", fontSize=30, textColor=NAVY, leading=34, spaceAfter=6)
SUB   = S("SUB", fontName="Helvetica", fontSize=13, textColor=AMBER, leading=17, spaceAfter=2)
H1    = S("H1", fontName="Helvetica-Bold", fontSize=18, textColor=colors.white, leading=22,
          spaceBefore=6, spaceAfter=10, backColor=NAVY, borderPadding=(7,8,7,8))
H2    = S("H2", fontName="Helvetica-Bold", fontSize=13.5, textColor=NAVY, leading=17,
          spaceBefore=12, spaceAfter=5)
H3    = S("H3", fontName="Helvetica-Bold", fontSize=11.5, textColor=AMBER, leading=15,
          spaceBefore=8, spaceAfter=3)
BODY  = S("BODY", fontName="Helvetica", fontSize=10.5, textColor=SLATE, leading=15.5,
          alignment=TA_JUSTIFY, spaceAfter=6)
SCRIPT= S("SCRIPT", fontName="Helvetica", fontSize=10.5, textColor=INK, leading=16,
          alignment=TA_JUSTIFY, spaceAfter=6, leftIndent=10, borderColor=ICE)
Q     = S("Q", fontName="Helvetica-Bold", fontSize=10.8, textColor=NAVY, leading=14.5,
          spaceBefore=9, spaceAfter=2)
A     = S("A", fontName="Helvetica", fontSize=10.3, textColor=SLATE, leading=15,
          alignment=TA_JUSTIFY, spaceAfter=4, leftIndent=4)
BULLET= S("BULLET", fontName="Helvetica", fontSize=10.3, textColor=SLATE, leading=14.5)
SMALL = S("SMALL", fontName="Helvetica-Oblique", fontSize=9, textColor=SLATEL, leading=12)
WHITEC= S("WHITEC", fontName="Helvetica", fontSize=11, textColor=colors.white, leading=16, alignment=TA_CENTER)
WHITEB= S("WHITEB", fontName="Helvetica-Bold", fontSize=40, textColor=colors.white, leading=44, alignment=TA_CENTER)

story = []

def hr(c=ICE, w=1.2, sb=4, sa=8):
    story.append(HRFlowable(width="100%", thickness=w, color=c, spaceBefore=sb, spaceAfter=sa))

def para(txt, st=BODY): story.append(Paragraph(txt, st))
def sp(h=6): story.append(Spacer(1, h))

def bullets(items, st=BULLET):
    story.append(ListFlowable(
        [ListItem(Paragraph(t, st), leftIndent=12, value="•") for t in items],
        bulletType="bullet", bulletColor=AMBER, bulletFontSize=8, leftIndent=10, spaceAfter=6))

def section_banner(txt):
    story.append(Paragraph(txt, H1))
    sp(4)

def qa(q, a):
    story.append(Paragraph("Q.&nbsp;&nbsp;" + q, Q))
    if isinstance(a, list):
        for part in a:
            story.append(Paragraph(part, A))
    else:
        story.append(Paragraph("A.&nbsp;&nbsp;" + a, A))

# ══════════════════════════════════════════════════════════════════════════
# COVER
# ══════════════════════════════════════════════════════════════════════════
cover = Table([[Paragraph("LexManage", WHITEB)],
               [Paragraph("B.Tech Project Defense — Preparation Guide", WHITEC)],
               [Spacer(1,6)],
               [Paragraph("Speaking Script &bull; Technology Rationale &bull; Jury Questions &amp; Answers", WHITEC)]],
              colWidths=[16.0*cm])
cover.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1),NAVY),
    ("TOPPADDING",(0,0),(-1,-1),26),("BOTTOMPADDING",(0,0),(-1,-1),26),
    ("LEFTPADDING",(0,0),(-1,-1),18),("RIGHTPADDING",(0,0),(-1,-1),18),
    ("BOX",(0,0),(-1,-1),0,NAVY),
]))
story.append(Spacer(1, 3.2*cm))
story.append(cover)
sp(18)
para("A multi-tenant SaaS legal-management platform with AI-powered legal research, "
     "built with React and NestJS and deployed on a fully free cloud stack.", S("COVERP", parent=BODY, alignment=TA_CENTER, textColor=SLATE, fontSize=11))
sp(10)
para("Prepared for upload into NotebookLM &bull; Author: Emmanuel Nyouma", S("COVERP2", parent=SMALL, alignment=TA_CENTER))
sp(26)
# How to use box
howto = Table([[Paragraph("<b>How to use this document</b>", S("hb", parent=BODY, textColor=NAVY, fontSize=11))],
               [Paragraph("1) Read Part 1 to learn what to <i>say</i> on each slide. "
                          "2) Use Part 2 to defend every technology choice. "
                          "3) Rehearse Part 3 — the jury questions — until the answers feel natural. "
                          "4) Part 4 lists smart things to add. Upload the whole file to NotebookLM and ask it to quiz you.", BODY)]],
              colWidths=[16.0*cm])
howto.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),SOFT),("BOX",(0,0),(-1,-1),0.8,ICE),
                           ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10),
                           ("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12)]))
story.append(howto)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════
# CONTENTS
# ══════════════════════════════════════════════════════════════════════════
para("Contents", H0)
hr(AMBERL, 2)
toc = [
    "Part 1 — What to Say on Each Slide (your speaking script)",
    "Part 2 — The Technology Stack and Why Each Tool Was Chosen",
    "Part 3 — Jury Questions and Answers",
    "       3.1  General &amp; Conceptual Questions",
    "       3.2  Security Questions (expect many of these)",
    "       3.3  How LexManage Solves Problems in African Law Firms",
    "       3.4  Architecture &amp; Technical Questions",
    "       3.5  Artificial Intelligence (RAG) Questions",
    "       3.6  Database, Data &amp; Performance Questions",
    "       3.7  Deployment, DevOps &amp; Reliability Questions",
    "       3.8  Testing, Limitations &amp; Future Work",
    "Part 4 — Suggested Additions &amp; Final Defense Tips",
]
for t in toc:
    para("&bull;&nbsp;&nbsp;" + t, S("toc", parent=BODY, fontSize=11, textColor=INK, spaceAfter=4))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════
# PART 1 — SPEAKING SCRIPT
# ══════════════════════════════════════════════════════════════════════════
section_banner("Part 1 — What to Say on Each Slide")
para("Below is a simple, word-by-word style script for every section of your presentation. "
     "You do not need to memorise it. Read it a few times, understand the meaning, and say it in your own words. "
     "Each block matches one slide of your PowerPoint.", BODY)
sp(4)

def slide(title, paras):
    story.append(Paragraph(title, H2))
    for p in paras:
        story.append(Paragraph(p, SCRIPT))

slide("Slide 1 — Title", [
 "“Good morning. My project is called <b>LexManage</b>. It is a software platform that helps a law firm run its "
 "whole daily work in one secure place — managing cases, storing legal documents, keeping client records, "
 "sending reminders, and even answering legal questions using artificial intelligence. "
 "It is built as a <b>multi-tenant SaaS</b>, which means many different law firms can use the same application, "
 "but each firm’s data stays completely separate and private. My name is Emmanuel Nyouma, and I will now take you "
 "through the problem, the solution, the technology, and a live demonstration.”",
])

slide("Slide 2 — Agenda", [
 "“Here is the plan for my presentation. First I will introduce LexManage. Then I will explain the real problems "
 "that law firms face today. After that I will show the features and explain exactly which feature solves which problem. "
 "Next I will describe the methodology and all the tools I used — from writing the code to putting it online. "
 "Then we will look at the results with a live demo, and finally I will conclude.”",
])

slide("Slide 3 — Introduction: What is LexManage", [
 "“Let me explain what LexManage really is. It is an <b>enterprise-grade platform</b> — meaning it is built to "
 "professional standards — that turns the paperwork of a law firm into organised digital information. "
 "The most important idea here is the word <b>tenant</b>. A tenant is one law firm. When a firm signs up, it gets its "
 "own private space inside the system: its own lawyers, its own clients, its own cases and documents. "
 "One firm can never see another firm’s data. This separation is enforced deep inside the software, on every single request.”",
 "“On the right of this slide you can see the size of the project: it has <b>17 backend modules</b>, "
 "<b>13 database models</b>, <b>5 levels of user roles</b>, and one AI assistant that answers using the firm’s own documents. "
 "The platform also works in <b>both French and English</b>, has a dark mode, and is fully usable on a mobile phone.”",
])

slide("Slide 4 — Problem Statement", [
 "“Why did I build this? Because most small and medium law firms — especially here in Africa — still work with paper files, "
 "documents scattered across different computers and USB drives, spreadsheets, and WhatsApp or email. This creates real, "
 "daily problems.”",
 "“<b>One</b>: information about a case is fragmented — the facts, the parties, the deadlines and the history are spread "
 "everywhere, so there is no single source of truth. <b>Two</b>: documents are disorganised and insecure — they are hard to "
 "find and shared with no access control. <b>Three</b>: hearings and deadlines are tracked by hand, so critical dates are "
 "missed, and in law a missed deadline can lose a case. <b>Four</b>: legal research is slow — finding one clause across "
 "hundreds of pages takes hours. <b>Five</b>: when firms share a digital tool, there is a real danger that one firm could "
 "see another firm’s confidential data. And <b>six</b>: without roles and permissions, every user can see and change "
 "everything, which is unacceptable for confidential legal data.”",
])

slide("Slide 5 — Features Overview", [
 "“To answer those problems, LexManage has eight core features. <b>Case Management</b> tracks the full life of a case. "
 "The <b>Document Management System</b> lets you upload, categorise and secure legal files. The <b>Client Directory</b> "
 "is a mini-CRM for all clients. <b>LexAssist AI</b> answers legal questions from the firm’s own documents. "
 "The <b>Notification Center</b> sends instant, scheduled and template-based alerts. <b>Hybrid Smart Search</b> finds "
 "anything quickly with live suggestions. The <b>Calendar</b> keeps hearings and deadlines in one view. And "
 "<b>Role-Based Access Control with multi-tenancy</b> keeps each firm’s data private and gives each user only the rights "
 "they need.”",
])

slide("Slide 6 — Which Feature Solves Which Problem", [
 "“This slide is the heart of my project, because every feature was built to answer a specific problem. "
 "Fragmented information is solved by Case Management and the Calendar — one organised file per case. "
 "Disorganised documents are solved by the Document Management System, with categories, per-role access, and secure "
 "download links that expire after 15 minutes. Missed deadlines are solved by the deadline tracker and scheduled "
 "notifications that fire automatically at the right time. Slow research is solved by LexAssist AI. Privacy between firms "
 "is solved by multi-tenancy. Poor coordination is solved by real-time notifications. And the lack of access control is "
 "solved by Role-Based Access Control. Nothing in this system is decoration — each feature has a job.”",
])

slide("Slide 7 — Methodology (How It Was Built)", [
 "“I built LexManage in a structured, step-by-step way. <b>Step one</b>: I modelled the legal world as a database — "
 "13 connected tables for firms, users, cases, clients, documents, deadlines and notifications. <b>Step two</b>: I built "
 "the backend API first, one module per topic, and I validated every input. <b>Step three</b>: I built the user interface "
 "as reusable components. <b>Step four</b>: I added security everywhere — login, roles, data isolation, rate limiting. "
 "<b>Step five</b>: I tuned performance with caching and smart pagination. <b>Step six</b>: I deployed everything to the "
 "cloud with automatic updates on every code change. The key idea is that <b>security and structure came first, not last</b>.”",
])

slide("Slide 8 — End-to-End Architecture", [
 "“This is how the whole system fits together. On the left is the <b>client</b> — the part that runs in the user’s browser, "
 "built with React and served from a global content network so it loads fast. In the middle is the <b>API</b> — the brain "
 "of the system, built with NestJS, which checks who you are, what firm you belong to, and what you are allowed to do. "
 "On the right are the <b>data and services</b> — the PostgreSQL database, the Redis cache and job queue, the file storage, "
 "and the AI workflow. Everything talks over HTTPS, every request carries a secure token, and every request is filtered so "
 "a firm only ever sees its own data.”",
])

slide("Slide 9 — Frontend &amp; Backend Technology", [
 "“On the frontend I used <b>React 19 with Vite</b> for a fast, modern interface, <b>Tailwind CSS</b> for the design, "
 "<b>Zustand</b> to remember the logged-in user, and <b>React Query</b> to talk to the server smartly with caching and "
 "automatic retries. Forms are validated with <b>Zod</b> — and importantly, the same validation rules run on the server too, "
 "so there is one single source of truth for what valid data looks like.”",
 "“On the backend I used <b>NestJS</b>, a professional framework that organises code into modules. The database is "
 "<b>PostgreSQL</b>, accessed through <b>Prisma</b>, which makes the queries safe from SQL injection automatically. "
 "Logins use <b>JWT tokens</b>, passwords are protected with <b>bcrypt</b>, background jobs run on <b>BullMQ with Redis</b>, "
 "real-time updates use <b>Socket.io</b>, and the API is protected by security headers, rate limiting and strict input checks.”",
])

slide("Slide 10 — Data, Storage &amp; Security", [
 "“Let me go deeper on data and security, because for a legal app this is everything. All structured data lives in "
 "PostgreSQL. All documents are stored in S3-compatible storage, and every file is saved under a folder named after the "
 "firm’s ID, so one firm’s files can never mix with another’s. Documents can only be downloaded through <b>signed links "
 "that expire after 15 minutes</b>.”",
 "“For security: every login token is cryptographically signed and verified with a fixed algorithm, so it cannot be faked. "
 "Passwords are hashed with bcrypt, never stored as plain text. There are five user roles, and admin actions are blocked "
 "for normal users. The server uses security headers, limits how many requests a user can make to stop abuse, forces HTTPS, "
 "and only accepts requests from our official website address. Sensitive actions are written to an audit log.”",
])

slide("Slide 11 — LexAssist AI (RAG)", [
 "“This is the smartest feature. LexAssist uses a technique called <b>Retrieval-Augmented Generation</b>, or RAG. "
 "The idea is simple: instead of letting the AI invent answers, we force it to answer using the firm’s own documents. "
 "When a lawyer uploads a document, the system sends it to a workflow that reads it, breaks it into pieces, and stores those "
 "pieces in a searchable knowledge base for that firm only. When the lawyer asks a question, the system finds the most "
 "relevant pieces and asks the AI to answer using them, and it shows the sources. So the answer is grounded in real "
 "documents — it is useful, not invented. And just like the rest of the app, each firm’s knowledge base is separate.”",
])

slide("Slide 12 — Deployment, CI/CD &amp; Reliability", [
 "“Finally, deployment. The whole platform runs on a <b>completely free cloud stack</b> — no credit card needed — yet it is "
 "built like a real production system. The website is on Vercel, the API runs in a Docker container on Render, the database "
 "is on Neon, the cache and queues use Upstash Redis, documents are on Supabase storage, and the AI workflow is on n8n Cloud.”",
 "“Every time I change the code and push it, an automatic pipeline checks that it builds correctly, and then the new version "
 "deploys by itself. I also added a small scheduled task that ‘wakes up’ the free server every few minutes so it is always "
 "ready, and the app detects a weak internet connection and warns the user with a red Wi-Fi icon. This makes it reliable "
 "even on slow networks.”",
])

slide("Slide 13 &amp; 14 — Results / Demo", [
 "“Now I will show you the live, deployed application. I will register a firm, log in, create a case, upload a document, "
 "search for it, ask LexAssist a question, and send a notification — so you can see that everything I described actually works.”",
 "<i>(Tip: keep the app already ‘warmed up’ in another tab before you start, so there is no waiting.)</i>",
])

slide("Slide 15 — Conclusion", [
 "“To conclude: LexManage takes the real, everyday problems of a law firm — scattered information, lost documents, missed "
 "deadlines and slow research — and answers each one with a concrete feature. It is secure and private by design, its AI "
 "gives grounded answers from the firm’s own files, and it is fully deployed on a free, modern cloud stack. "
 "Thank you for listening. I am happy to answer your questions.”",
])
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════
# PART 2 — STACK
# ══════════════════════════════════════════════════════════════════════════
section_banner("Part 2 — The Technology Stack and Why Each Tool Was Chosen")
para("For every tool, here is what it does and — more importantly — <b>why</b> you chose it. In a defense, the jury cares "
     "less about the name and more about your reason. Always answer with a reason.", BODY)
sp(6)

def stack_table(title, rows):
    story.append(Paragraph(title, H3))
    data = [[Paragraph("<b>Technology</b>", S("th",parent=BODY,textColor=colors.white,fontSize=9.5)),
             Paragraph("<b>What it does</b>", S("th2",parent=BODY,textColor=colors.white,fontSize=9.5)),
             Paragraph("<b>Why it was chosen</b>", S("th3",parent=BODY,textColor=colors.white,fontSize=9.5))]]
    cell = S("cell", parent=BODY, fontSize=9.3, leading=12.5, spaceAfter=0, alignment=TA_LEFT)
    tech = S("tech", parent=cell, fontName="Helvetica-Bold", textColor=NAVY)
    for r in rows:
        data.append([Paragraph(r[0],tech), Paragraph(r[1],cell), Paragraph(r[2],cell)])
    t = Table(data, colWidths=[3.0*cm, 5.6*cm, 7.4*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),NAVY),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, SOFT2]),
        ("GRID",(0,0),(-1,-1),0.5,ICE),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
    ]))
    story.append(t); sp(10)

stack_table("Frontend (what the user sees)", [
 ("React 19", "Builds the user interface as small reusable pieces called components.",
  "It is the most popular UI library, it is fast, and components keep the code clean and easy to maintain."),
 ("Vite", "The build tool that compiles and serves the React app.",
  "It is extremely fast and gives instant reload while coding, which made development much quicker."),
 ("Tailwind CSS", "A styling system based on small utility classes.",
  "It let me build a consistent, professional, responsive design quickly, including dark mode, without messy CSS files."),
 ("Zustand", "Stores global state like the logged-in user and chosen language.",
  "It is very small and simple compared to alternatives, and it keeps the user logged in across browser tabs."),
 ("React Query", "Manages all data coming from the server: caching, refetching, retries.",
  "It removes a lot of manual work, makes the app feel fast through caching, and handles slow networks with retries."),
 ("React Hook Form + Zod", "Handles forms and checks that input is valid.",
  "Zod lets me use the SAME validation rules on the frontend and backend — one single source of truth for correct data."),
 ("React Router", "Moves between pages without reloading.",
  "It gives a smooth single-page-app feel and lets me protect admin pages by role."),
 ("Socket.io client", "Receives live updates from the server.",
  "It powers instant notifications so users see new alerts without refreshing."),
])

stack_table("Backend (the brain of the system)", [
 ("NestJS", "The framework that structures the whole server into modules.",
  "It enforces clean, professional organisation (one module per feature) and has built-in support for security, validation and websockets."),
 ("TypeScript", "JavaScript with type-checking.",
  "It catches many mistakes before the code even runs, which makes a big project safer and easier to trust."),
 ("PostgreSQL", "The main relational database.",
  "It is powerful, reliable, free and open-source, and perfect for the structured, related data of a law firm."),
 ("Prisma (ORM)", "Translates my code into safe database queries.",
  "It is type-safe and automatically protects against SQL injection, so the database layer is secure by default."),
 ("JWT", "Tokens that prove who a user is after login.",
  "They let the server stay stateless and scalable — no session storage needed — and they carry the firm ID for isolation."),
 ("bcrypt", "Hashes (scrambles) passwords before storing them.",
  "Even if the database leaked, passwords cannot be read. It is the industry standard for password safety."),
 ("BullMQ + Redis", "Runs background jobs like scheduled reminders and emails.",
  "It lets the app schedule a notification for a future date and send it automatically, without blocking the user."),
 ("Socket.io (server)", "Pushes real-time events to connected users.",
  "Needed for instant notifications; clients join a per-firm room so messages never leak across firms."),
 ("Helmet + Throttler", "Adds security headers and limits request rate.",
  "Helmet hardens the app against common web attacks; the throttler blocks abuse and brute-force attempts."),
])

stack_table("Data, storage, AI &amp; infrastructure", [
 ("Supabase Storage (S3)", "Stores the actual document files.",
  "It is S3-compatible, has a free tier, and lets me organise files per firm and serve them through secure expiring links."),
 ("Redis (Upstash)", "In-memory cache and job queue backend.",
  "It makes repeated requests fast and powers the scheduled-notification system, on a free managed plan."),
 ("n8n Cloud", "The workflow that powers the AI (RAG).",
  "It lets me build the document-ingestion and question-answering pipeline visually, and keeps AI logic separate from the app."),
 ("Resend", "Sends transactional emails.",
  "It reliably delivers urgent notifications by email with very little setup."),
 ("Docker", "Packages the backend so it runs the same everywhere.",
  "It removes ‘it works on my machine’ problems and makes cloud deployment simple and repeatable."),
 ("Neon (PostgreSQL)", "The hosted, serverless database.",
  "It gives a real PostgreSQL database for free, scales automatically, and needs no server maintenance."),
 ("Render", "Hosts the backend API.",
  "It deploys a Docker container for free and redeploys automatically when I push new code."),
 ("Vercel", "Hosts the frontend website.",
  "It serves the React app worldwide on a fast CDN, for free, with automatic deployment."),
 ("GitHub Actions", "Runs the automatic test-and-deploy pipeline (CI/CD).",
  "It checks every code change builds correctly before it goes live, so a broken version never reaches users."),
])
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════
# PART 3 — Q&A
# ══════════════════════════════════════════════════════════════════════════
section_banner("Part 3 — Jury Questions and Answers")
para("These are the questions a jury is likely to ask, with clear answers in simple English. Read each answer, then say it "
     "in your own words. If you do not know something, it is fine to say: “That is a good point — in the current version I "
     "handled X, and Y would be a strong next step.” Confidence and honesty win marks.", BODY)
sp(6)

# 3.1 GENERAL
story.append(Paragraph("3.1  General &amp; Conceptual Questions", H2)); hr()
qa("In one sentence, what is LexManage?",
   "It is a secure, multi-tenant web platform that lets a law firm manage its cases, documents, clients, deadlines and "
   "notifications in one place, with an AI assistant that answers legal questions from the firm’s own documents.")
qa("What does “multi-tenant” mean, and why does it matter here?",
   "Multi-tenant means many separate organisations (law firms) use the same single running application, but each one’s data "
   "is completely isolated. It matters because law firm data is highly confidential — one firm must never see another’s "
   "clients, cases or files. It also means I host one app for everyone instead of installing separate software for each firm, "
   "which is far cheaper and easier to maintain.")
qa("What does “SaaS” mean?",
   "Software as a Service. The firm does not install or maintain anything; they just open a web browser and use the app. "
   "I run and update the software centrally in the cloud. This suits firms with little or no IT staff.")
qa("Who are the users of the system?",
   "The staff of a law firm, in five roles: Super Admin, Cabinet (Firm) Admin, Lawyer, Assistant and Secretary. Each role "
   "sees and can do only what its job requires.")
qa("Why did you choose the legal domain specifically?",
   "Because legal work is document-heavy, deadline-driven and highly confidential — exactly the kind of work that suffers most "
   "from paper files and scattered tools. It is a domain where good software has a clear, measurable impact, and where many "
   "firms, especially in Africa, are still under-served by affordable digital tools.")
qa("Is this a real, working application or just a prototype?",
   "It is a real, fully deployed application running live on the internet on a production-shaped cloud stack, with a database, "
   "file storage, real-time notifications and CI/CD. It is an MVP — a minimum viable product — meaning the core is complete and working.")
qa("What makes your project different from a normal CRUD app?",
   "Three things: true multi-tenant data isolation enforced on every request; an AI assistant grounded in each firm’s own "
   "documents using RAG; and a production-grade, secure, automatically-deployed cloud architecture. It is not just create-read-"
   "update-delete; it is a secure, real-time, AI-enabled SaaS.")

# 3.2 SECURITY
story.append(Paragraph("3.2  Security Questions (expect many of these)", H2)); hr()
qa("How exactly do you keep one firm’s data separate from another’s?",
   ["Every user’s login token (JWT) contains a <b>tenantId</b> — the ID of their firm. On every request, a middleware verifies "
    "the token and reads that tenantId. The application then attaches that tenantId to every database query, so the database "
    "only ever returns rows belonging to that firm. Files are stored under a folder named after the tenantId, and real-time "
    "messages go to a per-firm ‘room’. So isolation is enforced at the data layer, the storage layer and the real-time layer — "
    "not just hidden in the interface."])
qa("How does login and authentication work?",
   "When a user logs in, the server checks the email and the bcrypt-hashed password. If correct, it issues two tokens: a "
   "short-lived access token (15 minutes) and a longer refresh token (7 days). The access token is sent with every request to "
   "prove identity. When it expires, the refresh token quietly gets a new one, so the user stays logged in without re-typing "
   "their password.")
qa("Why two tokens instead of one? Isn’t that more complex?",
   "It is a deliberate security trade-off. The access token is short-lived, so if it is ever stolen it is only useful for a few "
   "minutes. The refresh token is stored more safely and can be revoked. This limits the damage of a stolen token while keeping "
   "the user logged in conveniently.")
qa("How are passwords stored?",
   "They are never stored as plain text. They are hashed with bcrypt using a cost factor of 12. Hashing is one-way, so even if "
   "the database were stolen, the real passwords cannot be recovered. Bcrypt is also deliberately slow, which makes brute-force "
   "guessing impractical.")
qa("Could someone forge a token and pretend to be another firm?",
   "No. Each token is cryptographically signed with a secret key only the server knows, and I pin the algorithm to HS256 so an "
   "attacker cannot trick the server into accepting an unsigned token. If even one character of the token is changed, the "
   "signature check fails and the request is rejected.")
qa("How do you prevent SQL injection?",
   "I never build SQL by joining strings. I use Prisma, an ORM that sends every value as a separate parameter, so user input can "
   "never change the meaning of a query. This makes standard SQL injection impossible by design.")
qa("How do you protect against cross-site and common web attacks?",
   "I use Helmet, which sets protective HTTP headers. I lock CORS so the API only accepts requests from my official website "
   "address. All traffic is forced over HTTPS. And every input is validated and ‘whitelisted’ — unexpected fields are rejected "
   "automatically.")
qa("What stops someone from spamming or brute-forcing your API?",
   "Rate limiting. I use a throttler that allows at most about 10 requests per second, 60 per minute, and 600 per hour per "
   "client. Beyond that, requests are blocked. This slows down brute-force password guessing and protects the server from abuse.")
qa("How are documents protected? Can someone guess a file URL?",
   "Files are private. They are not served by a public link. To download a file, the server generates a temporary <b>signed URL</b> "
   "that works for only 15 minutes and then stops working. You also need a valid login and the right role even to request that "
   "link. So guessing a URL is useless.")
qa("What about role-based access — can a secretary delete a case?",
   "No. Access is controlled by Role-Based Access Control. Sensitive actions are protected by guards that check the user’s role "
   "at both the routing level and the API level. A secretary or assistant simply does not have permission for admin-only actions, "
   "and the server rejects the request even if they tried to call the API directly.")
qa("Where do you validate input — frontend or backend?",
   "Both, but the backend is the real guard. The frontend validates for a nice user experience, but the backend re-validates "
   "everything with strict schemas, because a frontend check can always be bypassed. The server never trusts the client.")
qa("Is the AI a security risk? Could it leak one firm’s documents to another?",
   "No. Each firm’s documents are stored in a separate knowledge base keyed by tenantId. When a question is asked, the request "
   "carries the firm’s ID, and only that firm’s content is searched. So the AI cannot answer using another firm’s documents.")
qa("What happens if the server restarts — are users logged out?",
   "No. Authentication is stateless: the proof of identity lives in the signed token held by the browser, not in server memory. "
   "So the server can restart or scale to many instances and users stay logged in.")
qa("Do you log security-sensitive actions?",
   "Yes. There is an audit log model that records sensitive actions with the user, the action and a timestamp, which gives "
   "traceability — important for a legal system where accountability matters.")
qa("What are the main security weaknesses you are aware of?",
   "Honestly, a few areas I would harden next: adding two-factor authentication for logins, encrypting specific sensitive fields "
   "at rest in the database, adding automated security scanning in the pipeline, and a formal penetration test. The foundations — "
   "isolation, hashing, signed tokens, RBAC, rate limiting — are already in place.")

# 3.3 AFRICAN LAW FIRMS
story.append(Paragraph("3.3  How LexManage Solves Problems in African Law Firms", H2)); hr()
qa("Why is this project especially relevant for African law firms?",
   ["Because many African firms face a specific combination of challenges: tight budgets, limited IT staff, unreliable internet "
    "and power, heavy reliance on paper, and — in countries like Cameroon — the need to work in <b>both French and English</b>. "
    "LexManage was designed around exactly these realities: it is free to run on the cloud, needs no local server or IT team, "
    "works on a phone, survives weak connections, and is fully bilingual."])
qa("How does it address the low budgets of small African firms?",
   "The entire platform runs on free cloud tiers, with no expensive licenses and no on-premise servers to buy or maintain. A "
   "small firm can use professional-grade legal software at almost no cost, which removes the biggest barrier to going digital.")
qa("Many areas have unreliable internet. How does the app cope?",
   "I built in network resilience. The app detects a weak or lost connection and shows a clear red Wi-Fi warning so the user "
   "knows it is the network, not the app. Requests automatically retry instead of failing instantly. And because the free server "
   "can ‘sleep’, I added a keep-alive ping and a friendly ‘waking up the server’ message with automatic retry, so the user is "
   "never stuck on a blank error.")
qa("Why is the bilingual feature important here?",
   "Several African countries are officially bilingual or mixed-language. Cameroon, for example, uses both French and English in "
   "its legal system. LexManage switches the entire interface — including document categories — between French and English "
   "instantly, so a firm can work in whichever language a given client or court requires. Most foreign legal software is "
   "English-only, which excludes Francophone users.")
qa("Many lawyers work from their phones. Does the app support that?",
   "Yes. The interface is fully responsive and mobile-first. The header, search, notifications and chatbot were specifically "
   "adjusted to work well on small screens, so a lawyer can check a case or a deadline from a phone, not only a computer.")
qa("African firms often have no IT department. Who maintains the system?",
   "Nobody at the firm has to. Because it is SaaS on managed cloud services, all updates, backups, scaling and server "
   "maintenance happen centrally and automatically. The firm just logs in and works.")
qa("How does it solve the paper-file problem common in African firms?",
   "It digitises the whole case file: the case details, the linked client, the deadlines and all the documents live together "
   "online, searchable in seconds. No more lost binders, no more driving to the office to find one paper, and no more single "
   "physical copy that can be destroyed by fire or water.")
qa("Confidentiality is a big concern. How does it build trust with firms?",
   "Through strict isolation and security: each firm’s data is walled off, documents are private and only reachable through "
   "short-lived signed links, passwords are hashed, tokens are signed, and roles limit who can see what. A firm can trust that "
   "its clients’ secrets stay its own.")
qa("Could this scale to many firms across a country or region?",
   "Yes. That is the point of the multi-tenant SaaS design and the cursor-based pagination: adding more firms just means more "
   "tenants in the same system, and the architecture and database queries stay efficient as data grows. The cloud services "
   "scale automatically.")
qa("Is there a real market for this?",
   "Yes. There are thousands of small and medium law firms across Africa that cannot afford expensive foreign legal software and "
   "are still on paper. A free-to-run, bilingual, mobile-friendly, secure platform fills a clear gap.")

# 3.4 ARCHITECTURE
story.append(Paragraph("3.4  Architecture &amp; Technical Questions", H2)); hr()
qa("Why did you separate the frontend and backend instead of one combined app?",
   "Separation of concerns. The frontend focuses only on the user experience, and the backend focuses on data, rules and "
   "security. This makes each side simpler to build and test, lets them scale independently, and means I could deploy the "
   "website and the API on the platforms each is best suited to.")
qa("Why NestJS and not plain Node.js or Express?",
   "NestJS gives structure. It organises code into modules with clear boundaries and has built-in, professional support for "
   "validation, authentication, guards, websockets and dependency injection. For a project this size, that structure keeps the "
   "code clean and maintainable, where plain Express would become messy.")
qa("Walk me through what happens when a user opens their list of cases.",
   ["The browser sends a request to the API with the user’s access token. A middleware verifies the token and reads the firm ID. "
    "A guard checks the user is authenticated. The cases controller calls the cases service. The service asks Prisma for cases "
    "belonging to that firm only, using cursor-based pagination. The result may be served from the Redis cache if it is fresh. "
    "The data is returned as JSON, and React Query on the frontend caches it and shows it. Every step is firm-scoped and "
    "permission-checked."])
qa("How do real-time notifications work technically?",
   "I use a Socket.io gateway. When a user connects, they join a room named after their firm and a room for themselves. When a "
   "notification is created, the server emits an event to the right room, and connected browsers receive it instantly and update "
   "the bell icon — no page refresh needed.")
qa("What is the role of Redis in your system?",
   "Two roles. First, it is a cache: frequently requested data is stored briefly so repeated requests are fast. Second, it is the "
   "backbone of the job queue (BullMQ), which lets me schedule a notification to be sent at a future time and send urgent emails "
   "in the background.")
qa("What design patterns did you use?",
   "Mainly the modular controller–service pattern that NestJS encourages: controllers handle the HTTP layer, services hold the "
   "business logic, and Prisma handles data. I also used dependency injection throughout, middleware for cross-cutting concerns "
   "like tenancy, and guards for authorisation.")

# 3.5 AI
story.append(Paragraph("3.5  Artificial Intelligence (RAG) Questions", H2)); hr()
qa("What is RAG, in simple terms?",
   "RAG means Retrieval-Augmented Generation. Instead of letting the AI answer from its general memory, we first <b>retrieve</b> "
   "the most relevant pieces of the firm’s own documents, and then ask the AI to <b>generate</b> an answer using only those "
   "pieces. So the answer is based on real documents, not guesswork.")
qa("Why use RAG instead of just asking a chatbot like ChatGPT?",
   "A general chatbot does not know your firm’s private case files, and it can ‘hallucinate’ — confidently invent wrong answers. "
   "For legal work that is dangerous. RAG grounds every answer in the firm’s actual documents and can show the sources, which is "
   "accurate, private and trustworthy.")
qa("How does a document get into the AI’s knowledge?",
   "When a lawyer uploads a document, the backend sends it to an n8n workflow. That workflow reads the text, splits it into small "
   "chunks, converts each chunk into a numerical form (an embedding), and stores them in a knowledge base tagged with the firm’s "
   "ID. Later, a question is matched against those chunks to find the most relevant ones.")
qa("Why did you use n8n for the AI instead of coding it directly?",
   "n8n let me build the ingestion and question-answering pipeline as a clear visual workflow, separate from the main app. This "
   "keeps the AI logic modular and easy to change, and it means the heavy AI processing does not block or complicate the main API.")
qa("What if the AI gives a wrong answer?",
   "Because answers are grounded in the firm’s documents and show their sources, the lawyer can verify them. The interface also "
   "reminds users that the AI assists but does not replace professional judgement. RAG greatly reduces, though never fully "
   "eliminates, wrong answers — so the human stays in control.")

# 3.6 DATABASE / PERFORMANCE
story.append(Paragraph("3.6  Database, Data &amp; Performance Questions", H2)); hr()
qa("Why PostgreSQL and not a NoSQL database like MongoDB?",
   "Law firm data is highly relational — cases belong to firms, documents belong to cases, deadlines belong to cases, and so on. "
   "PostgreSQL is built for these relationships and guarantees consistency. A NoSQL database would make these links harder to "
   "keep correct. For structured, related, important data, a relational database is the right choice.")
qa("What is an ORM and why use Prisma?",
   "An ORM (Object-Relational Mapper) lets me work with the database using clean code instead of raw SQL. Prisma is type-safe, "
   "so mistakes are caught early, and it parameterises every query, which prevents SQL injection. It also makes the data model "
   "easy to read and evolve.")
qa("You used cursor-based pagination. What is it and why?",
   "Old-style pagination uses OFFSET, which makes the database scan and skip all earlier rows — this gets slower as data grows. "
   "Cursor-based pagination instead remembers the last item seen and jumps straight to the next batch using the index. It stays "
   "fast no matter how many records exist, which matters for a system meant to grow with many firms.")
qa("How do you keep the app fast?",
   "Several ways: a Redis cache for repeated reads, cursor pagination for large lists, code-splitting so the browser only loads "
   "the page it needs, and database indexes on the fields used for filtering and tenancy. Together these keep the app responsive.")
qa("How many tables are in your database and what are the main ones?",
   "There are 13 models. The main ones are Tenant (the firm), User, Case, Client, Document, Deadline, Notification, plus "
   "supporting ones like ScheduledNotification, NotificationTemplate, ChatConversation, ChatMessage, Invitation and AuditLog.")
qa("How do you handle database changes as the project evolves?",
   "Through Prisma’s schema and migration system. I describe the data model in one schema file, and Prisma generates the matching "
   "database structure. This keeps the code and the database in sync and version-controlled.")

# 3.7 DEPLOYMENT
story.append(Paragraph("3.7  Deployment, DevOps &amp; Reliability Questions", H2)); hr()
qa("What is CI/CD and what does yours do?",
   "CI/CD means Continuous Integration and Continuous Deployment. Every time I push new code, GitHub Actions automatically checks "
   "that the backend type-checks and builds and that the frontend builds. If anything fails, it does not deploy — so a broken "
   "version never reaches users. If it passes, Vercel and Render deploy the new version automatically.")
qa("Why did you containerise the backend with Docker?",
   "Docker packages the backend with everything it needs, so it runs exactly the same on my machine and on the cloud server. This "
   "removes ‘it works on my computer’ problems and makes deployment predictable and repeatable.")
qa("You used only free services. Doesn’t that make it unreliable?",
   ["The free tiers have one real limitation: the backend ‘sleeps’ after 15 minutes of inactivity and takes a moment to wake. I "
    "handled this directly: a scheduled keep-alive ping keeps it awake, and if it ever is asleep, the app automatically retries "
    "and shows a friendly ‘waking up’ message instead of an error. The architecture itself is production-shaped — the same code "
    "can move to paid tiers for instant scaling with no redesign."])
qa("What happens if the backend is slow or down when a user logs in?",
   "The frontend does not just fail. It retries the request several times with increasing delays, shows a ‘waking up the server’ "
   "banner so the user understands, and detects whether the problem is actually the user’s own weak internet, in which case it "
   "shows a red Wi-Fi warning. The user is never left staring at a blank error.")
qa("How would you scale this if 500 firms joined tomorrow?",
   "The design is already multi-tenant and stateless, so I would move the database, Redis and backend to paid tiers that scale "
   "automatically, and because the backend is stateless and Dockerised, I can run several copies behind a load balancer. The "
   "cursor pagination and caching keep queries efficient as data grows. No redesign is needed — just bigger resources.")
qa("How do you manage secrets like database passwords and API keys?",
   "They are never written in the code or committed to GitHub. They are stored as environment variables in each cloud platform’s "
   "dashboard, and the code reads them at runtime. The repository only contains an example file with the variable names, not the "
   "real values.")

# 3.8 TESTING / LIMITATIONS / FUTURE
story.append(Paragraph("3.8  Testing, Limitations &amp; Future Work", H2)); hr()
qa("How did you test the application?",
   "I tested it in three main ways: type-checking with TypeScript catches a whole class of errors before running; the CI pipeline "
   "verifies that both the backend and frontend build correctly on every change; and I did thorough manual end-to-end testing of "
   "every feature on the deployed app — registering, logging in, creating cases, uploading documents, searching, using the AI and "
   "sending notifications.")
qa("What are the current limitations of your project?",
   "It is an MVP, so some areas are deliberately basic: there is limited automated unit-test coverage; the free hosting tier sleeps; "
   "billing and time-tracking are not yet built; and security could go further with two-factor login and field-level encryption. "
   "I know these limits, which is itself part of good engineering.")
qa("If you had three more months, what would you add?",
   "Two-factor authentication, automated unit and integration tests in the pipeline, a billing and invoicing module, offline "
   "support so lawyers can work without internet and sync later, and a mobile app version. I would also add field-level encryption "
   "for the most sensitive data.")
qa("What was the hardest part of building this?",
   "Getting multi-tenant isolation right and trustworthy — making absolutely sure that every single query, file path and real-time "
   "message is scoped to the correct firm — and then deploying a full, secure, real-time stack on free services while handling the "
   "cold-start problem gracefully. Both required careful, layered thinking.")
qa("What did you learn from this project?",
   "I learned how to design and build a complete, secure, real-world system end-to-end: data modelling, API design, authentication "
   "and authorisation, real-time communication, AI integration, performance tuning, and cloud deployment with CI/CD. Most "
   "importantly, I learned to think about security and the real user’s context from the very start, not as an afterthought.")
qa("Why should we be impressed by this project?",
   "Because it is not a toy. It is a complete, live, secure, multi-tenant SaaS that solves a real and important problem, uses a "
   "modern professional stack correctly, integrates grounded AI, and is thoughtfully adapted to the real conditions of African law "
   "firms — all deployed for free with automatic delivery. It shows I can take an idea from a database diagram to a running, "
   "useful product.")
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════
# PART 4 — SUGGESTIONS
# ══════════════════════════════════════════════════════════════════════════
section_banner("Part 4 — Suggested Additions &amp; Final Defense Tips")
para("Here are extra things you can add to your slides or notes to look even more prepared. You can also feed these into "
     "NotebookLM so it can quiz you on them.", BODY)

story.append(Paragraph("Things worth adding to your presentation", H3))
bullets([
 "<b>A simple architecture diagram</b> on screen while you talk — even a hand-drawn boxes-and-arrows version helps the jury follow.",
 "<b>An Entity-Relationship (ER) diagram</b> of the 13 database tables — juries love seeing the data model. You already have one in the repo.",
 "<b>A short live demo plan</b> written on a card, in order, so you never freeze: register → login → create case → upload document → search → ask LexAssist → send notification.",
 "<b>One concrete number</b> about the problem (e.g. ‘a missed filing deadline can dismiss an entire case’) to make the problem feel real.",
 "<b>A ‘security at every layer’ slide</b> — list isolation, hashed passwords, signed tokens, RBAC, rate limiting, signed URLs. Security is your strongest selling point; show it proudly.",
 "<b>A ‘why Africa’ slide</b> — cost, bilingual (French/English), mobile-first, weak-network resilience, no IT staff needed. This connects your tech to real impact.",
 "<b>A limitations &amp; future-work slide</b> — admitting limits with a clear plan makes you look mature, not weak.",
])

story.append(Paragraph("Tips for the defense itself", H3))
bullets([
 "<b>Warm up the app before you start</b> so the cold-start delay never shows during the demo. Keep a tab open and logged in.",
 "<b>Always answer with a reason.</b> Not ‘I used NestJS’, but ‘I used NestJS <i>because</i> it gives clean structure and built-in security’.",
 "<b>If you don’t know something, stay calm.</b> Say what you did do, then describe how you would approach the gap. Never bluff.",
 "<b>Lead with security and impact.</b> When in doubt, steer the answer back to data isolation, confidentiality, and how it helps real African firms.",
 "<b>Use simple words.</b> The clearer you explain, the more it shows you truly understand it.",
 "<b>Have a backup of the demo</b> — a short screen recording or screenshots — in case the internet fails during your defense.",
 "<b>Know your numbers:</b> 17 backend modules, 13 database models, 5 roles, 2 languages, fully free deployment. These make you sound in command of your project.",
])

story.append(Paragraph("One-line answers to keep ready", H3))
bullets([
 "<b>What is it?</b> A secure multi-tenant SaaS that runs a law firm’s cases, documents, clients and reminders, with grounded AI.",
 "<b>What is special?</b> Real per-firm isolation, grounded RAG AI, and a full secure cloud deployment — built for African firms’ real conditions.",
 "<b>Why secure?</b> Isolation per firm, hashed passwords, signed tokens, role permissions, rate limiting, and expiring document links.",
 "<b>Why for Africa?</b> Free to run, bilingual, mobile-first, and resilient on weak internet, with no IT staff required.",
])

sp(10)
hr(AMBERL, 2)
para("You built a complete, real, secure system. Speak about it with calm confidence — you know it better than anyone in the room.",
    S("end", parent=BODY, textColor=NAVY, fontName="Helvetica-Bold", fontSize=11, alignment=TA_CENTER))

# ── Footer with page numbers ──────────────────────────────────────────────
def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(ICE); canvas.setLineWidth(0.5)
    canvas.line(2*cm, 1.35*cm, A4[0]-2*cm, 1.35*cm)
    canvas.setFont("Helvetica", 8); canvas.setFillColor(SLATEL)
    canvas.drawString(2*cm, 1.0*cm, "LexManage — B.Tech Defense Preparation Guide")
    canvas.drawRightString(A4[0]-2*cm, 1.0*cm, "Page %d" % doc.page)
    canvas.restoreState()

doc = SimpleDocTemplate("LexManage_Defense_Guide.pdf", pagesize=A4,
                        leftMargin=2*cm, rightMargin=2*cm, topMargin=1.7*cm, bottomMargin=1.8*cm,
                        title="LexManage — B.Tech Defense Preparation Guide", author="Emmanuel Nyouma")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("WROTE LexManage_Defense_Guide.pdf")
