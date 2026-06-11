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
│   ├── components/             # All views and UI components
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

### Backend (`lexmanage-backend/.env`)

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@host/lexmanage?sslmode=require"

# JWT
JWT_SECRET="your-secret"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_SECRET="your-refresh-secret"

# Supabase S3 Storage
S3_ENDPOINT="https://<project-id>.supabase.co/storage/v1/s3"
S3_REGION="eu-west-2"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"

# Redis (Upstash)
REDIS_HOST="your-host.upstash.io"
REDIS_PORT=6379
REDIS_PASSWORD="your-password"
REDIS_TLS=true

# n8n RAG Webhooks
N8N_RAG_CHAT_URL="https://your-n8n.app.n8n.cloud/webhook/legal-rag-chat"
N8N_RAG_INGEST_URL="https://your-n8n.app.n8n.cloud/webhook/legal-rag-ingest"

# Email (Resend) — optional
RESEND_API_KEY="re_xxxxxxxxxxxx"
```

### Frontend (`.env`)

```bash
VITE_API_BASE_URL="https://your-backend.onrender.com"
```

---

## 🚀 Local Development

```bash
# 1. Clone
git clone https://github.com/Emmanuel-Nyouma/Lex_Manage.git
cd Lex_Manage

# 2. Backend
cd lexmanage-backend
cp .env.example .env          # fill in your values
npm install
npx prisma db push
npm run start:dev             # runs on :3001

# 3. Frontend (new terminal)
cd ..
cp .env.example .env          # set VITE_API_BASE_URL=http://localhost:3001
npm install
npm run dev                   # runs on :5173
```

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
Push to `main` → Vercel redeploys frontend automatically. Render redeploys backend automatically.

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
