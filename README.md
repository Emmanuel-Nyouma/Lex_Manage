# ⚖️ LexManage v2 (SaaS Production Edition)

**LexManage** is an enterprise-grade Legal Management Platform with integrated **AI-Powered Legal RAG** (Retrieval-Augmented Generation). This version transitions from a simple demo to a robust **Multi-tenant SaaS architecture** designed for modern law firms.

## 🚀 Key Production Features

### 1. 🏢 Multi-Tenant SaaS Engine
- **Firm Isolation:** Strict data partitioning using Prisma Extensions and AsyncLocalStorage context.
- **Organization Management:** Admins can invite collaborators via secure tokens.
- **Role-Based Access (RBAC):** Distinct permissions for `admin`, `lawyer`, and `paralegal`.

### 2. 🤖 **LexAssist AI: Multi-Tenant RAG Workflow** ✨
**First-class AI research assistant integrated directly into the legal workflow.**

#### Architecture
- **Vector Store:** Pinecone (tenant-scoped namespaces for firm isolation)
- **Embeddings & Reranking:** Cohere (embeddings + reranker for precision retrieval)
- **LLM:** Google Gemini 2.5 Flash (or Gemini 1.5 Pro for complex analysis)
- **Orchestration:** n8n Legal RAG workflow (webhook-based integration)
- **File Storage:** MinIO (tenant-scoped buckets with presigned URLs)

#### Key Capabilities
- **Multi-Tenant & Multi-User:** Each firm's documents isolated in Pinecone namespace `{tenantId}`; conversation memory keyed per user (`tenantId_userId_sessionId`)
- **Supported Formats:** PDF, DOCX, TXT (with plain-text recognition for `.txt` files without magic bytes)
- **Dual Ingestion Paths:**
  1. **Automatic:** Documents auto-ingested to LexAssist on PDF/DOCX upload
  2. **Manual:** "Import to LexAssist AI" button for on-demand ingestion (supports TXT)
- **Conversation Memory:** Per-user session memory maintained across queries
- **Legal-Specific Prompting:** Custom system instructions for legal analysis, zero-hallucination guidance, structured output format

#### Workflow: Document → AI Chat
1. Upload document (PDF, DOCX, TXT) → stored in MinIO with tenant isolation
2. Click **"Import to LexAssist AI"** button (or auto-triggered for PDF/DOCX)
3. n8n ingest webhook → chunks document → embeds with Cohere → indexes in Pinecone under tenant namespace
4. Ask LexAssist a question → webhook sends query + tenantId + userId + sessionId
5. n8n retrieves from Pinecone, reranks with Cohere, passes to Gemini
6. AI responds with document-backed citations and source references

#### Example Query
```
Q: "Quelle est la clause de confidentialité dans le contrat Globale SAS?"
A: "📋 Query Summary: Vous avez demandé la clause de confidentialité...
    📄 Relevant Provisions: L'Article 9 du contrat, intitulé 'Confidentialité'...
    ⚖️ Legal Analysis: Cette obligation s'applique à tous les échanges..."
```

### 3. 📄 Document Management System (DMS) Enhancements
- **File Type Support:** PDF, DOCX, TXT (with smart MIME detection for plain text)
- **Organization:** Categories & sub-categories (CONTRATS, CORRESPONDANCES, etc.)
- **Access Control:** Per-document role-based visibility (Admin-configurable)
- **Pending Documents:** Draft uploads before case association
- **Audit Trail:** All document uploads tracked in AuditLog

### 4. 🔔 Real-Time Intelligence
- **Live Notifications:** Powered by Socket.io for instant updates on case changes.
- **Urgency System:** High-priority alerts trigger instant UI pop-ups for critical deadlines.
- **Automated Reminders:** NestJS Cron jobs scan for upcoming hearings 3 days in advance.

### 5. 🛡️ Security & Compliance
- **JWT Auth:** Secure session management with Access/Refresh tokens.
- **Audit Logs:** Full traceability of every `INSERT` and `UPDATE` on cases, documents, and AI queries.
- **File Privacy:** MinIO-stored documents accessed via secure presigned URLs.
- **Tenant Isolation:** Prisma row-level filters enforce strict firm boundaries on all queries.

## 🛠️ Tech Stack
- **Frontend:** React 19 (Vite), Tailwind CSS, Lucide Icons, React Query, Zustand.
- **Backend:** NestJS, Prisma ORM, PostgreSQL, AsyncLocalStorage (tenant context).
- **Vector DB:** Pinecone (embeddings storage & retrieval).
- **File Storage:** MinIO (S3-compatible document store).
- **AI Orchestration:** n8n (Legal RAG workflow with Cohere + Gemini).
- **Realtime:** Socket.io.
- **Embeddings:** Cohere (embeddings + reranking).

---

## ⚙️ Configuration

### Backend Environment (`.env`)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lexmanage"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRATION="15m"

# MinIO (Document Storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"

# n8n Legal RAG Webhooks
N8N_RAG_CHAT_URL="https://your-n8n-instance.app.n8n.cloud/webhook/legal-rag-chat"
N8N_RAG_INGEST_URL="https://your-n8n-instance.app.n8n.cloud/webhook/legal-rag-ingest"

