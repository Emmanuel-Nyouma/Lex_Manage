# Sequence Diagrams — LexManage

## Sequence 1 — User Login & Session Initialization

```mermaid
sequenceDiagram
    actor User as 👤 User (Browser)
    participant Frontend as ⚛️ React Frontend\n(Vercel)
    participant Backend as 🏗️ NestJS API\n(Render)
    participant DB as 🗃️ PostgreSQL\n(Neon)
    participant Redis as ⚡ Redis\n(Upstash)

    User->>Frontend: Enter email + password
    Frontend->>Backend: POST /auth/login {email, password}
    Backend->>DB: SELECT user WHERE email=? AND tenant active
    DB-->>Backend: User record + passwordHash
    Backend->>Backend: bcrypt.compare(password, hash)
    alt Invalid credentials
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: ❌ Animated "Incorrect email or password" banner
    else Valid credentials
        Backend->>Backend: Sign accessToken (15min JWT)
        Backend->>Backend: Sign refreshToken (7d JWT)
        Backend->>DB: UPDATE user SET refresh_token = hash(refreshToken)
        DB-->>Backend: OK
        Backend-->>Frontend: 200 {accessToken} + Set-Cookie: refresh_token (HttpOnly, SameSite=None, Secure)
        Frontend->>Frontend: Store accessToken in Zustand memory
        Frontend->>Backend: GET /auth/me (Authorization: Bearer <token>)
        Backend->>DB: SELECT user + tenant
        DB-->>Backend: currentUser
        Backend-->>Frontend: currentUser profile
        Frontend-->>User: ✅ Redirect to Dashboard
    end
```

---

## Sequence 2 — Create Case & Upload Document

```mermaid
sequenceDiagram
    actor Lawyer as ⚖️ Lawyer
    participant FE as ⚛️ Frontend
    participant API as 🏗️ NestJS API
    participant DB as 🗃️ PostgreSQL
    participant S3 as 🗄️ Supabase S3
    participant n8n as 🤖 n8n RAG Agent

    Lawyer->>FE: Fill "New Case" form + attach document
    FE->>API: POST /cases {title, clientId?, status, priority}
    API->>API: Validate with Zod schema
    API->>DB: INSERT INTO cases
    DB-->>API: New Case record (id)
    API-->>FE: 201 {case}

    FE->>API: POST /documents/upload (multipart: file + caseId)
    API->>API: Extract tenantId, generate S3 key
    API->>S3: PutObjectCommand (key: tenantId/caseId/filename)
    S3-->>API: ETag
    API->>DB: INSERT INTO documents (metadata + s3_key)
    DB-->>API: Document record
    API->>n8n: POST N8N_RAG_INGEST_URL {tenantId, filename, fileData (base64), caseId}
    Note over API,n8n: Fire-and-forget — failures do not block response
    API-->>FE: 201 {document + presignedUrl}

    FE-->>Lawyer: ✅ "Case created" toast + list refreshes via React Query invalidation
```

---

## Sequence 3 — LexAssist AI Chat (RAG)

```mermaid
sequenceDiagram
    actor Lawyer as ⚖️ Lawyer
    participant FE as ⚛️ Frontend
    participant API as 🏗️ NestJS API
    participant DB as 🗃️ PostgreSQL
    participant n8n as 🤖 n8n RAG Workflow
    participant VectorDB as 🧠 Vector DB\n(n8n managed)

    Lawyer->>FE: Type question in LexAssist chat
    FE->>API: POST /chat/message {conversationId, content, caseId?}
    API->>DB: INSERT ChatMessage (role: "user")

    API->>n8n: POST N8N_RAG_CHAT_URL\n{tenantId, userId, chatInput, sessionId, caseId}
    n8n->>VectorDB: Similarity search (tenant-scoped)
    VectorDB-->>n8n: Relevant document chunks + metadata
    n8n->>n8n: Build prompt with context + chat history
    n8n->>n8n: LLM inference (Claude/OpenAI)
    n8n-->>API: {answer, sources[], confidence}

    API->>DB: INSERT ChatMessage (role: "assistant", content: answer, sources: JSON)
    DB-->>API: Saved message
    API-->>FE: {answer, sources, confidence}
    FE-->>Lawyer: Render markdown answer + source citations
```

---

## Sequence 4 — Scheduled Notification

```mermaid
sequenceDiagram
    actor Admin as 🏛️ Cabinet Admin
    participant FE as ⚛️ Frontend
    participant API as 🏗️ NestJS API
    participant DB as 🗃️ PostgreSQL
    participant Queue as ⚡ BullMQ (Redis)
    participant Worker as 🔧 Reminders Worker
    participant WS as 📡 WebSocket Gateway
    participant Email as 📧 Resend (Email)

    Admin->>FE: Create scheduled notification (date + message + roles)
    FE->>API: POST /notifications/scheduled {level, motif, scheduledAt, recipientRoles}
    API->>DB: INSERT scheduled_notifications (status: PENDING)
    DB-->>API: record.id

    API->>Queue: remindersQueue.add("send-scheduled-notification",\n{scheduledNotifId}, {delay: scheduledAt - now})
    Queue-->>API: jobId
    API->>DB: UPDATE scheduled_notifications SET jobId
    API-->>FE: 201 Scheduled notification created
    FE-->>Admin: ✅ Appears in "Scheduled" tab

    Note over Queue,Worker: At scheduledAt time...
    Queue->>Worker: Dequeue job
    Worker->>DB: SELECT scheduled_notification + tenant
    Worker->>DB: INSERT notification (for all matching-role users)
    Worker->>WS: sendToTenant(tenantId, "notification.new", payload)
    WS-->>FE: 📡 Real-time push to connected users

    alt level === URGENT
        Worker->>Email: Send email to all recipients
        Email-->>Worker: Delivered
    end

    Worker->>DB: UPDATE scheduled_notification SET status = SENT
```
