# ⚖️ LexManage v2 (SaaS Production Edition)

**LexManage** is an enterprise-grade Legal Management Platform. This version transitions from a simple demo to a robust **Multi-tenant SaaS architecture** designed for law firms.

## 🚀 Key Production Features

### 1. 🏢 Multi-Tenant SaaS Engine
- **Firm Isolation:** Strict data partitioning using PostgreSQL Row Level Security (RLS).
- **Organization Management:** Admins can invite collaborators via secure tokens.
- **Role-Based Access (RBAC):** Distinct permissions for `admin`, `lawyer`, and `paralegal`.

### 2. 🔔 Real-Time Intelligence
- **Live Notifications:** Powered by Supabase Realtime for instant updates on case changes.
- **Urgency System:** High-priority alerts trigger instant UI pop-ups for critical deadlines.
- **Automated Reminders:** PostgreSQL functions (RPC) scan for upcoming hearings 3 days in advance.

### 3. 🛡️ Security & Compliance
- **MFA (2FA):** Support for TOTP (Google Authenticator) via Supabase MFA.
- **Audit Logs:** Full traceability of every `INSERT` and `UPDATE` on cases.
- **Soft Delete:** Accidental deletions can be recovered via the `deleted_at` architecture.

### 4. 🤖 AI-Powered RAG (Gemini 1.5 Pro)
- **Massive Context Window:** Analyze entire case files in seconds.
- **Dynamic Citations:** AI responses include precise page references.

## 🛠️ Tech Stack
- **Frontend:** React 19 (Vite), Tailwind CSS, Lucide Icons.
- **State:** Zustand (Global Store & Notifications).
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions).
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
