# LexManage — Likely Jury Questions & Answers
## B.Tech Defense Preparation

These are the hard questions a jury will ask about architecture, trade-offs, security, and market fit. **Read the answer, then say it in your own words.** Never memorize — understand and improvise.

---

## ARCHITECTURE & DESIGN DECISIONS

### Q1: Why NestJS and not just Express or plain Node.js?

**A:** Express is fine for small projects, but as code grows it becomes messy — no forced structure, no clear patterns, spaghetti routes and controllers. NestJS enforces a clean modular architecture: one module per feature (auth, cases, documents, etc.), each with a controller and service. It has built-in support for guards (permission checks), pipes (validation), middleware, and dependency injection. For a project with 17 modules and real security requirements, that structure is invaluable. A jury cares that you chose the right tool for the scope, not the simplest tool.

---

### Q2: Why PostgreSQL and not MongoDB or another NoSQL database?

**A:** Legal data is **relational**. A case belongs to a firm, has multiple documents, has deadlines, has involved parties. These relationships matter — a document must link to exactly one case, not float alone. PostgreSQL enforces those relationships with constraints and foreign keys, so a corrupt state (a document with no case) is impossible. With MongoDB, you'd have to enforce relationships in code, which is error-prone. Also, PostgreSQL gives you ACID guarantees — if a transaction fails halfway through, the database rolls back automatically. For financial or legal data, that atomicity is critical. NoSQL trades safety for flexibility; we don't need that flexibility, so we chose safety.

---

### Q3: Why Prisma ORM instead of raw SQL or TypeORM?

**A:** Prisma is type-safe — if I write a query wrong, TypeScript catches it before runtime. It also **automatically parameterizes every query**, which makes SQL injection impossible by design. With raw SQL, one mistake like `const query = "SELECT * FROM cases WHERE id = " + userId` and you've got a vulnerability. Prisma prevents that. TypeORM is more powerful but also more complex; Prisma is simpler and perfect for this scope. Also, Prisma's schema file is the single source of truth for the data model — no separate migrations to keep in sync.

---

### Q4: Why cursor-based pagination instead of OFFSET-based pagination?

**A:** With OFFSET, when you ask for page 100, the database scans and skips rows 0–999 to get to page 100. As data grows to millions of rows, that's slow — O(n) complexity. Cursor pagination uses an index to jump straight to the last-seen item and get the next batch — O(log n), constant-time regardless of scale. For a system meant to grow (many firms, many cases, many documents), OFFSET becomes a bottleneck. Cursor pagination is industry-standard for this reason and shows you're thinking about performance at scale, not just making it work today.

---

### Q5: Why free cloud services (Render, Neon, Upstash) instead of AWS or enterprise hosting?

**A:** Two reasons. One, it proves the architecture is sound — if it works on free tiers, it'll work anywhere. Many startups build on expensive infra and never optimize, then get crushed when they scale. Forcing myself to use free services meant I had to be efficient: stateless backend, caching, cursor pagination. Two, it's honest about the market — small African law firms can't afford $500/month hosting. Running on free cloud tiers means the software can be free or very cheap, which is the only way small firms will adopt it. This is a business insight, not a technical limitation.

---

## SECURITY & MULTI-TENANCY

### Q6: How exactly do you prevent one firm from seeing another firm's data?

**A:** Every user's login token (JWT) contains their firm's ID (tenantId). On every request, a middleware verifies that token and extracts the tenantId. Then, every database query is automatically scoped by that tenantId. So a query like "SELECT * FROM cases" becomes "SELECT * FROM cases WHERE tenantId = $1" with the firm's ID bound. At the data layer, it's impossible to fetch a case belonging to another firm. Files are also stored under `{tenantId}/...` paths in S3, so storage is isolated too. Real-time messages go to Socket.io rooms named `tenant_{tenantId}`, so one firm can never receive another firm's notifications. The isolation is enforced at three layers — data, storage, and real-time — so even if one layer has a bug, the other two catch it.

---

### Q7: What if someone forges a JWT token and claims to be another firm?

**A:** They can't. The token is cryptographically signed with a secret key that only the server knows. When the server receives a token, it verifies the signature — if even one character is changed, the signature check fails and the request is rejected immediately. I also pin the algorithm to HS256, so an attacker can't trick the server into accepting an unsigned token by changing the algorithm field. If they don't know the secret key, they cannot forge a valid token. And if they steal a token, it expires in 15 minutes (the access token TTL), so the window of vulnerability is small.

---

### Q8: How do you protect against SQL injection?

**A:** I never build SQL by concatenating strings. I use Prisma, which sends every parameter separately from the query structure. So even if user input contains malicious SQL like `'; DROP TABLE cases; --`, it's treated as a literal string value, not executable code. SQL injection is only possible when you mix code and data in the same string; Prisma prevents that by design. This is true for any ORM or parameterized query library — the key is using it, not working around it.

