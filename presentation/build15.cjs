const pptxgen = require("pptxgenjs");
const { makeDrawer } = require("./nicons.cjs");

const C = {
  NAVY: "0E1B3A", NAVY2: "16264F", NAVY3: "1E3A6E", INK: "0F172A",
  AMBER: "F59E0B", AMBER_D: "B45309", AMBER_L: "FBBF24",
  SLATE: "475569", SLATE_L: "64748B", ICE: "E2E8F0", SOFT: "F1F5F9",
  SOFT2: "F8FAFC", WHITE: "FFFFFF", GREEN: "0E9F6E", TEAL: "0D9488",
};
const HFONT = "Georgia", BFONT = "Calibri";
const W = 13.333, H = 7.5, MX = 0.7;

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: W, height: H });
pres.layout = "WIDE";
pres.author = "Emmanuel Nyouma";
pres.title = "LexManage — Project Presentation";
const di = makeDrawer(pres);

const shadow = () => ({ type: "outer", color: "0E1B3A", blur: 9, offset: 3, angle: 90, opacity: 0.16 });

function iconCircle(slide, name, x, y, dia, circleColor, iconColor) {
  slide.addShape("ellipse", { x, y, w: dia, h: dia, fill: { color: circleColor }, line: { type: "none" } });
  const ip = dia * 0.52;
  di(slide, name, x + (dia - ip) / 2, y + (dia - ip) / 2, ip, iconColor);
}
function kicker(slide, text, x, y, color = C.AMBER) {
  slide.addText(text.toUpperCase(), { x, y, w: 9, h: 0.3, margin: 0, fontFace: BFONT, fontSize: 12, bold: true, color, charSpacing: 3 });
}
function lightTitle(slide, text, y = 0.95) {
  slide.addText(text, { x: MX, y, w: W - 2 * MX, h: 0.9, margin: 0, fontFace: HFONT, fontSize: 30, bold: true, color: C.INK, valign: "top" });
}
function pageNo(slide, n) {
  slide.addText(String(n).padStart(2, "0"), { x: W - 1.1, y: H - 0.5, w: 0.7, h: 0.3, margin: 0, fontFace: BFONT, fontSize: 10, color: C.SLATE_L, align: "right" });
  slide.addText("LexManage", { x: MX, y: H - 0.5, w: 3, h: 0.3, margin: 0, fontFace: BFONT, fontSize: 10, color: C.SLATE_L });
}
const lightBase = (n) => { const s = pres.addSlide(); s.background = { color: C.WHITE }; pageNo(s, n); return s; };
const darkBase = () => { const s = pres.addSlide(); s.background = { color: C.NAVY }; return s; };

// ── 1 · TITLE ──────────────────────────────────────────────────────────
{
  const s = darkBase();
  s.addShape("ellipse", { x: -2.2, y: -2.6, w: 5.2, h: 5.2, fill: { color: C.NAVY2 }, line: { type: "none" } });
  s.addShape("ellipse", { x: W - 3.1, y: H - 3.1, w: 5.6, h: 5.6, fill: { color: C.NAVY2 }, line: { type: "none" } });
  iconCircle(s, "scale", MX, 1.45, 1.15, C.AMBER, C.NAVY);
  s.addText("LexManage", { x: MX, y: 2.75, w: 11.5, h: 1.2, margin: 0, fontFace: HFONT, fontSize: 60, bold: true, color: C.WHITE });
  s.addText("A Multi-Tenant SaaS Legal Management Platform with AI-Powered Legal Research", { x: MX, y: 3.98, w: 10.8, h: 0.9, margin: 0, fontFace: BFONT, fontSize: 19, color: C.AMBER_L });
  s.addText("Case Management   •   Document Repository   •   Client CRM   •   Smart Notifications   •   LexAssist AI", { x: MX, y: 5.0, w: 11.8, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 13.5, color: C.ICE });
  s.addText("Project Presentation   —   Emmanuel Nyouma", { x: MX, y: 6.5, w: 9, h: 0.4, margin: 0, fontFace: BFONT, fontSize: 13, bold: true, color: C.WHITE });
}

