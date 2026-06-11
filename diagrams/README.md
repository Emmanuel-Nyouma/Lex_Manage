# LexManage — System Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) syntax and can be rendered in:
- **GitHub** (rendered automatically in `.md` files)
- **VS Code** with the *Mermaid Preview* extension
- **[mermaid.live](https://mermaid.live)** — paste any diagram block to preview it

| File | Diagram | Description |
|------|---------|-------------|
| [01_data_flow_diagram.md](./01_data_flow_diagram.md) | DFD Level 0 + Level 1 | How data moves between users, processes, and storage systems |
| [02_use_case_diagram.md](./02_use_case_diagram.md) | Use Case | All actors (Admin, Lawyer, Assistant, n8n) and their system interactions |
| [03_sequence_diagram.md](./03_sequence_diagram.md) | Sequence (×4) | Login, Create Case + Upload, AI Chat (RAG), Scheduled Notification |
| [04_activity_diagram.md](./04_activity_diagram.md) | Activity (×4) | Registration, Document Upload, Case Lifecycle, Hybrid Search |
| [05_er_diagram.md](./05_er_diagram.md) | ER Diagram | Full database schema (13 entities, all relationships) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        LexManage Stack                          │
├────────────────┬───────────────────────┬────────────────────────┤
│   Frontend     │      Backend          │    External Services   │
│                │                       │                        │
│  React 19      │  NestJS (TypeScript)  │  Neon (PostgreSQL)     │
│  Vite          │  Prisma ORM           │  Upstash (Redis)       │
│  Tailwind CSS  │  BullMQ queues        │  Supabase S3           │
│  React Query   │  Socket.io (WS)       │  n8n Cloud (RAG AI)    │
│  Zustand       │  Zod validation       │  Resend (Email)        │
│  React Router  │  JWT Auth             │  Render (Hosting)      │
│  Vercel        │  Render (Docker)      │  Vercel (CDN)          │
└────────────────┴───────────────────────┴────────────────────────┘
```