---

### Q9: Why two tokens (access + refresh) instead of one long-lived token?

**A:** It's a security trade-off. If someone steals a token, a short-lived access token (15 minutes) is only useful for 15 minutes. After that, it's worthless. The refresh token is stored more safely (not in localStorage where XSS can grab it) and is only sent on refresh requests, not on every API call. So if the access token is stolen, the damage is limited. If someone steals a refresh token, they can get new access tokens, but the server can detect unusual refresh patterns and revoke it. This layered approach limits the damage of either token being stolen.

---

### Q10: Why not encrypt sensitive fields at rest in the database?

**A:** That's a valid next step, but it introduces complexity: key management, performance overhead, and harder debugging. For an MVP, I chose not to do it because the bigger wins are elsewhere — isolation (preventing access), HTTPS (preventing interception), and rate limiting (preventing brute force). Field encryption is important for a mature product; for an MVP launched to trusted early users within a firm, it's premature optimization. I'd add it if the product gets real traction and handles HIPAA or other regulated data.

---

### Q11: What happens if the database is hacked and all rows are stolen?

**A:** Passwords are hashed with bcrypt cost-12, so the real passwords cannot be recovered. Case files, documents, and client info would be exposed — that's bad — but at least passwords are safe. Beyond that, I'm relying on the managed database provider's security (Neon in this case). For a production product, I'd add field-level encryption for the most sensitive data, regular penetration testing, and compliance audits. For an MVP, I'm trusting the provider's infrastructure security while protecting the passwords layer locally.

---

## TECHNOLOGY & TOOL CHOICES

### Q12: Why React 19 instead of Vue or Svelte?

**A:** React is the most popular, has the largest ecosystem, and the most job opportunities for developers. It's not technically superior to Vue or Svelte — they're all good. But React's dominance means more components, more libraries, more Stack Overflow answers, more developers available. For a project meant to be maintained and extended, ecosystem size matters. If I were building this as a solo project forever, Svelte's simplicity might win. But for a product that could be worked on by others, React is the pragmatic choice.

---

### Q13: Why Socket.io instead of raw WebSockets?

**A:** Socket.io is built on top of WebSockets but adds fallbacks for older browsers and networks that block WebSockets. It also gives you rooms (pub/sub), so I can easily send a message to all users in a firm without broadcasting to everyone. Raw WebSockets work, but you'd have to build rooms and reconnection logic yourself. Socket.io saves a lot of boilerplate and handles edge cases I might otherwise miss.

---

### Q14: Why n8n for the AI workflow instead of building it yourself?

**A:** n8n lets me build the document-ingestion and question-answering pipeline **visually** without writing code. I can add a new step (e.g., "embed this chunk") by clicking a node, not writing a Python service. It's also **separate from the main app**, so if the AI pipeline is slow or crashes, it doesn't take down the case-management system. If I built it as a service inside NestJS, any bug could break the whole app. n8n also handles scheduling, retries, and logging automatically. For an MVP, this buys me weeks of development time. Later, if performance becomes critical, I could replace n8n with a custom service — the API contract stays the same.

---

### Q15: Why Zustand instead of Redux or Context for state management?

**A:** Redux is powerful but verbose — boilerplate for every action. Context is simple but causes unnecessary re-renders if not careful. Zustand is minimal: define a store, use it in components, done. For a project this size, I don't need Redux's time-travel debugging or middleware ecosystem. Zustand is just enough. Also, Zustand persists state automatically to localStorage, so the user stays logged in across page refreshes.

---

## SCALABILITY & PERFORMANCE

### Q16: How does the system scale to 1000 firms or 1 million cases?

**A:** Several ways. One, the backend is stateless — no user data in memory. So I can run many backend copies behind a load balancer and they all work. Two, cursor pagination means queries stay O(log n) fast even with millions of rows. Three, Redis caching means repeated queries don't hit the database. Four, the database (Neon) scales automatically on paid tiers — no code changes needed. Five, the frontend is lazy-loaded and code-split, so adding more firms or cases doesn't slow down page load. The architecture was designed for scale from the start, not bolted on later.

---

### Q17: What about concurrent users? If 100 lawyers are logged in, does the system break?

**A:** No. The backend is stateless, so 100 concurrent users means 100 concurrent requests handled by the process pool. Node.js handles this well via the event loop. If one request is slow (a big file upload), it doesn't block others. Real-time messages (Socket.io) are event-driven and scale to thousands of concurrent connections. The bottleneck would be the database — if all 100 make the same expensive query at once, they queue. That's solved by caching (Redis) so repeated queries don't hit the database. For 100 concurrent users, this system is more than fine. At 10,000 concurrent users (a major SaaS), I'd need to optimize further — denormalization, read replicas, etc.

