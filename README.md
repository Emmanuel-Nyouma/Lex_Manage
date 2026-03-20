# ⚖️ LexManage

**LexManage** is a next-generation Legal Management Platform designed for the modern law firm. Unlike traditional tools, LexManage leverages the power of Generative AI (Google Gemini) to transform passive data into active legal strategy.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)
![Node](https://img.shields.io/badge/backend-Node.js-339933.svg)
![Tailwind](https://img.shields.io/badge/styling-Tailwind%20CSS-38b2ac.svg)

## ✨ Core Innovations

### 1. 📅 Automated AI Chronology (Fact-Mapping)
Stop manually building timelines. LexManage uses AI to scan case files and automatically generate an interactive chronological map of past events and future deadlines, identifying critical risks and prescription dates instantly.

### 2. 🤖 AI Legal Assistant (LexAssist)
A persistent sidebar assistant connected to your firm's context. 
- **Strategy Generation:** Get a senior-partner level assessment of any case in seconds.
- **Drafting:** Instant generation of professional client emails and legal briefs.
- **Intelligent Search:** Query your entire case repository using natural language.

### 3. 🛡️ Advanced Security & Administration
Built for compliance and scale:
- **Audit Logs:** Full tracking of every file access and system modification.
- **RAG Workflows:** Ready for n8n integration to sync with external data sources like SharePoint or local repositories.
- **Dark Mode:** Optimized for long research hours.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Emmanuel-Nyouma/Lex_Manage.git
   cd Lex_Manage
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   JWT_SECRET=your_secret_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Setup Frontend**
   ```bash
   cd ..
   npm install
   ```

### Running the App

1. **Start Backend Server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend App:**
   ```bash
   # In a new terminal
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠 Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express.
- **AI Engine:** Google Gemini Pro / Flash.
- **Automation:** n8n ready (via API).

## 🔒 Security
LexManage is designed with the principle of "Security by Design". All AI interactions are processed through secure gateways, and the system is built to support local-first data processing for sensitive legal documents.

---

## 🤝 Contributing
Innovation in law is a collaborative effort. Feel free to open issues or submit pull requests.

**Author:** [Emmanuel Nyouma](https://github.com/Emmanuel-Nyouma)