// ── 2 · AGENDA ─────────────────────────────────────────────────────────
{
  const s = lightBase(2);
  kicker(s, "Presentation Outline", MX, 0.55);
  lightTitle(s, "Agenda");
  const items = [
    ["briefcase", "Introduction", "What LexManage is and the vision behind it"],
    ["warning", "Problem Statement", "The operational pain points in modern law firms"],
    ["layers", "Features → Problems", "Which capability resolves which problem"],
    ["gear", "Methodology & Tools", "Full stack, from development to deployment"],
    ["gauge", "Results / Demo", "Live walkthrough of the deployed platform"],
    ["check", "Conclusion", "Outcomes, impact and next steps"],
  ];
  const colW = (W - 2 * MX - 0.5) / 2, rowH = 1.35, x0 = MX, y0 = 2.05;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (colW + 0.5), y = y0 + row * (rowH + 0.18);
    s.addShape("rect", { x, y, w: colW, h: rowH, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 } });
    iconCircle(s, it[0], x + 0.28, y + 0.32, 0.7, C.NAVY, C.AMBER);
    s.addText(`0${i + 1}`, { x: x + colW - 1.15, y: y + 0.12, w: 1.0, h: 0.7, margin: 0, fontFace: HFONT, fontSize: 30, bold: true, color: C.ICE, align: "right" });
    s.addText(it[1], { x: x + 1.15, y: y + 0.28, w: colW - 2.15, h: 0.4, margin: 0, fontFace: BFONT, fontSize: 16, bold: true, color: C.INK });
    s.addText(it[2], { x: x + 1.15, y: y + 0.7, w: colW - 1.35, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 11.5, color: C.SLATE });
  });
}

// ── 3 · INTRODUCTION ───────────────────────────────────────────────────
{
  const s = lightBase(3);
  kicker(s, "Introduction", MX, 0.55);
  lightTitle(s, "What is LexManage?");
  s.addText([
    { text: "LexManage is an enterprise-grade, multi-tenant SaaS platform that digitises the entire operation of a law firm in a single, secure workspace.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "Each firm (a “tenant”) gets a fully isolated environment — its own users, clients, cases, documents and notifications — with strict data partitioning enforced at the application layer.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "Beyond traditional legal-ERP features, LexManage embeds LexAssist AI: a Retrieval-Augmented Generation assistant that answers legal questions grounded in the firm’s own documents.", options: { breakLine: true } },
  ], { x: MX, y: 1.95, w: 6.55, h: 3.6, margin: 0, fontFace: BFONT, fontSize: 14.5, color: C.SLATE, valign: "top", lineSpacingMultiple: 1.15 });
  s.addText("Bilingual (FR / EN)   ·   Dark / Light mode   ·   Fully responsive, mobile-first", { x: MX, y: 5.75, w: 6.55, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 12, italic: true, bold: true, color: C.AMBER_D });

  const px = 7.7, pw = W - MX - px;
  s.addShape("rect", { x: px, y: 1.95, w: pw, h: 4.3, fill: { color: C.NAVY }, line: { type: "none" }, shadow: shadow() });
  s.addText("AT A GLANCE", { x: px + 0.4, y: 2.2, w: pw - 0.8, h: 0.35, margin: 0, fontFace: BFONT, fontSize: 12, bold: true, color: C.AMBER, charSpacing: 2 });
  const stats = [["17", "backend modules (NestJS)"], ["13", "data models (Prisma / PostgreSQL)"], ["5", "role levels (RBAC)"], ["1", "AI assistant grounded in firm data"]];
  let sy = 2.72;
  stats.forEach((st) => {
    s.addText(st[0], { x: px + 0.4, y: sy, w: 1.5, h: 0.8, margin: 0, fontFace: HFONT, fontSize: 40, bold: true, color: C.AMBER_L, valign: "middle" });
    s.addText(st[1], { x: px + 1.95, y: sy, w: pw - 2.3, h: 0.8, margin: 0, fontFace: BFONT, fontSize: 12.5, color: C.ICE, valign: "middle" });
    sy += 0.85;
  });
}

// ── 4 · PROBLEM STATEMENT ──────────────────────────────────────────────
{
  const s = darkBase();
  kicker(s, "Problem Statement", MX, 0.55);
  s.addText("Why LexManage was built", { x: MX, y: 0.9, w: 12, h: 0.9, margin: 0, fontFace: HFONT, fontSize: 30, bold: true, color: C.WHITE });
  s.addText("Most small and mid-size law firms still run on paper files, scattered drives, spreadsheets and email — creating concrete, daily operational risk:", { x: MX, y: 1.8, w: 11.9, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 13.5, color: C.ICE });
  const probs = [
    ["folder", "Fragmented case information", "Facts, parties, deadlines and history live across binders, drives and inboxes — no single source of truth."],
    ["file", "Disorganised, insecure documents", "Legal files are hard to find, uncategorised, and shared with no access control or audit trail."],
    ["calendar", "Missed hearings & deadlines", "Procedural dates are tracked manually, so critical deadlines slip — with real legal consequences."],
    ["search", "Slow legal research", "Finding a clause or precedent across hundreds of documents is manual, repetitive and time-consuming."],
    ["sitemap", "Data privacy between firms", "A shared digital tool must guarantee one firm can never see another firm’s clients, cases or files."],
    ["shield", "No access governance", "Without roles, every user can see and change everything — unacceptable for confidential legal data."],
  ];
  const colW = (W - 2 * MX - 0.4 * 2) / 3, rowH = 2.0, x0 = MX, y0 = 2.5;
  probs.forEach((p, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = x0 + col * (colW + 0.4), y = y0 + row * (rowH + 0.25);
    s.addShape("rect", { x, y, w: colW, h: rowH, fill: { color: C.NAVY2 }, line: { color: C.NAVY3, width: 1 } });
    iconCircle(s, p[0], x + 0.28, y + 0.28, 0.66, C.AMBER, C.NAVY);
    s.addText(p[1], { x: x + 0.28, y: y + 1.0, w: colW - 0.5, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 13, bold: true, color: C.WHITE, valign: "top" });
    s.addText(p[2], { x: x + 0.28, y: y + 1.42, w: colW - 0.5, h: rowH - 1.5, margin: 0, fontFace: BFONT, fontSize: 10.3, color: C.ICE, lineSpacingMultiple: 1.0 });
  });
}

