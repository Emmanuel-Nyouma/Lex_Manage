# ⚖️ LexManage

**LexManage** is a multi-tenant SaaS Legal Management Platform built for modern law firms. It combines case management, a document repository, a client directory, a smart notification system, and an AI-powered legal research assistant — all in a single, bilingual (FR/EN) interface.

🔗 **Live app:** [lex-manage-olive.vercel.app](https://lex-manage-olive.vercel.app)

---

## ✨ Features

### 🏢 Multi-Tenant Architecture
- Every law firm has its own isolated workspace (tenant)
- Admins invite team members via secure token links
- Role-based access: `SUPER_ADMIN` · `CABINET_ADMIN` · `LAWYER` · `ASSISTANT` · `SECRETARY`
- All DB queries are automatically scoped by `tenantId`

### ⚖️ Case Management
- Create, update, and close legal cases with status tracking (Open → In Progress → Pending → Closed → Archived)
- Link cases to clients from the CRM, or enter a free-text client name (optional)
- Assign cases to lawyers; set priority (Low / Medium / High / Urgent)
- Per-case deadline tracker with due dates and completion status

### 📄 Document Management System (DMS)
- Upload PDF and DOCX files (up to 50 MB) with drag-and-drop
- Organize by **9 categories** and subcategories (Actes de procédures, Contrats, Pièces et preuves, Correspondance, Financier, Internes, **Law Library**, …)
- All category/subcategory labels translate automatically with the UI language toggle (FR ↔ EN)
- Per-document access control by role
- Presigned download links (15-min expiry) via Supabase S3
- Documents auto-ingested into LexAssist AI on upload (when n8n configured)

### 👥 Client Directory
- Full CRUD for individuals and corporate clients
- Link clients to cases; search by name, email, or phone
- Client profile page with associated cases

### 🔔 Notification Center
- Create firm-wide or targeted notifications with level (Normal / Important / Urgent)
- **Templates** for reusable notification drafts
- **Scheduled notifications** with BullMQ delayed jobs — cancel or permanently delete at any time
- Notification history with per-item delete
- Urgent notifications trigger emails via Resend
- Real-time WebSocket push (Socket.io) to all connected users

### 🔍 Hybrid Smart Search
- **Inline suggestions dropdown** in the header as you type (desktop)
- Searches across Cases, Documents, Team Members, and Clients simultaneously
- Hybrid approach: full-phrase match + per-token match, deduplicated — finds partial words
- Full-screen search palette (⌘K / Ctrl+K) on desktop and mobile

### 🤖 LexAssist AI (RAG)
- In-app legal research assistant powered by an n8n Cloud RAG workflow
- Per-firm document knowledge base (tenant-scoped vector store)
- Conversation history saved per user; multiple sessions supported
- Documents are automatically pushed to the knowledge base on upload

### 📅 Calendar & Deadlines
- Monthly/weekly calendar view for hearings and events
- Case deadlines with priority and completion toggle

### 🌐 Bilingual UI (FR / EN)
- Language toggle in Settings — instantly switches all labels including DMS categories
- Dark / Light mode

### 📱 Mobile-First
- Fully responsive on all screen sizes
- Full-screen search palette on mobile
- Compact header that preserves all action buttons on small screens

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Query, Zustand, React Router, Lucide Icons |
| **Backend** | NestJS (TypeScript), Prisma ORM, Zod validation, Socket.io, BullMQ |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **File Storage** | [Supabase Storage](https://supabase.com/storage) (S3-compatible, AWS SDK v3) |
| **Queue / Cache** | [Upstash Redis](https://upstash.com) (TLS, BullMQ delayed jobs) |
| **AI Orchestration** | [n8n Cloud](https://n8n.io) (Legal RAG webhook workflow) |
| **Email** | [Resend](https://resend.com) |
| **Frontend Hosting** | [Vercel](https://vercel.com) |
| **Backend Hosting** | [Render](https://render.com) (Docker web service) |

---

## 🗂️ Project Structure

```
lex-manage/
├── lexmanage-backend/          # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT login, refresh, invitation flow
│   │   │   ├── cases/          # Case CRUD + status management
│   │   │   ├── clients/        # Client directory
│   │   │   ├── documents/      # DMS upload, S3, presigned URLs
│   │   │   ├── notifications/  # Instant, scheduled, templates
│   │   │   ├── search/         # Hybrid global search
│   │   │   ├── chat/           # LexAssist conversation persistence
│   │   │   ├── ai/             # n8n RAG bridge service
│   │   │   ├── calendar/       # Events & deadlines
│   │   │   ├── stats/          # Dashboard KPIs
│   │   │   ├── users/          # Team management
│   │   │   ├── tenants/        # Firm settings + logo
│   │   │   ├── events/         # Socket.io gateway
│   │   │   └── audit/          # Audit log
│   │   └── common/             # Guards, decorators, Zod pipes, schemas
│   ├── prisma/
│   │   └── schema.prisma       # 13 models (Tenant, User, Case, Client, Document, …)
│   └── Dockerfile
├── src/                        # React frontend
│   ├── components/             # Views and reusable UI components
│   ├── hooks/                  # React Query hooks (useCases, useClients, …)
│   ├── config/
│   │   └── dms.config.js       # DMS category tree
│   ├── lib/
│   │   ├── api.js              # Axios + cold-start retry logic
│   │   └── schemas/            # Zod validation (frontend)
│   ├── store/
│   │   └── useLexStore.js      # Zustand global state
│   └── utils/
│       └── translations.js     # FR / EN strings
├── diagrams/                   # Mermaid system diagrams (DFD, ER, Use Case, …)
├── vercel.json                 # SPA routing config
└── docker-compose.yml          # Local dev stack
```

---

## ⚙️ Environment Variables

Copy [`.env.example`](./.env.example) for the complete Docker/full-stack configuration, or [`lexmanage-backend/.env.example`](./lexmanage-backend/.env.example) when running only the API. The checked-in values are safe placeholders; never commit a populated `.env` file.

| Area | Variables |
|---|---|
| Frontend endpoints | `VITE_API_URL`, `VITE_WS_URL` |
| Frontend features | `VITE_ENABLE_AI`, `VITE_SECURE_AUTH` |
| Frontend error reporting | `VITE_SENTRY_DSN` (optional; empty disables Sentry) |
| Database/auth | `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` |
| Application/CORS | `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`, `FRONTEND_URL` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS` |
| S3-compatible storage | `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` |
| AI/n8n | `GEMINI_API_KEY`, `N8N_RAG_CHAT_URL`, `N8N_RAG_INGEST_URL`, `N8N_RAG_DELETE_URL`, `N8N_WEBHOOK_SECRET` |
| Email | `RESEND_API_KEY`, `MAIL_FROM` |
| Optional demo seed | `SEED_ADMIN_EMAIL`, `SEED_LAWYER_EMAIL`, `SEED_USER_PASSWORD` |
| Screenshot automation | `LEXMANAGE_BASE_URL`, `LEXMANAGE_SCREENSHOT_DIR`, `LEXMANAGE_TEST_EMAIL`, `LEXMANAGE_TEST_PASSWORD` |

`VITE_API_URL` is the backend origin, with or without `/api/v1`; the frontend normalizes it. For local non-Docker development use `http://localhost:3001`. Sentry is initialized only when `VITE_SENTRY_DSN` is present. Its integration deliberately removes request bodies, user metadata, tokens, email addresses, UUIDs, and console breadcrumbs so legal/client content is not sent by default.

---

## 🚀 Local Development

Prerequisite: Node.js 22.12 or newer.

```bash
# 1. Clone
git clone https://github.com/Emmanuel-Nyouma/Lex_Manage.git
cd Lex_Manage

# 2. Backend (reproducible install)
cd lexmanage-backend
cp .env.example .env          # fill in your values
npm ci
npx prisma generate
npx prisma db push
npm run start:dev             # runs on :3001

# 3. Frontend (new terminal)
cd ..
cp .env.example .env          # set VITE_API_URL/VITE_WS_URL=http://localhost:3001
npm ci
npm run dev                   # runs on :5173
```

## ✅ Quality checks

Run the same checks locally that GitHub Actions runs on every push and pull request:

```bash
# Frontend
npm run lint
npm run test:coverage
npm run build
npm audit --omit=dev --audit-level=high

# Backend
cd lexmanage-backend
npm run lint
npm run test:coverage
npx prisma validate
npx tsc --noEmit
npm run build
npm audit --omit=dev --audit-level=high
```

Frontend tests use Vitest with Testing Library. Backend tests use Vitest with mocked infrastructure where appropriate. New fixes and features should include tests that demonstrate the expected behavior; see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

The frontend suite enforces a global minimum of 60% for statements, branches, functions, and lines. `npm run test:coverage` exits non-zero if any metric regresses below that gate.

## 🐳 Isolated Docker development

The root Compose file is the canonical self-contained stack: frontend, backend, PostgreSQL, Redis, and MinIO.

```bash
docker compose --env-file .env.example config --quiet
docker compose --env-file .env.example up --build
```

Then open `http://localhost`. Nginx serves the SPA and proxies `/api` and `/socket.io` to the backend on the same origin. Readiness checks verify PostgreSQL, Redis, object storage, the API, and the frontend before dependent services are considered healthy.

The file `lexmanage-backend/docker-compose.yml` starts dependencies only for developers who run the backend directly with `npm run start:dev`; it is not the complete application stack. Docker Desktop or another running Docker daemon is required.

---

## ☁️ Free Deployment Stack

| Service | Purpose | Free tier |
|---|---|---|
| [Render](https://render.com) | Backend (Docker) | 750 h/mo — spins down after 15 min idle |
| [Vercel](https://vercel.com) | Frontend (SPA) | Unlimited |
| [Neon](https://neon.tech) | PostgreSQL | 0.5 GB storage |
| [Upstash](https://upstash.com) | Redis | 10,000 commands/day |
| [Supabase](https://supabase.com) | S3 File Storage | 1 GB storage |
| [n8n Cloud](https://n8n.io) | AI RAG workflow | Free plan |

> **Cold start:** The Render backend sleeps after 15 min. The app auto-retries up to 12× with a visible "Waking up the server…" banner.

### CI/CD

GitHub Actions installs from both lockfiles, validates Prisma, runs frontend and backend lint/tests/builds, checks production dependencies, and rejects a frontend production bundle that contains a localhost API endpoint. After CI succeeds on `main`, Vercel redeploys the frontend and Render redeploys the backend.

---

## 📡 Key API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns JWT + sets refresh cookie |
| POST | `/auth/register` | Register new law firm |
| GET | `/auth/me` | Current user profile |
| GET | `/cases` | List cases (paginated) |
| POST | `/cases` | Create case |
| GET | `/clients` | List clients |
| POST | `/clients` | Create client |
| POST | `/documents/upload` | Upload document to S3 + DMS |
| GET | `/documents/:id/download-url` | Presigned download URL |
| GET | `/search/global?q=` | Hybrid search (cases, docs, members, clients) |
| GET | `/notifications` | User notifications |
| POST | `/notifications/scheduled` | Schedule a future notification |
| DELETE | `/notifications/history/:id` | Delete sent notification |
| POST | `/chat/message` | LexAssist chat message |
| GET | `/health` | Health check |

---

## 🗺️ System Diagrams

Mermaid diagrams are available in [`/diagrams`](./diagrams/):

| Diagram | File |
|---|---|
| Data Flow (Level 0 + Level 1) | [01_data_flow_diagram.md](./diagrams/01_data_flow_diagram.md) |
| Use Case | [02_use_case_diagram.md](./diagrams/02_use_case_diagram.md) |
| Sequence (Login, Case+Upload, AI Chat, Scheduled Notif) | [03_sequence_diagram.md](./diagrams/03_sequence_diagram.md) |
| Activity (Registration, Upload, Case Lifecycle, Search) | [04_activity_diagram.md](./diagrams/04_activity_diagram.md) |
| Entity-Relationship (13 entities) | [05_er_diagram.md](./diagrams/05_er_diagram.md) |

---

## 🤝 Author

**Emmanuel Nyouma** — [github.com/Emmanuel-Nyouma](https://github.com/Emmanuel-Nyouma)

## 📄 License

Proprietary — All rights reserved.