---

### Q18: What's the database query performance like on a typical operation, like loading a case list?

**A:** A case list query is:
```sql
SELECT * FROM cases WHERE tenantId = $1 AND status = $2
  ORDER BY createdAt DESC, id DESC 
  LIMIT 21 CURSOR-BASED
```
With an index on `(tenantId, status, createdAt, id)`, this runs in milliseconds even with millions of rows. The result is cached in Redis for 5 minutes, so repeat queries (from different lawyers or page refreshes) skip the database. If a new case is created, the cache is invalidated, so the next query gets fresh data. This balances freshness and performance.

---

## MARKET & DOMAIN

### Q19: Why focus on legal specifically? Why not build a general case-management tool?

**A:** Because legal has unique requirements that general tools miss. Deadlines are non-negotiable (a missed filing deadline loses a case). Confidentiality is absolute (one firm seeing another's case is a breach). Audit trails are required (who accessed what, when). Most general project-management tools treat deadlines as nice-to-have, don't enforce isolation, and don't log access. Building for legal forces you to get these right from day one. It's also a domain I understand — my team has legal connections, so I can validate with real users. Better to build great for one domain than mediocre for many.

---

### Q20: Why Africa? Why not target the US or Europe first?

**A:** Because there's less competition and higher impact. US law firms use Westlaw, LexisNexis, and dozens of other tools — the market is crowded and expensive. African law firms have fewer options, lower budgets, and more pain. A tool that costs $0 to $50/month is revolutionary for a 5-person firm in Cameroon; it's an afterthought in New York. Also, I'm building for bilingual work (French/English), which is specific to Africa and the Caribbean. US tools ignore this. It's a market gap — I'd rather own 80% of Africa than compete for 2% of the US.

---

### Q21: How do you compete with LexisNexis or Westlaw?

**A:** I don't, yet. Those are billion-dollar companies serving large firms with expensive, feature-rich platforms. I'm targeting small and medium firms — 5 to 50 people — that can't afford those tools and don't need all those features. In Africa, those companies often don't have local support, local languages, or local pricing. As I grow and add more features, I might eventually compete in a subset, but the initial strategy is to own the underserved small-firm market first.

---

## AI & RAG

### Q22: Why RAG instead of training a legal model?

**A:** (See earlier detailed answer, but shorter version:) Training a legal model requires $100K+ budget, 6 months, and labeled data. RAG uses an existing strong model and grounds it in each firm's documents. Law changes constantly — a trained model becomes stale; RAG always uses current documents. Legal answers need sources; RAG shows them; trained models can't. Firm data stays confidential in RAG; it goes into model weights with training. For this project and market, RAG is the right choice.

---

### Q23: How do you handle hallucination? What if the AI gives a wrong answer?

**A:** RAG dramatically reduces hallucination because the AI only answers using the firm's documents — it can't invent facts outside them. But it can still misunderstand or misinterpret a document. That's why sources are shown: the lawyer can read the original document and verify. The interface also has a disclaimer: "LexAssist assists but does not replace professional legal judgment." The AI is a research tool, not a decision-maker. If a lawyer acts on a wrong AI answer without checking the source, that's their responsibility, not the system's. This is similar to how Google gives search results — Google doesn't guarantee accuracy; the user is responsible for verifying.

---

### Q24: If the firm's vector database is hacked, are their documents exposed?

**A:** Yes — the documents are stored there unencrypted. But the vector database is inside the firm's n8n workspace (not public), and n8n is enterprise-grade. For a production system, I'd add encryption at rest for the vector DB and restrict access to it. For an MVP on trusted cloud services, I'm relying on the provider's security.

---

### Q25: Can the AI answer questions about another firm's documents?

**A:** No. The vector database is tenant-scoped. When Firm A asks a question, only Firm A's embeddings are searched. The retrieval step is filtered by tenantId, so Firm B's documents are literally invisible to the search. This is the same isolation enforced everywhere else in the system.

---

## LIMITATIONS & FUTURE WORK

### Q26: What major features are not implemented?

**A:** Three things: First, billing and invoicing — the time-tracking module exists, but the auto-invoicing pipeline doesn't. Second, two-factor authentication for login — it's secure with JWT, but 2FA would be better. Third, offline support — the app requires internet; later versions could sync queued actions and work offline. All three are feasible next steps; I prioritized the core features for the MVP.

---

### Q27: If you had 3 more months, what would you build?

**A:** One, two-factor authentication (SMS or authenticator app) to harden login. Two, automated unit and integration tests in the CI pipeline — I have manual testing but no test suite. Three, offline support so lawyers can work without internet and sync when reconnected. Four, a mobile app (native iOS/Android) instead of just responsive web, because lawyers are always mobile. Five, field-level encryption for the most sensitive data (client names, case facts).

---

### Q28: What's the biggest technical debt in the project?

**A:** Lack of automated tests. I did thorough manual testing, but no Jest or Cypress test suite. For a production product, tests are essential — they catch regressions and let you refactor with confidence. I'd make tests a first priority if this went to real users. The other debt is some code duplication in form components, but it's manageable for the current scope.

---

### Q29: What would you do if 1000 firms signed up tomorrow?

**A:** The architecture is already multi-tenant and stateless, so it would mostly just work. I'd move the database, Redis, and backend to paid tiers with auto-scaling. Render and Vercel already auto-scale, so the frontend would handle it. The bottleneck would be the n8n workflow for RAG — I'd need to upgrade that or build a custom embedding pipeline. But the core system is designed for growth; I'd just upgrade infrastructure, not redesign the app.

---

### Q30: Why is this a B.Tech project and not a startup?

**A:** (Optional, defensive but good to have ready:) It's both. For B.Tech, it demonstrates full-stack engineering: database design, API architecture, real-time systems, security, deployment, and thinking about a real market. For a startup, the only missing pieces are growth/marketing and raising money. The technology is production-ready. I built it as a B.Tech project to learn, but it's also a real product that could launch. In fact, my plan after graduation is to formalize it as a startup if there's market demand.

---

## DOMAIN-SPECIFIC DEEP DIVES

### Q31: How do you handle case status transitions (OPEN → IN PROGRESS → PENDING → CLOSED)?

**A:** Cases have a `status` enum field. Frontend buttons (like "mark in progress") are only shown if the current role and status allow it — you can't mark a case CLOSED if it's already CLOSED. The backend validates the transition too — even if someone calls the API directly, the server checks it's a legal transition. This prevents invalid states. For complex workflows (e.g., "can only close if all invoices are paid"), that's logic for future versions; the MVP enforces basic transitions.

---

### Q32: How do you ensure document uploads are real legal documents and not malware?

**A:** The system checks file type (PDF, DOCX only) and scans the MIME type. For a production system, I'd add virus scanning (ClamAV or similar) and file size limits to prevent abuse. For the MVP, I'm trusting lawyers won't upload malware to their own firm account. The bigger security concern is who **can** upload, which is controlled by roles.

---

### Q33: How do you handle document versioning? If a lawyer uploads a new version of a contract, does the old one disappear?

**A:** Currently, uploading a new file creates a new document entry; the old one isn't deleted. For a real legal system, you'd want versioning — marking versions as "current", "archived", "superseded". That's a feature for a future version. The MVP keeps all documents and lets lawyers organize them by case and category.

---

### Q34: How do you handle calendar conflicts? If two lawyers claim the same hearing slot, what happens?

**A:** Currently, the calendar allows overlaps — it's just a list of events sorted by date. For a mature system, you'd add conflict detection and reservation rules. The MVP assumes lawyers are cooperative and use the calendar responsibly. Conflict detection is a nice-to-have for later.

---

### Q35: How do you audit who accessed a client's file?

**A:** Every sensitive action (view document, edit case, send notification) is logged to the `AuditLog` table with: userId, action, resource, timestamp. So there's a record of "Lawyer A viewed document X at 3pm on June 15". The system doesn't yet have a UI for viewing audit logs, but the data is collected. This is MVP-level auditing; a compliance product would add more granular logging (field-level changes, IP addresses, etc.).

---

## WRAP-UP: THE STRONG CLOSING ANSWER

### Q: If the jury asks something you don't have a perfect answer for:

**A:** "That's a great question and I thought about it, but for the MVP I made a conscious trade-off. I chose to [prioritize X] over [Y] because [reason]. If this went to real users, I'd add [Y] in the next version. Here's what I did to mitigate the risk: [mitigation]."

**Example:** "That's great — offline support would be valuable. For the MVP I prioritized core features. For offline, the risk is that lawyers work without internet and lose data. I could mitigate that by adding a sync queue in localStorage so actions are queued and sent when internet returns. That's the first thing I'd add if this went live."

Never say "I don't know" or "I didn't think about it." Always frame it as a conscious trade-off.

---

## REMEMBER

1. **Answer with a reason.** Not "I used Prisma," but "I used Prisma because it's type-safe and prevents SQL injection."
2. **Connect to the domain.** For legal: "This matters because confidentiality is non-negotiable."
3. **Show maturity.** Admit limitations; don't pretend everything is perfect.
4. **Explain trade-offs.** "I chose A over B because..." shows you thought deeply.
5. **Keep it simple.** Juries are not all technical. Explain like you're talking to a smart non-engineer.

Good luck. You know this project better than anyone in the room.
