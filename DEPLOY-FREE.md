# 🚀 Déploiement gratuit (sans carte bancaire) — LexManage MVP

Cette stack héberge LexManage **en ligne plusieurs jours, gratuitement, sans aucune
carte bancaire** — idéal pour une présentation de MVP.

| Composant | Service gratuit | Carte ? |
|---|---|---|
| Frontend (React) | **Vercel** | ❌ |
| Backend (NestJS) | **Render** (Web Service) | ❌ |
| PostgreSQL | **Neon** (ou Render Postgres) | ❌ |
| Redis | **Upstash** (ou Render Key Value) | ❌ |
| Stockage fichiers | **Supabase Storage** (S3) | ❌ |
| n8n RAG | déjà sur **n8n Cloud** | — |
| IA | Pinecone / Cohere / Gemini (tiers gratuits) | ❌ |

> ⚠️ Le backend Render **s'endort après 15 min** d'inactivité (réveil ~40 s).
> → Voir la section **Keep-alive** en bas pour qu'il reste éveillé pendant la démo.

---

## 1. Base de données — Neon (no card)

1. Crée un compte sur **neon.tech** (login GitHub).
2. Crée un projet → copie la **connection string** (`postgresql://...`).
3. Garde-la : ce sera `DATABASE_URL`.

## 2. Redis — Upstash (no card)

1. Crée un compte sur **upstash.com** (login GitHub).
2. Crée une base **Redis** → onglet *Details*.
3. Note : **Endpoint (host)**, **Port**, **Password**. TLS est activé par défaut.
   - `REDIS_HOST` = l'endpoint (sans `https://`)
   - `REDIS_PORT` = le port (souvent `6379`)
   - `REDIS_PASSWORD` = le mot de passe
   - `REDIS_TLS` = `true`

## 3. Stockage — Supabase Storage (no card)

1. Crée un projet sur **supabase.com** (login GitHub).
2. **Storage** → crée un bucket nommé `lexmanage-documents` (privé).
3. **Project Settings → Storage → S3 access keys** → génère une clé.
4. Note l'**endpoint** et la **région** affichés. Tu obtiens :
   - `S3_ENDPOINT` = `https://<project-ref>.supabase.co/storage/v1/s3`
   - `S3_REGION` = la région affichée (ex. `us-east-1`)
   - `S3_ACCESS_KEY` / `S3_SECRET_KEY` = la clé générée
   - `S3_BUCKET` = `lexmanage-documents`

> ✅ Avant de déployer, valide ces identifiants avec le smoke test :
> `cd storage-smoke-test && npm install && npm test` (voir son README).

## 4. Backend — Render (no card)

1. Crée un compte sur **render.com** (login GitHub).
2. **New → Web Service** → connecte ce dépôt GitHub.
3. Réglages :
   - **Root Directory** : `lexmanage-backend`
   - **Runtime** : Docker (le `Dockerfile` est détecté automatiquement)
   - **Instance Type** : Free
4. **Environment** → ajoute toutes les variables (voir liste plus bas).
5. Déploie. Les migrations Prisma se lancent automatiquement au démarrage.
6. Copie l'URL publique du backend (ex. `https://lexmanage-api.onrender.com`).

### Variables d'environnement backend (Render)

```
DATABASE_URL=<Neon>
JWT_SECRET=<genere: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://<ton-app>.vercel.app

REDIS_HOST=<Upstash host>
REDIS_PORT=<Upstash port>
REDIS_PASSWORD=<Upstash password>
REDIS_TLS=true

S3_ENDPOINT=https://<ref>.supabase.co/storage/v1/s3
S3_REGION=<région Supabase>
S3_ACCESS_KEY=<Supabase S3 key>
S3_SECRET_KEY=<Supabase S3 secret>
S3_BUCKET=lexmanage-documents

GEMINI_API_KEY=<AI Studio>
N8N_RAG_CHAT_URL=<ton webhook n8n Cloud chat>
N8N_RAG_INGEST_URL=<ton webhook n8n Cloud ingest>
RESEND_API_KEY=        # optionnel
MAIL_FROM=onboarding@resend.dev
```

## 5. Frontend — Vercel (no card)

1. Crée un compte sur **vercel.com** (login GitHub) → importe ce dépôt.
2. Framework : **Vite**. Root : racine du repo (`/`).
3. **Environment Variables** :
   ```
   VITE_API_URL=https://<backend>.onrender.com
   VITE_WS_URL=https://<backend>.onrender.com
   VITE_ENABLE_AI=true
   VITE_SECURE_AUTH=true
   ```
4. Déploie → copie l'URL (ex. `https://lexmanage.vercel.app`).
5. Retourne sur Render → mets cette URL dans `ALLOWED_ORIGINS` → redeploy.

## 6. Brancher n8n Cloud

Dans ton workflow n8n Cloud, vérifie que les webhooks `legal-rag-chat` et
`legal-rag-ingest` correspondent aux URLs mises dans `N8N_RAG_*` sur Render.

---

## ⏰ Keep-alive (éviter la mise en veille pendant la démo)

1. Crée un compte gratuit sur **uptimerobot.com** (sans carte).
2. **Add New Monitor** → type **HTTP(s)** → URL = `https://<backend>.onrender.com`
   (ou un endpoint léger type `/api/v1/health` s'il existe).
3. Intervalle : **5 minutes**.

→ Le backend reçoit une requête régulière et **ne s'endort jamais**.
Le jour J, ouvre quand même l'app **2-3 min avant** par sécurité.

---

## ✅ Checklist finale avant la présentation

- [ ] Smoke test storage ✅ (Supabase S3 fonctionnel)
- [ ] Backend Render répond (ouvrir l'URL)
- [ ] Frontend Vercel charge
- [ ] Login fonctionne (backend ↔ Neon)
- [ ] Upload d'un document fonctionne (backend ↔ Supabase)
- [ ] Chat IA répond (backend ↔ n8n Cloud)
- [ ] UptimeRobot actif
- [ ] App réchauffée 2-3 min avant la démo
