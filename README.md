# ⚖️ LexManage v2 (SaaS Production Edition)

**LexManage** is an enterprise-grade Legal Management Platform. This version transitions from a simple demo to a robust **Multi-tenant SaaS architecture** designed for law firms.

## 🚀 Key Production Features

### 1. 🏢 Multi-Tenant SaaS Engine
- **Firm Isolation:** Strict data partitioning using Prisma Extensions and AsyncLocalStorage context.
- **Organization Management:** Admins can invite collaborators via secure tokens.
- **Role-Based Access (RBAC):** Distinct permissions for `admin`, `lawyer`, and `paralegal`.

### 2. 🔔 Real-Time Intelligence
- **Live Notifications:** Powered by Socket.io for instant updates on case changes.
- **Urgency System:** High-priority alerts trigger instant UI pop-ups for critical deadlines.
- **Automated Reminders:** NestJS Cron jobs scan for upcoming hearings 3 days in advance.

### 3. 🛡️ Security & Compliance
- **JWT Auth:** Secure session management with Access/Refresh tokens.
- **Audit Logs:** Full traceability of every `INSERT` and `UPDATE` on cases.
- **File Privacy:** MinIO-stored documents accessed via secure presigned URLs.

### 4. 🤖 AI-Powered RAG (Gemini 1.5 Pro)
- **Massive Context Window:** Analyze entire case files in seconds.
- **Dynamic Citations:** AI responses include precise page references.

## 🛠️ Tech Stack
- **Frontend:** React 19 (Vite), Tailwind CSS, Lucide Icons.
- **State:** Zustand (Global Store & Notifications).
- **Backend:** NestJS, Prisma ORM, PostgreSQL.
- **Realtime:** Socket.io.
- **AI:** Google Gemini 1.5 Pro.

---

## 📂 Project Structure Refactor
```text
lex-manage/
├── supabase/            
│   ├── setup.sql        # SaaS Architecture (RLS, Triggers, Functions)
├── src/
│   ├── components/      # UI Views (Calendar, Admin, CompanySettings)
│   ├── hooks/           # useNotifications (Realtime), useIdleTimeout
│   ├── store/           # useLexStore (Auth & Profile sync)
```

## 🤝 Author
[Emmanuel Nyouma](https://github.com/Emmanuel-Nyouma)
