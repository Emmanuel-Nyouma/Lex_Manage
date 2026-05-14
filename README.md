# ⚖️ LexManage

**LexManage** is a next-generation Legal Management Platform designed for the modern law firm. Leveraging the power of **Google Gemini 1.5 Pro** and **Supabase**, it transforms passive legal data into active strategy through a 100% serverless architecture.

![React](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)
![Supabase](https://img.shields.io/badge/backend-Supabase-3ecf8e.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-blue.svg)
![Tailwind](https://img.shields.io/badge/styling-Tailwind%20CSS-38b2ac.svg)

## ✨ Core Innovations

### 1. 🤖 Native RAG with Gemini File API
Unlike traditional vector-based systems, LexManage uses the **Gemini File API**. This allows for:
- **Massive Context Window:** Analyze entire case files (PDF/Word) in a single prompt.
- **High Fidelity:** No more "chunking" errors; the AI sees the document exactly as it is.
- **Automated Citations:** Precise referencing of pages and articles.

### 2. 🛡️ Professional Grade Infrastructure
- **Serverless Architecture:** Powered by Supabase Edge Functions for secure AI orchestration.
- **Robust Data Handling:** Advanced drag-and-drop upload with strict validation and error boundaries.
- **Persistence:** Automatic re-upload of expired AI files (48h lifecycle management).

### 3. 📊 Strategic Insights
- **Interactive Dashboard:** Real-time KPI tracking and workload visualization using Recharts.
- **Data Export:** Instant CSV reporting for billing and matter management.
- **Omnibar (Cmd+K):** Lightning-fast navigation across the entire firm repository.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/Emmanuel-Nyouma/Lex_Manage.git
   cd Lex_Manage
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

3. **Supabase Config**
   Run the SQL scripts in `/supabase/setup.sql` and deploy functions:
   ```bash
   supabase functions deploy upload-to-gemini
   supabase functions deploy chat-gemini
   ```

---

## 📂 Project Structure

```text
lex-manage/
├── supabase/            # Database schema & Edge Functions
│   ├── functions/       # chat-gemini, upload-to-gemini
│   └── setup.sql        # Database initialization
├── src/
│   ├── components/      # UI Views & Atomic Elements
│   ├── hooks/           # TanStack Query custom hooks
│   ├── lib/             # Supabase & Gemini clients
│   ├── store/           # Global state (Zustand)
│   └── utils/           # Exports, helpers, & guard logic
└── tailwind.config.js   # Custom legal-theme styling
```

---

## 🤝 Contributing
Innovation in law is a collaborative effort. Feel free to open issues or submit pull requests.

**Author:** [Emmanuel Nyouma](https://github.com/Emmanuel-Nyouma)