// ── 5 · FEATURES OVERVIEW ──────────────────────────────────────────────
{
  const s = lightBase(5);
  kicker(s, "Core Capabilities", MX, 0.55);
  lightTitle(s, "The LexManage Feature Set");
  const feats = [
    ["folder", "Case Management", "Full case lifecycle (Open → In Progress → Pending → Closed) with priority, assignee and deadlines."],
    ["file", "Document Management", "Upload, categorise (10 categories) and secure legal documents with per-role visibility."],
    ["users", "Client Directory (CRM)", "Individuals & corporates, linked to cases, fully searchable."],
    ["robot", "LexAssist AI (RAG)", "Legal Q&A grounded in the firm’s own documents via an n8n RAG workflow."],
    ["bell", "Notification Center", "Instant, scheduled and templated alerts with real-time delivery."],
    ["search", "Hybrid Smart Search", "Inline suggestions across cases, documents, members and clients."],
    ["calendar", "Calendar & Deadlines", "Hearings, events and procedural deadlines in one unified view."],
    ["shield", "RBAC & Multi-Tenancy", "5 roles, strict per-firm data isolation on every request."],
  ];
  const cols = 4, gap = 0.32, cardW = (W - 2 * MX - gap * (cols - 1)) / cols, cardH = 2.25, x0 = MX, y0 = 2.0;
  feats.forEach((f, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = x0 + col * (cardW + gap), y = y0 + row * (cardH + 0.3);
    s.addShape("rect", { x, y, w: cardW, h: cardH, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
    iconCircle(s, f[0], x + 0.28, y + 0.28, 0.72, C.NAVY, C.AMBER);
    s.addText(f[1], { x: x + 0.24, y: y + 1.08, w: cardW - 0.45, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 13, bold: true, color: C.INK, valign: "top" });
    s.addText(f[2], { x: x + 0.24, y: y + 1.5, w: cardW - 0.42, h: cardH - 1.6, margin: 0, fontFace: BFONT, fontSize: 9.8, color: C.SLATE, lineSpacingMultiple: 1.0 });
  });
}

// ── 6 · FEATURE → PROBLEM MAPPING ──────────────────────────────────────
{
  const s = lightBase(6);
  kicker(s, "Traceability", MX, 0.55);
  lightTitle(s, "Which Feature Answers Which Problem");
  const rows = [
    ["Fragmented case information", "Case Management + Calendar", "Single source of truth per file — status, parties, deadlines and linked documents."],
    ["Disorganised, insecure documents", "Document Management System", "Categorised repository, per-role access, 15-min signed URLs, audit logging."],
    ["Missed hearings & deadlines", "Deadlines + Scheduled Notifications", "Due-date tracking with BullMQ-scheduled reminders and urgent pop-ups."],
    ["Slow legal research", "LexAssist AI (RAG)", "Natural-language answers grounded in the firm’s own ingested documents."],
    ["Data privacy between firms", "Multi-Tenancy + JWT scoping", "Every query auto-filtered by tenantId; WebSocket rooms isolate realtime traffic."],
    ["Poor team coordination", "Colleagues + Realtime Notifications", "Live workload visibility and instant Socket.io delivery to the right users."],
    ["No access governance", "Role-Based Access Control", "Router- and API-level guards restrict actions across 5 roles."],
    ["Finding anything quickly", "Hybrid Smart Search", "Token-split + full-phrase search across four entity types with suggestions."],
  ];
  const header = ["PROBLEM", "FEATURE", "HOW IT RESOLVES IT"].map((t, i) => ({
    text: t, options: { fill: { color: C.NAVY }, color: i === 1 ? C.AMBER_L : C.WHITE, bold: true, fontSize: 12, valign: "middle" },
  }));
  const body = rows.map((r, i) => {
    const bg = i % 2 === 0 ? C.SOFT2 : C.WHITE;
    return [
      { text: r[0], options: { fill: { color: bg }, color: C.INK, bold: true, fontSize: 10.5, valign: "middle" } },
      { text: r[1], options: { fill: { color: bg }, color: C.AMBER_D, bold: true, fontSize: 10.5, valign: "middle" } },
      { text: r[2], options: { fill: { color: bg }, color: C.SLATE, fontSize: 10, valign: "middle" } },
    ];
  });
  s.addTable([header, ...body], {
    x: MX, y: 1.9, w: W - 2 * MX, colW: [3.0, 3.0, 5.93], rowH: [0.4, ...rows.map(() => 0.55)],
    border: { type: "solid", color: C.ICE, pt: 1 }, margin: [3, 7, 3, 7], fontFace: BFONT, align: "left", autoPage: false,
  });
}

// ── 7 · METHODOLOGY ────────────────────────────────────────────────────
{
  const s = lightBase(7);
  kicker(s, "Methodology", MX, 0.55);
  lightTitle(s, "How LexManage Was Built");
  s.addText("An iterative, layered engineering approach: a decoupled frontend and backend, contract-first APIs, and security designed in from the start — not bolted on afterwards.", { x: MX, y: 1.68, w: W - 2 * MX, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 13.5, color: C.SLATE });
  const steps = [
    ["gear", "1 · Domain modelling", "Model the legal domain (tenants, users, cases, clients, documents, deadlines, notifications) as a Prisma schema — 13 entities with explicit relations."],
    ["code", "2 · API-first backend", "Build NestJS modules per domain (controller + service). Validate every input with Zod / class-validator. Document with Swagger / OpenAPI."],
    ["hexagon", "3 · Component-driven UI", "A React 19 SPA of reusable components, Zustand for global state, React Query for server state, caching and retries."],
    ["shield", "4 · Security hardening", "Layer in JWT auth, RBAC guards, tenant isolation, rate limiting, Helmet headers and signed URLs across the system."],
    ["bolt", "5 · Performance tuning", "Add Redis caching, cursor pagination, route-level code splitting and cold-start resilience."],
    ["rocket", "6 · Cloud deployment", "Containerise the backend (Docker), deploy on a fully free managed stack, wire CI/CD on every push to main."],
  ];
  const cols = 3, gap = 0.35, cardW = (W - 2 * MX - gap * (cols - 1)) / cols, cardH = 2.05, x0 = MX, y0 = 2.45;
  steps.forEach((st, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = x0 + col * (cardW + gap), y = y0 + row * (cardH + 0.3);
    s.addShape("rect", { x, y, w: cardW, h: cardH, fill: { color: C.WHITE }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
    iconCircle(s, st[0], x + 0.26, y + 0.26, 0.66, C.NAVY, C.AMBER);
    s.addText(st[1], { x: x + 1.05, y: y + 0.26, w: cardW - 1.25, h: 0.62, margin: 0, fontFace: BFONT, fontSize: 13, bold: true, color: C.INK, valign: "middle" });
    s.addText(st[2], { x: x + 0.28, y: y + 1.0, w: cardW - 0.5, h: cardH - 1.12, margin: 0, fontFace: BFONT, fontSize: 10.2, color: C.SLATE, lineSpacingMultiple: 1.02 });
  });
}

// ── 8 · ARCHITECTURE ───────────────────────────────────────────────────
{
  const s = lightBase(8);
  kicker(s, "System Architecture", MX, 0.55);
  lightTitle(s, "End-to-End Architecture");
  const layers = [
    { t: "CLIENT (Browser)", c: C.NAVY, items: ["React 19 SPA on Vercel CDN", "Zustand store + React Query", "Axios with JWT + auto-retry", "Socket.io client (realtime)"] },
    { t: "API (NestJS on Render)", c: C.AMBER_D, items: ["17 domain modules", "JWT auth + RBAC guards", "Tenant middleware (AsyncLocalStorage)", "BullMQ workers + WebSocket gateway"] },
    { t: "DATA & SERVICES", c: C.TEAL, items: ["PostgreSQL (Neon) via Prisma", "Redis (Upstash) cache + queues", "Supabase S3 (documents)", "n8n Cloud (RAG) · Resend (email)"] },
  ];
  const gap = 0.5, cw = (W - 2 * MX - gap * 2) / 3, y = 2.05, h = 3.5, x0 = MX;
  layers.forEach((L, i) => {
    const x = x0 + i * (cw + gap);
    s.addShape("rect", { x, y, w: cw, h, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
    s.addShape("rect", { x, y, w: cw, h: 0.6, fill: { color: L.c }, line: { type: "none" } });
    s.addText(L.t, { x: x + 0.15, y, w: cw - 0.3, h: 0.6, margin: 0, fontFace: BFONT, fontSize: 12.5, bold: true, color: C.WHITE, align: "center", valign: "middle" });
    s.addText(L.items.map((it) => ({ text: it, options: { bullet: { code: "2022", indent: 12 }, breakLine: true, paraSpaceAfter: 8 } })),
      { x: x + 0.3, y: y + 0.85, w: cw - 0.55, h: h - 1.05, margin: 0, fontFace: BFONT, fontSize: 11.5, color: C.SLATE, valign: "top" });
    if (i < 2) { di(s, "arrowRight", x + cw + (gap - 0.34) / 2, y + h / 2 - 0.17, 0.34, C.AMBER); }
  });
  s.addText("Stateless JWT auth   ·   HTTPS everywhere   ·   CORS locked to the Vercel origin   ·   per-firm data isolation on every request",
    { x: MX, y: 5.85, w: W - 2 * MX, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 12, italic: true, color: C.SLATE_L, align: "center" });
}

// ── 9 · FRONTEND + BACKEND STACK (two columns) ─────────────────────────
{
  const s = lightBase(9);
  kicker(s, "Tools — Application Stack", MX, 0.55);
  lightTitle(s, "Frontend & Backend Technology");
  const colW = 5.95;
  // FRONTEND column
  const fx = MX;
  s.addShape("rect", { x: fx, y: 1.85, w: colW, h: 4.85, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
  s.addShape("rect", { x: fx, y: 1.85, w: colW, h: 0.62, fill: { color: C.NAVY }, line: { type: "none" } });
  iconCircle(s, "hexagon", fx + 0.18, 1.96, 0.4, C.AMBER, C.NAVY);
  s.addText("FRONTEND", { x: fx + 0.7, y: 1.85, w: colW - 0.9, h: 0.62, margin: 0, fontFace: BFONT, fontSize: 14, bold: true, color: C.WHITE, valign: "middle" });
  const fe = [
    ["React 19 + Vite", "Component SPA with an extremely fast build, HMR, and lazy-loaded, code-split routes for a fast first paint on mobile."],
    ["Tailwind CSS", "Utility-first navy/amber design system with full dark mode and responsive, mobile-first layouts."],
    ["Zustand", "Minimal global store (auth, language, UI); persists the session and syncs login/logout across tabs."],
    ["TanStack React Query", "Server-state caching, background refetch, and useInfiniteQuery for cursor pagination; auto-invalidates on writes."],
    ["React Hook Form + Zod", "Performant forms using the SAME Zod schemas as the backend — one validation contract end-to-end."],
    ["Router · Socket.io · Recharts · Sonner", "Protected routing, realtime updates, dashboard charts and toast notifications."],
  ];
  let y = 2.62;
  fe.forEach((it) => {
    di(s, "check", fx + 0.22, y + 0.04, 0.22, C.GREEN);
    s.addText([{ text: it[0] + "  ", options: { bold: true, color: C.INK, fontSize: 11.5 } }, { text: it[1], options: { color: C.SLATE, fontSize: 9.8 } }],
      { x: fx + 0.55, y, w: colW - 0.75, h: 0.66, margin: 0, fontFace: BFONT, valign: "top", lineSpacingMultiple: 0.98 });
    y += 0.66;
  });
  // BACKEND column
  const bx = MX + colW + 0.33;
  s.addShape("rect", { x: bx, y: 1.85, w: colW, h: 4.85, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
  s.addShape("rect", { x: bx, y: 1.85, w: colW, h: 0.62, fill: { color: C.AMBER_D }, line: { type: "none" } });
  iconCircle(s, "server", bx + 0.18, 1.96, 0.4, C.WHITE, C.AMBER_D);
  s.addText("BACKEND", { x: bx + 0.7, y: 1.85, w: colW - 0.9, h: 0.62, margin: 0, fontFace: BFONT, fontSize: 14, bold: true, color: C.WHITE, valign: "middle" });
  const be = [
    ["NestJS (TypeScript)", "Modular framework with DI. 17 feature modules, each a controller + service (auth, cases, documents, search, AI…)."],
    ["Prisma ORM + PostgreSQL", "Type-safe access over 13 models; all queries parameterised — safe from SQL injection by default."],
    ["JWT Authentication", "15-min access + 7-day refresh tokens with rotation; passwords hashed with bcrypt (cost 12)."],
    ["BullMQ + Redis", "Delayed-job queues for scheduled notifications and email; Redis also powers the response cache."],
    ["Socket.io Gateway", "Authenticated WebSockets; clients join tenant_<id> / user_<id> rooms so realtime never leaks across firms."],
    ["Helmet · Throttler · ValidationPipe", "Security headers, rate limiting (10/s · 60/min · 600/h) and strict whitelist input validation."],
  ];
  y = 2.62;
  be.forEach((it) => {
    di(s, "check", bx + 0.22, y + 0.04, 0.22, C.GREEN);
    s.addText([{ text: it[0] + "  ", options: { bold: true, color: C.INK, fontSize: 11.5 } }, { text: it[1], options: { color: C.SLATE, fontSize: 9.8 } }],
      { x: bx + 0.55, y, w: colW - 0.75, h: 0.66, margin: 0, fontFace: BFONT, valign: "top", lineSpacingMultiple: 0.98 });
    y += 0.66;
  });
}

// ── 10 · DATA, STORAGE, TENANCY & SECURITY ─────────────────────────────
{
  const s = lightBase(10);
  kicker(s, "Tools — Data, Storage & Security");
  lightTitle(s, "Persistence, Isolation & Security");
  const lx = MX, lw = 5.9;
  s.addShape("rect", { x: lx, y: 1.9, w: lw, h: 4.55, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
  iconCircle(s, "database", lx + 0.3, 2.15, 0.7, C.NAVY, C.AMBER);
  s.addText("Data, Storage & Tenancy", { x: lx + 1.15, y: 2.15, w: lw - 1.3, h: 0.7, margin: 0, fontFace: BFONT, fontSize: 15, bold: true, color: C.INK, valign: "middle" });
  s.addText([
    { text: "PostgreSQL (Neon serverless) — all structured data, accessed through Prisma.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Supabase S3 storage — documents via AWS SDK v3 (forcePathStyle), one shared bucket.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Key-prefix isolation — every object lives under {tenantId}/… so firms’ files never collide.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Signed URLs — 15-min download links for documents; 7-day links for logos.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Tenant scoping — JWT carries tenantId; middleware stores it in AsyncLocalStorage and every query is filtered by it.", options: { bullet: { code: "2022", indent: 14 } } },
  ], { x: lx + 0.35, y: 2.95, w: lw - 0.65, h: 3.35, margin: 0, fontFace: BFONT, fontSize: 11.3, color: C.SLATE, valign: "top" });

  const rx = 6.95, rw = W - MX - rx;
  s.addShape("rect", { x: rx, y: 1.9, w: rw, h: 4.55, fill: { color: C.NAVY }, line: { type: "none" }, shadow: shadow() });
  iconCircle(s, "shield", rx + 0.3, 2.15, 0.7, C.AMBER, C.NAVY);
  s.addText("Security & Compliance", { x: rx + 1.15, y: 2.15, w: rw - 1.3, h: 0.7, margin: 0, fontFace: BFONT, fontSize: 15, bold: true, color: C.WHITE, valign: "middle" });
  s.addText([
    { text: "JWT signatures verified with a pinned HS256 algorithm; refresh-token rotation on every use.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "bcrypt password hashing (cost 12); secrets never logged.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "RBAC — 5 roles (Super Admin → Secretary); admin routes guarded at router + controller level.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Helmet headers, rate limiting, forced HTTPS, CORS locked to the Vercel origin.", options: { bullet: { code: "2022", indent: 14 }, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Audit log of sensitive actions; documents reachable only via short-lived signed URLs.", options: { bullet: { code: "2022", indent: 14 } } },
  ], { x: rx + 0.35, y: 2.95, w: rw - 0.65, h: 3.35, margin: 0, fontFace: BFONT, fontSize: 11.3, color: C.ICE, valign: "top" });
}

// ── 11 · LEXASSIST AI (RAG) ────────────────────────────────────────────
{
  const s = lightBase(11);
  kicker(s, "Tools — Artificial Intelligence");
  lightTitle(s, "LexAssist AI — Retrieval-Augmented Generation");
  s.addText("Documents uploaded to the DMS are pushed to an n8n Cloud workflow that indexes them into a per-firm knowledge base. Questions are answered using only that firm’s content.",
    { x: MX, y: 1.68, w: W - 2 * MX, h: 0.55, margin: 0, fontFace: BFONT, fontSize: 13, color: C.SLATE });
  const flow = [
    ["file", "1 · Upload", "User uploads a PDF/DOCX to the DMS; it is stored in Supabase S3 under the tenant prefix."],
    ["workflow", "2 · Ingest", "The backend POSTs the file (base64) to the n8n ingest webhook, scoped by tenantId + userId."],
    ["cube", "3 · Index", "n8n chunks, embeds and stores the content in a tenant-scoped vector knowledge base."],
    ["comments", "4 · Ask", "In LexAssist the user asks a question; the backend forwards it to the n8n chat webhook with the session."],
    ["robot", "5 · Answer", "n8n retrieves relevant chunks and returns a grounded answer with sources, saved to chat history."],
  ];
  const gap = 0.28, cw = (W - 2 * MX - gap * 4) / 5, y = 2.5, h = 3.15, x0 = MX;
  flow.forEach((f, i) => {
    const x = x0 + i * (cw + gap);
    s.addShape("rect", { x, y, w: cw, h, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1 }, shadow: shadow() });
    iconCircle(s, f[0], x + (cw - 0.8) / 2, y + 0.28, 0.8, C.NAVY, C.AMBER);
    s.addText(f[1], { x: x + 0.1, y: y + 1.2, w: cw - 0.2, h: 0.4, margin: 0, fontFace: BFONT, fontSize: 12.5, bold: true, color: C.INK, align: "center" });
    s.addText(f[2], { x: x + 0.16, y: y + 1.62, w: cw - 0.32, h: h - 1.72, margin: 0, fontFace: BFONT, fontSize: 9.8, color: C.SLATE, align: "center", lineSpacingMultiple: 1.0 });
    if (i < 4) di(s, "arrowRight", x + cw + (gap - 0.24) / 2, y + 0.62, 0.24, C.AMBER);
  });
  s.addText("Tenant isolation extends to AI: each firm’s vector namespace is keyed by tenantId — no cross-firm knowledge leakage.",
    { x: MX, y: 5.95, w: W - 2 * MX, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 12, italic: true, bold: true, color: C.AMBER_D, align: "center" });
}

// ── 12 · DEPLOYMENT + CI/CD ────────────────────────────────────────────
{
  const s = darkBase();
  kicker(s, "Deployment & DevOps", MX, 0.55);
  s.addText("Deployment — A Fully Free, Production-Shaped Stack", { x: MX, y: 0.9, w: 12.2, h: 0.9, margin: 0, fontFace: HFONT, fontSize: 26, bold: true, color: C.WHITE });
  const svc = [
    ["cloud", "Vercel", "Frontend (React SPA)", "Global CDN, SPA routing, auto-deploy on every push to main."],
    ["server", "Render", "Backend (NestJS, Docker)", "Containerised API; Prisma sync on boot; auto-deploy on push."],
    ["database", "Neon", "PostgreSQL", "Serverless Postgres exposed as DATABASE_URL."],
    ["bolt", "Upstash", "Redis (TLS)", "Managed Redis for the BullMQ queues and response cache."],
    ["folder", "Supabase", "S3 Storage", "S3-compatible bucket for all legal documents."],
    ["workflow", "n8n Cloud", "RAG Workflow", "Hosts the ingest + chat webhooks behind LexAssist AI."],
  ];
  const cols = 3, gap = 0.4, cw = (W - 2 * MX - gap * (cols - 1)) / cols, ch = 1.5, x0 = MX, y0 = 1.95;
  svc.forEach((v, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = x0 + col * (cw + gap), y = y0 + row * (ch + 0.22);
    s.addShape("rect", { x, y, w: cw, h: ch, fill: { color: C.NAVY2 }, line: { color: C.NAVY3, width: 1 } });
    iconCircle(s, v[0], x + 0.22, y + 0.22, 0.56, C.AMBER, C.NAVY);
    s.addText(v[1], { x: x + 0.9, y: y + 0.2, w: cw - 1.1, h: 0.33, margin: 0, fontFace: BFONT, fontSize: 13.5, bold: true, color: C.WHITE });
    s.addText(v[2], { x: x + 0.9, y: y + 0.52, w: cw - 1.1, h: 0.28, margin: 0, fontFace: BFONT, fontSize: 9.5, bold: true, color: C.AMBER_L });
    s.addText(v[3], { x: x + 0.22, y: y + 0.85, w: cw - 0.4, h: ch - 0.92, margin: 0, fontFace: BFONT, fontSize: 9.3, color: C.ICE, lineSpacingMultiple: 0.98 });
  });
  // CI/CD strip
  const stripY = 5.4;
  s.addShape("rect", { x: MX, y: stripY, w: W - 2 * MX, h: 1.55, fill: { color: C.NAVY3 }, line: { type: "none" } });
  const dev = [
    ["gear", "CI", "GitHub Actions runs backend (tsc + build) and frontend (vite build) on every push — a broken build never ships."],
    ["rocket", "CD", "Vercel & Render auto-deploy from main once CI is green."],
    ["clock", "Resilience", "Keep-alive ping every 10 min; client cold-start retry with a “waking up” banner; user-network detection."],
  ];
  const dcw = (W - 2 * MX - 0.6) / 3;
  dev.forEach((d, i) => {
    const x = MX + 0.15 + i * (dcw + 0.15);
    iconCircle(s, d[0], x, stripY + 0.2, 0.5, C.AMBER, C.NAVY);
    s.addText(d[1], { x: x + 0.62, y: stripY + 0.18, w: dcw - 0.7, h: 0.3, margin: 0, fontFace: BFONT, fontSize: 12, bold: true, color: C.WHITE });
    s.addText(d[2], { x: x + 0.62, y: stripY + 0.5, w: dcw - 0.62, h: 0.95, margin: 0, fontFace: BFONT, fontSize: 9, color: C.ICE, lineSpacingMultiple: 0.96 });
  });
  s.addText("Every tier runs on a managed free plan — no credit card — yet the architecture is production-shaped and scalable.",
    { x: MX, y: 7.05, w: W - 2 * MX, h: 0.3, margin: 0, fontFace: BFONT, fontSize: 10.5, italic: true, color: C.SLATE_L, align: "center" });
}

// ── 13 & 14 · RESULTS / DEMO (empty) ───────────────────────────────────
{
  const s = darkBase();
  s.addShape("ellipse", { x: W - 3.2, y: -1.8, w: 5.4, h: 5.4, fill: { color: C.NAVY2 }, line: { type: "none" } });
  iconCircle(s, "gauge", MX, 2.45, 1.15, C.AMBER, C.NAVY);
  s.addText("Results & Demo", { x: MX, y: 3.7, w: 11, h: 1.1, margin: 0, fontFace: HFONT, fontSize: 48, bold: true, color: C.WHITE });
  s.addText("Live walkthrough of the deployed platform", { x: MX, y: 4.8, w: 11, h: 0.6, margin: 0, fontFace: BFONT, fontSize: 18, color: C.AMBER_L });
  s.addText("lex-manage-olive.vercel.app", { x: MX, y: 5.45, w: 11, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 14, italic: true, color: C.ICE });
}
{
  const s = lightBase(14);
  kicker(s, "Results / Demo");
  lightTitle(s, "Live Demonstration");
  s.addText("Walkthrough — onboarding & dashboard · cases, documents & search · LexAssist AI · notifications.",
    { x: MX, y: 1.7, w: W - 2 * MX, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 13, color: C.SLATE });
  const fw = (W - 2 * MX - 0.4) / 2, fh = 4.4, y = 2.35;
  [MX, MX + fw + 0.4].forEach((x) => {
    s.addShape("rect", { x, y, w: fw, h: fh, fill: { color: C.SOFT2 }, line: { color: C.ICE, width: 1.5, dashType: "dash" } });
    iconCircle(s, "eye", x + fw / 2 - 0.45, y + fh / 2 - 0.75, 0.9, C.WHITE, C.SLATE_L);
    s.addText("[ Insert screenshot / live demo ]", { x, y: y + fh / 2 + 0.1, w: fw, h: 0.5, margin: 0, fontFace: BFONT, fontSize: 12.5, italic: true, color: C.SLATE_L, align: "center" });
  });
}

// ── 15 · CONCLUSION ────────────────────────────────────────────────────
{
  const s = darkBase();
  s.addShape("ellipse", { x: -2.3, y: H - 3.0, w: 5.4, h: 5.4, fill: { color: C.NAVY2 }, line: { type: "none" } });
  kicker(s, "Conclusion", MX, 0.6);
  s.addText("LexManage in Summary", { x: MX, y: 0.98, w: 12, h: 0.9, margin: 0, fontFace: HFONT, fontSize: 30, bold: true, color: C.WHITE });
  const points = [
    ["check", "A complete answer to a real problem", "Every law-firm pain point — fragmentation, lost documents, missed deadlines, slow research — maps to a concrete, shipped feature."],
    ["shield", "Secure & multi-tenant by design", "JWT auth, RBAC, per-firm isolation, signed URLs and audit logging protect confidential legal data at every layer."],
    ["robot", "AI that is actually grounded", "LexAssist answers from the firm’s own documents through an isolated RAG workflow — useful, not hallucinated."],
    ["rocket", "Production-shaped, zero-cost deployment", "A modern React + NestJS stack, fully deployed on free managed cloud services with CI/CD and keep-alive."],
  ];
  let y = 2.05; const rh = 1.06;
  points.forEach((p) => {
    iconCircle(s, p[0], MX, y, 0.66, C.AMBER, C.NAVY);
    s.addText(p[1], { x: MX + 0.95, y: y - 0.02, w: 11.2, h: 0.4, margin: 0, fontFace: BFONT, fontSize: 15, bold: true, color: C.WHITE });
    s.addText(p[2], { x: MX + 0.95, y: y + 0.38, w: 11.3, h: 0.6, margin: 0, fontFace: BFONT, fontSize: 11.8, color: C.ICE, lineSpacingMultiple: 1.0 });
    y += rh;
  });
  s.addText("Thank you  —  Questions & Discussion", { x: MX, y: 6.5, w: 12, h: 0.5, margin: 0, fontFace: HFONT, fontSize: 18, bold: true, italic: true, color: C.AMBER_L });
}

pres.writeFile({ fileName: "LexManage_Presentation.pptx" }).then((f) => console.log("WROTE", f));