# Gemini LLM (via n8n)
GEMINI_API_KEY="your-google-ai-api-key"  # Used by n8n agent node
```

### n8n Legal RAG Workflow Setup
The n8n workflow requires:
1. **Pinecone Vector DB connection** (tenant-scoped namespaces)
2. **Cohere credentials** (embeddings + reranker models)
3. **Google Gemini credentials** (LLM agent)
4. **Webhook triggers:** `/legal-rag-chat` and `/legal-rag-ingest`

**Payload format (chat webhook):**
```json
{
  "tenantId": "firm-uuid",
  "userId": "user-uuid",
  "chatInput": "Your legal question here",
  "sessionId": "conversation-session-id",
  "caseId": "optional-case-uuid"
}
```

**Payload format (ingest webhook):**
```json
{
  "tenantId": "firm-uuid",
  "userId": "user-uuid",
  "filename": "document.pdf",
  "buffer": "base64-encoded-file-content",
  "caseId": "optional-case-uuid"
}
```

---

## 📂 Project Structure
```text
lex-manage/
├── lexmanage-backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/
│   │   │   │   ├── ai.controller.ts          # Chat + ingest endpoints
│   │   │   │   ├── ai.module.ts
│   │   │   │   └── n8n-rag.service.ts        # n8n webhook bridge
│   │   │   ├── documents/
│   │   │   │   ├── documents.service.ts      # Upload, validation, storage
│   │   │   │   ├── documents.controller.ts
│   │   │   │   └── minio.service.ts          # MinIO file operations
│   │   │   └── auth/
│   │   │       └── jwt.strategy.ts
│   │   └── common/
│   │       ├── context/
│   │       │   └── tenant.context.ts         # AsyncLocalStorage tenant isolation
│   │       └── middleware/
│   │           └── tenant.middleware.ts      # JWT → tenantId extraction
│   └── prisma/
│       ├── schema.prisma                     # ORM schema (multi-tenant)
│       └── prisma.service.ts                 # Row-level isolation filters
├── src/
│   ├── components/
│   │   ├── DocumentUpload.jsx                # Upload UI (PDF/DOCX/TXT)
│   │   └── ChatInterface.jsx                 # LexAssist chat UI
│   ├── hooks/
│   │   ├── useClients.js                     # CRUD mutations
│   │   ├── useLexStore.js
│   │   └── useNotifications.js
│   └── lib/
│       ├── documentService.js                # Frontend upload logic
│       └── api.js                            # Axios instance
└── README.md (this file)
```

---

## 🔌 API Endpoints

### AI & Chat
- **POST** `/api/v1/ai/chat` — Chat with LexAssist (from case/matter views)
- **POST** `/api/v1/ai/dashboard-chat` — Chat with LexAssist (from dashboard)
- **POST** `/api/v1/ai/ingest-document` — Manually ingest a DMS document to LexAssist

### Documents
- **POST** `/api/v1/documents/upload` — Upload document (auto-ingests PDF/DOCX)
- **GET** `/api/v1/documents` — List firm documents (paginated, categorized)
- **GET** `/api/v1/documents/:id` — Get document details
- **GET** `/api/v1/documents/:id/download-url` — Generate presigned download link
- **PATCH** `/api/v1/documents/:id` — Update document metadata
- **DELETE** `/api/v1/documents/:id` — Archive/delete document

### Clients
- **GET** `/api/v1/clients` — List firm clients
- **POST** `/api/v1/clients` — Create client
- **PATCH** `/api/v1/clients/:id` — Update client
- **DELETE** `/api/v1/clients/:id` — Delete client

---

## 🚀 Getting Started

### Local Development
```bash
# Backend
cd lexmanage-backend
npm install
npm run start:dev

# Frontend (separate terminal)
cd ..
npm install
npm run dev
```

### Docker Compose Stack
```bash
docker-compose up -d
# Starts: PostgreSQL, MinIO, Pinecone emulator (optional)
```

### Verify Setup
1. Backend running on `http://localhost:3001`
2. Frontend running on `http://localhost:5173`
3. MinIO console on `http://localhost:9001` (minioadmin/minioadmin)
4. PostgreSQL on `localhost:5432`

---

## 🧪 Testing the RAG Workflow

### Step 1: Upload a Document
```bash
curl -X POST http://localhost:3001/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@contract.txt;type=text/plain" \
  -F "name=Legal Contract" \
  -F "category=CONTRATS"
```

### Step 2: Ingest to LexAssist AI
```bash
curl -X POST http://localhost:3001/api/v1/ai/ingest-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId": "DOCUMENT_ID_FROM_STEP_1"}'
```

### Step 3: Chat with LexAssist
```bash
curl -X POST http://localhost:3001/api/v1/ai/dashboard-chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quelle est la clause de confidentialité?",
    "sessionId": "my-conversation-1"
  }'
```

---

## 🔐 Multi-Tenant Security Model

- **Tenant Binding:** Every user JWT contains `tenantId`; middleware extracts and stores in AsyncLocalStorage
- **Row-Level Filters:** Prisma extensions auto-inject `tenantId` filter on all TENANT_BOUND_MODELS queries
- **Vector DB Isolation:** Pinecone namespaces use `{tenantId}` as the namespace key
- **File Isolation:** MinIO bucket names include tenant prefix: `lex-{tenantId-prefix}`
- **Session Isolation:** Conversation memory keys: `{tenantId}_{userId}_{sessionId}`

---

## ⚠️ Known Limitations

### Gemini Free Tier Quota
- **Limit:** 5 requests per minute, ~20 per day (free-tier model)
- **Solution:** Upgrade to Gemini 1.5 Pro (paid API) or use DeepSeek via OpenRouter with sufficient balance

### TXT File Detection
- **Issue:** Plain text files have no magic bytes; detection relies on client-declared MIME type
- **Solution:** Frontend sends `type=text/plain`; backend validates & stores

---

## 🤝 Author
[Emmanuel Nyouma](https://github.com/Emmanuel-Nyouma)

## 📄 License
Proprietary — LexManage SaaS Edition
