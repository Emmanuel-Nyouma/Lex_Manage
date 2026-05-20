# ⚖️ LexManage - Technical & Functional Documentation

## 📝 Project Overview
**LexManage** is a high-performance, enterprise-grade Legal Management Platform (SaaS) designed to transform law firms' operations. It combines traditional legal ERP features (CRM, Time Tracking, Billing) with advanced AI capabilities (RAG via Gemini 1.5 Pro).

---

## 🛠️ Tech Stack
- **Frontend:**
  - **Framework:** React 19 (Vite)
  - **Styling:** Tailwind CSS (Modern, Responsive, Dark Mode)
  - **State Management:** Zustand (Store-based architecture)
  - **Icons:** Lucide React
  - **Routing:** React Router DOM v7
  - **Notifications:** Sonner (Toast system)
- **Backend (Supabase):**
  - **Database:** PostgreSQL with Row Level Security (RLS)
  - **Authentication:** Supabase Auth (OTP, MFA, Invitation Tokens)
  - **Realtime:** Postgres Changes for instant notifications
  - **Storage:** S3-compatible bucket for legal documents
  - **Edge Functions:** Deno-based serverless functions for AI & secure tasks
- **Artificial Intelligence:**
  - **Engine:** Google Gemini 1.5 Pro
  - **Architecture:** RAG (Retrieval-Augmented Generation) for document analysis

---

## 🏗️ Architecture & Security
- **Multi-Tenant SaaS:** Strict data isolation between law firms (`firms` table) using PostgreSQL RLS policies.
- **Security Hardening:**
  - **MFA (2FA):** Mandatory for sensitive accounts using TOTP.
  - **Audit Trail:** Automatic logging of all case modifications.
  - **Soft Delete:** Data protection via `deleted_at` pattern.
  - **API Safety:** Gemini API keys are hidden behind server-side Edge Functions.

---

## 🚀 Core Modules & Features

### 1. Identity & Organization
- **Smart Onboarding:** Ability to create a new firm (Admin) or join one via a secure invitation token.
- **RBAC:** Role-based access control (`admin`, `lawyer`, `paralegal`).

### 2. CRM (Client Relationship Management)
- **Centralized Directory:** Manage physical and legal entities.
- **Contact History:** Track all cases and documents associated with a client.

### 3. Case & Hearing Management
- **Case Tracking:** Full lifecycle of legal proceedings.
- **Smart Calendar:** O(1) performance optimized view with real-time hearing reminders.

### 4. Structured DMS (GED)
- **Categorization:** Auto-grouping of documents (Evidence, Acts, Correspondence).
- **AI Integration:** Instant analysis of massive PDF/DOCX files.

### 5. Profitability Engine
- **Global Time Tracker:** Persistent timer widget to record billable hours.
- **Invoicing:** Automated generation of bills based on tracked time entries.

### 6. Real-Time Intelligence
- **Live Notifications:** Desktop-style alerts for urgent deadlines and task assignments.
- **Urgency Pop-ups:** Critical alerts that bypass standard notification queues for high-priority events.

---

## 📂 Components Directory

| Component | Role |
|-----------|------|
| `AuthScreen.jsx` | Multi-flow Auth (Login, Join, Create Firm, MFA Challenge). |
| `DashboardView.jsx` | Executive summary and key performance indicators. |
| `ClientsDirectoryView.jsx` | CRM interface for managing client data. |
| `CaseManagementView.jsx` | Central hub for law files and legal strategy. |
| `CalendarView.jsx` | High-performance hearing and deadline scheduler. |
| `DocumentsView.jsx` | Structured document library with category-based grouping. |
| `GlobalTimer.jsx` | Persistent time-tracking widget in the Header. |
| `Header.jsx` | Search engine, Notifications bell, and AI entry point. |
| `CompanySettingsView.jsx` | Admin panel for invitations and firm configuration. |
| `AiSidebar.jsx` | Floating interface for Gemini 1.5 Pro chat interactions. |

---

## 📅 Data Schema Highlights
- **`public.firms`**: Root organization container.
- **`public.profiles`**: Extended user data and role management.
- **`public.cases`**: Core legal file data.
- **`public.clients`**: CRM entity table.
- **`public.documents`**: Metadata for files stored in Supabase Storage.
- **`public.time_entries`**: Log of all billable activities.
- **`public.notifications`**: Persistent store for firm-wide and user alerts.
- **`public.audit_logs`**: Immutable history of database changes.

---
**Documentation generated on:** May 17, 2026
**Location:** `C:\Users\hp\lex-manage\LEXMANAGE_DOC.md`
