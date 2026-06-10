# -*- coding: utf-8 -*-
"""Inline SVG diagrams for the LexManage report. Times New Roman, print-friendly.
The AI pipeline is implemented as n8n workflows using a DeepSeek chat model,
Cohere embeddings + reranker and a Pinecone vector store; the diagrams reflect that."""

FONT = "font-family:'Times New Roman',Times,serif;"

def _box(x, y, w, h, text, fill="#ffffff", stroke="#1f2937", fs=12, bold=False, tcol="#111827", rx=6):
    weight = "bold" if bold else "normal"
    lines = text.split("\n")
    n = len(lines)
    cy = y + h/2 - (n-1)*(fs+2)/2 + fs/2 - 2
    tspans = "".join(
        f'<tspan x="{x+w/2}" y="{cy + i*(fs+3):.1f}">{ln}</tspan>' for i, ln in enumerate(lines)
    )
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" ry="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="1.3"/>'
            f'<text {FONT} font-size="{fs}" font-weight="{weight}" fill="{tcol}" '
            f'text-anchor="middle">{tspans}</text>')

def _ellipse(cx, cy, rx, ry, text, fill="#fff7ed", stroke="#c2410c", fs=11):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="1.2"/>'
            f'<text {FONT} font-size="{fs}" fill="#7c2d12" text-anchor="middle" '
            f'x="{cx}" y="{cy+fs/2-2}">{text}</text>')

def _line(x1, y1, x2, y2, dash=False, arrow=True, col="#374151"):
    d = 'stroke-dasharray="4,3"' if dash else ""
    m = 'marker-end="url(#arrow)"' if arrow else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="1.2" {d} {m}/>'

def _label(x, y, text, fs=10, col="#374151", anchor="middle", italic=False):
    st = "font-style:italic;" if italic else ""
    return (f'<text {FONT}{st} font-size="{fs}" fill="{col}" text-anchor="{anchor}" '
            f'x="{x}" y="{y}">{text}</text>')

def _actor(cx, y, label):
    head_r = 9
    s = (f'<circle cx="{cx}" cy="{y}" r="{head_r}" fill="#fff" stroke="#1f2937" stroke-width="1.5"/>'
         f'<line x1="{cx}" y1="{y+head_r}" x2="{cx}" y2="{y+head_r+26}" stroke="#1f2937" stroke-width="1.5"/>'
         f'<line x1="{cx-14}" y1="{y+head_r+8}" x2="{cx+14}" y2="{y+head_r+8}" stroke="#1f2937" stroke-width="1.5"/>'
         f'<line x1="{cx}" y1="{y+head_r+26}" x2="{cx-12}" y2="{y+head_r+46}" stroke="#1f2937" stroke-width="1.5"/>'
         f'<line x1="{cx}" y1="{y+head_r+26}" x2="{cx+12}" y2="{y+head_r+46}" stroke="#1f2937" stroke-width="1.5"/>'
         f'<text {FONT} font-size="11" font-weight="bold" fill="#111827" text-anchor="middle" '
         f'x="{cx}" y="{y+head_r+62}">{label}</text>')
    return s

def _defs():
    return ('<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" '
            'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,3 L0,6 z" fill="#374151"/>'
            '</marker>'
            '<marker id="oarrow" markerWidth="12" markerHeight="12" refX="9" refY="4" '
            'orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,4 L0,8" fill="none" '
            'stroke="#374151" stroke-width="1.2"/></marker></defs>')

def _svg(w, h, body):
    return (f'<svg viewBox="0 0 {w} {h}" width="100%" xmlns="http://www.w3.org/2000/svg" '
            f'style="max-width:100%;height:auto;background:#fff">{_defs()}{body}</svg>')


# ---------------------------------------------------------------- UML: Use case
def use_case():
    w, h = 760, 470
    b = []
    b.append(f'<rect x="250" y="20" width="430" height="430" rx="10" fill="#f8fafc" stroke="#1f2937" stroke-width="1.3"/>')
    b.append(f'<text {FONT} font-size="12" font-weight="bold" fill="#111827" text-anchor="middle" x="465" y="40">LexManage System</text>')
    cases = [
        ("Authenticate / MFA", 70), ("Manage Firm & Invitations", 120),
        ("Manage Clients (CRM)", 170), ("Manage Cases & Hearings", 220),
        ("Upload / Classify Documents", 270), ("Query LexAssist AI (RAG)", 320),
        ("Receive Real-time Alerts", 370), ("Consult Audit Logs", 420),
    ]
    for t, y in cases:
        b.append(_ellipse(465, y, 112, 19, t))
    b.append(_actor(70, 120, "Cabinet Admin"))
    b.append(_actor(70, 250, "Lawyer"))
    b.append(_actor(70, 370, "Assistant /\nSecretary"))
    for y in [70,120,170,220,270,320,370,420]:
        b.append(_line(95, 138, 350, y, arrow=False))
    for y in [70,170,220,270,320,370]:
        b.append(_line(95, 268, 350, y, arrow=False, col="#9ca3af"))
    for y in [170,220,270,370]:
        b.append(_line(95, 388, 350, y, arrow=False, col="#cbd5e1"))
    return _svg(w, h, "".join(b))


# ---------------------------------------------------------------- Context DFD
def context_dfd():
    w, h = 760, 360
    b = []
    b.append(f'<circle cx="380" cy="180" r="80" fill="#fff7ed" stroke="#c2410c" stroke-width="1.5"/>')
    b.append(f'<text {FONT} font-size="12" font-weight="bold" fill="#7c2d12" text-anchor="middle" x="380" y="176">0</text>')
    b.append(f'<text {FONT} font-size="12" font-weight="bold" fill="#7c2d12" text-anchor="middle" x="380" y="194">LexManage</text>')
    b.append(f'<text {FONT} font-size="12" font-weight="bold" fill="#7c2d12" text-anchor="middle" x="380" y="210">Platform</text>')
    ents = [
        ("Law Firm Staff", 55, 70), ("n8n AI Service\n(DeepSeek · Cohere\n· Pinecone)", 555, 60),
        ("MinIO Object Store", 55, 250), ("Email / SMTP Gateway", 555, 250),
    ]
    for t, x, y in ents:
        b.append(_box(x, y, 160, 64, t, fill="#eef2ff", stroke="#3730a3", bold=True, fs=11, tcol="#1e1b4b"))
    b.append(_line(210, 100, 305, 150)); b.append(_label(250, 120, "credentials, data", 9))
    b.append(_line(305, 168, 210, 116, dash=True))
    b.append(_line(560, 100, 458, 150)); b.append(_label(530, 120, "answers", 9))
    b.append(_line(452, 165, 555, 108, dash=True)); b.append(_label(520, 150, "doc context", 9))
    b.append(_line(210, 268, 320, 212))
    b.append(_line(318, 224, 210, 280, dash=True))
    b.append(_line(560, 268, 445, 212))
    b.append(_line(445, 224, 560, 280, dash=True))
    b.append(_label(380, 350, "(→ solid = input to platform,  → dashed = output from platform)", 9, "#6b7280"))
    return _svg(w, h, "".join(b))


# ---------------------------------------------------------------- UML: Class diagram
def _umlclass(x, y, w, name, attrs, methods, stereo=None):
    ah = 14 * len(attrs); mh = 14 * len(methods)
    title_h = 22
    total = title_h + ah + 8 + mh + 8
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{total}" fill="#ffffff" stroke="#1f2937" stroke-width="1.3"/>']
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{title_h}" fill="#e0e7ff" stroke="#1f2937" stroke-width="1.3"/>')
    s.append(f'<text {FONT} font-size="11.5" font-weight="bold" fill="#1e1b4b" text-anchor="middle" x="{x+w/2}" y="{y+15}">{name}</text>')
    yy = y + title_h + 13
    for a in attrs:
        s.append(f'<text {FONT} font-size="9.5" fill="#111827" x="{x+7}" y="{yy}">{a}</text>'); yy += 14
    sep = y + title_h + ah + 5
    s.append(f'<line x1="{x}" y1="{sep}" x2="{x+w}" y2="{sep}" stroke="#1f2937" stroke-width="1"/>')
    yy = sep + 14
    for m in methods:
        s.append(f'<text {FONT} font-size="9.5" fill="#1f2937" x="{x+7}" y="{yy}">{m}</text>'); yy += 14
    return "".join(s), (x, y, w, total)

def _diamond(cx, cy, filled=True):
    f = "#1f2937" if filled else "#ffffff"
    return f'<path d="M{cx},{cy-6} L{cx+8},{cy} L{cx},{cy+6} L{cx-8},{cy} Z" fill="{f}" stroke="#1f2937" stroke-width="1"/>'

def class_diagram():
    w, h = 820, 690
    b = []
    tenant, _ = _umlclass(315, 12, 200, "Tenant",
        ["- id: UUID", "- name: string", "- slug: string", "- plan: enum", "- barNumber: string"],
        ["+ inviteMember()", "+ listMembers()"])
    user, _ = _umlclass(30, 160, 200, "User",
        ["- id: UUID", "- email: string", "- passwordHash: string", "- role: Role"],
        ["+ authenticate()", "+ hasRole(r)"])
    client, _ = _umlclass(310, 175, 205, "Client",
        ["- id: UUID", "- name: string", "- type: enum", "- email / phone"],
        ["+ cases(): Case[]"])
    invite, _ = _umlclass(600, 160, 195, "Invitation",
        ["- id: UUID", "- email: string", "- role: Role", "- token / expiresAt"],
        ["+ isValid()", "+ accept()"])
    case, _ = _umlclass(310, 350, 205, "Case",
        ["- id: UUID", "- title: string", "- status: enum", "- priority: enum"],
        ["+ addDocument()", "+ schedule()"])
    doc, _ = _umlclass(30, 360, 205, "Document",
        ["- id: UUID", "- type: DocType", "- status: enum", "- fileUrl: string"],
        ["+ presignedUrl()", "+ indexForAI()"])
    event, _ = _umlclass(600, 360, 195, "Event / Deadline",
        ["- id: UUID", "- dueAt: datetime", "- priority: enum", "- isDone: bool"],
        ["+ remind()"])
    notif, _ = _umlclass(30, 545, 200, "Notification",
        ["- id: UUID", "- level: enum", "- motif: enum"],
        ["+ send()"])
    audit, _ = _umlclass(310, 545, 205, "AuditLog",
        ["- id: UUID", "- action: string", "- entity / entityId"],
        ["+ record()"])
    # relationship lines (composition from Tenant)
    b.append(_line(360, 150, 150, 160, arrow=False)); b.append(_diamond(355, 146))
    b.append(_line(410, 150, 410, 175, arrow=False)); b.append(_diamond(410, 150))
    b.append(_line(470, 150, 690, 160, arrow=False)); b.append(_diamond(465, 147))
    b.append(_label(250, 150, "1", 9)); b.append(_label(165, 168, "*", 9))
    # Client 1..* Case
    b.append(_line(412, 280, 412, 350, arrow=False)); b.append(_label(420, 318, "1", 9)); b.append(_label(420, 345, "*", 9))
    # Case 1..* Document
    b.append(_line(310, 405, 235, 410, arrow=False)); b.append(_label(255, 400, "1", 9))
    # Case 1..* Event
    b.append(_line(515, 405, 600, 410, arrow=False)); b.append(_label(585, 400, "*", 9))
    # User assigned Case
    b.append(_line(130, 290, 320, 365, arrow=False)); b.append(_label(210, 320, "assignee", 9, italic=True))
    # Case -> AuditLog / Notification
    b.append(_line(390, 470, 400, 545, arrow=False))
    b.append(_line(330, 470, 150, 545, arrow=False))
    for piece in (tenant, user, client, invite, case, doc, event, notif, audit):
        b.append(piece)
    return _svg(w, h, "".join(b))


# ---------------------------------------------------------------- UML: Activity helpers
def _start(cx, cy):
    return f'<circle cx="{cx}" cy="{cy}" r="9" fill="#1f2937"/>'
def _end(cx, cy):
    return (f'<circle cx="{cx}" cy="{cy}" r="11" fill="none" stroke="#1f2937" stroke-width="1.5"/>'
            f'<circle cx="{cx}" cy="{cy}" r="5" fill="#1f2937"/>')
def _act(cx, y, w, text, h=34, fill="#eff6ff", stroke="#1d4ed8"):
    x = cx - w/2
    return _box(x, y, w, h, text, fill=fill, stroke=stroke, fs=11, tcol="#1e3a8a", rx=16), (cx, y, w, h)
def _dec(cx, cy, text, w=150, h=58):
    pts = f"{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}"
    lines = text.split("\n")
    ty = cy - (len(lines)-1)*6 + 3
    tx = "".join(f'<tspan x="{cx}" y="{ty+i*12:.0f}">{ln}</tspan>' for i,ln in enumerate(lines))
    return (f'<polygon points="{pts}" fill="#fef9c3" stroke="#a16207" stroke-width="1.3"/>'
            f'<text {FONT} font-size="10" fill="#713f12" text-anchor="middle">{tx}</text>')
def _bar(cx, y, w=150):
    return f'<rect x="{cx-w/2}" y="{y}" width="{w}" height="7" fill="#1f2937"/>'

def activity_ingestion():
    w, h = 580, 760
    cx = 250
    b = []
    b.append(_start(cx, 20))
    b.append(_line(cx, 29, cx, 40))
    a1,_ = _act(cx, 40, 250, "Upload document (LexManage UI)"); b.append(a1); b.append(_line(cx,74,cx,90))
    a2,_ = _act(cx, 90, 250, "Store file in MinIO  ·  save metadata (PostgreSQL)", h=40); b.append(a2); b.append(_line(cx,130,cx,148))
    a3,_ = _act(cx, 148, 250, "Trigger n8n Ingest Webhook (POST)", fill="#fff7ed", stroke="#c2410c"); b.append(a3); b.append(_line(cx,182,cx,205))
    b.append(_dec(cx, 232, "File type?\n(Switch — Rules)")); b.append(_line(cx,261,cx,285))
    # three branches collapse conceptually into one extract action
    b.append(_label(cx-95, 250, "PDF", 9)); b.append(_label(cx+95, 250, "DOCX / TXT", 9))
    a4,_ = _act(cx, 285, 250, "Extract text from file (Extract from PDF / parser)", h=40, fill="#fff7ed", stroke="#c2410c"); b.append(a4); b.append(_line(cx,325,cx,345))
    a5,_ = _act(cx, 345, 250, "Split text into overlapping chunks\n(Recursive Character Text Splitter)", h=42, fill="#fff7ed", stroke="#c2410c"); b.append(a5); b.append(_line(cx,387,cx,407))
    a6,_ = _act(cx, 407, 250, "Generate embeddings (Cohere)", fill="#fff7ed", stroke="#c2410c"); b.append(a6); b.append(_line(cx,441,cx,461))
    a7,_ = _act(cx, 461, 250, "Upsert vectors to Pinecone\n(per-tenant namespace)", h=42, fill="#fff7ed", stroke="#c2410c"); b.append(a7); b.append(_line(cx,503,cx,523))
    a8,_ = _act(cx, 523, 250, "Mark document status = INDEXED"); b.append(a8); b.append(_line(cx,557,cx,575))
    b.append(_end(cx, 588))
    return _svg(w, 620, "".join(b))

def activity_case():
    w = 560
    cx = 250
    b = []
    b.append(_start(cx, 18)); b.append(_line(cx,27,cx,40))
    a1,_ = _act(cx, 40, 240, "Open “New Case” dialog"); b.append(a1); b.append(_line(cx,74,cx,90))
    a2,_ = _act(cx, 90, 240, "Enter case details & select client"); b.append(a2); b.append(_line(cx,124,cx,150))
    b.append(_dec(cx, 178, "Valid &\nclient set?"))
    # no -> loop back
    b.append(_line(cx-75, 178, 60, 178, arrow=False)); b.append(_line(60,178,60,107,arrow=False)); b.append(_line(60,107,cx-120,107))
    b.append(_label(150, 170, "no", 9, "#b91c1c"))
    b.append(_line(cx, 207, cx, 228)); b.append(_label(cx+14, 222, "yes", 9, "#15803d"))
    a3,_ = _act(cx, 228, 240, "POST /cases (tenant-scoped) → persist", h=40, fill="#ecfdf5", stroke="#047857"); b.append(a3); b.append(_line(cx,268,cx,286))
    b.append(_bar(cx, 286))  # fork
    b.append(_line(cx-60, 293, cx-60, 312, arrow=False)); b.append(_line(cx+60, 293, cx+60, 312, arrow=False))
    a4,_ = _act(cx-95, 312, 150, "Write audit log", h=32, fill="#f1f5f9", stroke="#475569"); b.append(a4)
    a5,_ = _act(cx+95, 312, 150, "Emit realtime alert", h=32, fill="#f1f5f9", stroke="#475569"); b.append(a5)
    b.append(_line(cx-60, 344, cx-60, 360, arrow=False)); b.append(_line(cx+60, 344, cx+60, 360, arrow=False))
    b.append(_bar(cx, 360))  # join
    b.append(_line(cx, 367, cx, 385))
    a6,_ = _act(cx, 385, 240, "Show new case in list"); b.append(a6); b.append(_line(cx,419,cx,437))
    b.append(_end(cx, 450))
    return _svg(w, 480, "".join(b))


# ---------------------------------------------------------------- UML: Sequence
def _seq(actors, msgs, w=760, h=420, lifeline_top=54, lifeline_bottom=None):
    if lifeline_bottom is None: lifeline_bottom = h - 30
    b = []
    pos = {}
    for name, x in actors:
        pos[name] = x
        b.append(_box(x-58, 18, 116, 34, name, fill="#eef2ff", stroke="#3730a3", bold=True, fs=11, tcol="#1e1b4b"))
        b.append(f'<line x1="{x}" y1="{lifeline_top}" x2="{x}" y2="{lifeline_bottom}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,3"/>')
    for (a, bb, y, text, dash) in msgs:
        x1, x2 = pos[a], pos[bb]
        if a == bb:  # self-call
            b.append(f'<path d="M{x1},{y} h36 v16 h-30" fill="none" stroke="#374151" stroke-width="1.2" marker-end="url(#arrow)"/>')
            b.append(_label(x1+44, y+2, text, 9, anchor="start"))
        else:
            b.append(_line(x1, y, x2, y, dash=dash))
            mx = (x1 + x2) / 2
            b.append(_label(mx, y-5, text, 9.5))
    return _svg(w, h, "".join(b))

def sequence_auth():
    actors = [("User", 80), ("React UI", 270), ("NestJS API", 470), ("PostgreSQL", 670)]
    M = [
        ("User","React UI", 90, "1: enter email & password", False),
        ("React UI","NestJS API", 120, "2: POST /auth/login", False),
        ("NestJS API","PostgreSQL", 150, "3: find user by email", False),
        ("PostgreSQL","NestJS API", 180, "4: user record + passwordHash", True),
        ("NestJS API","NestJS API", 208, "5: verify password, sign JWT", False),
        ("NestJS API","React UI", 250, "6: 200 {accessToken} + Set-Cookie refresh", True),
        ("React UI","React UI", 278, "7: store token, set session hint", False),
        ("React UI","User", 320, "8: redirect to dashboard", True),
    ]
    return _seq(actors, M, w=760, h=360)

def sequence_rag():
    actors = [("Lawyer", 70), ("React UI", 205), ("NestJS API", 345), ("n8n AI Agent", 500), ("Pinecone", 640), ("DeepSeek", 730)]
    M = [
        ("Lawyer","React UI", 90, "1: ask question", False),
        ("React UI","NestJS API", 116, "2: POST /chat", False),
        ("NestJS API","n8n AI Agent", 142, "3: webhook (question, userId)", False),
        ("n8n AI Agent","n8n AI Agent", 168, "4: verify & extract userId", False),
        ("n8n AI Agent","Pinecone", 206, "5: Cohere-embed query + search (+rerank)", False),
        ("Pinecone","n8n AI Agent", 234, "6: top-k reranked chunks", True),
        ("n8n AI Agent","DeepSeek", 262, "7: grounded prompt + context", False),
        ("DeepSeek","n8n AI Agent", 290, "8: answer + citations", True),
        ("n8n AI Agent","NestJS API", 318, "9: respond to webhook", True),
        ("NestJS API","React UI", 344, "10: answer payload", True),
        ("React UI","Lawyer", 370, "11: render answer with sources", True),
    ]
    return _seq(actors, M, w=800, h=410)


# ---------------------------------------------------------------- Architecture
def architecture():
    w, h = 760, 560
    b = []
    b.append(_box(40, 24, 680, 66, "Presentation Tier — React 19 SPA (Vite, Tailwind CSS, Zustand, React Query)\nViews: Dashboard · Cases · Clients · Calendar · Documents · LexAssist AI · Firm Settings",
                  fill="#eff6ff", stroke="#1d4ed8", bold=True, fs=12, tcol="#1e3a8a"))
    b.append(_line(380, 90, 380, 128))
    b.append(_label(392, 114, "HTTPS / REST  ·  Socket.io (WSS)", 10, anchor="start"))
    b.append(_box(40, 128, 680, 104,
                  "Application Tier — NestJS API Gateway\nJWT Auth · RBAC Guards · Multi-tenant Interceptor (AsyncLocalStorage + Prisma Extension)\nModules: Auth · Cases · Clients · Documents · Calendar · Notifications · Chat · Audit · Stats",
                  fill="#ecfdf5", stroke="#047857", bold=True, fs=12, tcol="#065f46"))
    # Data tier
    y = 300
    b.append(_box(40, y, 150, 86, "PostgreSQL\n(Prisma ORM)\ntenant-scoped\nrelational data", fill="#fef9c3", stroke="#a16207", fs=11, tcol="#713f12"))
    b.append(_box(205, y, 150, 86, "MinIO (S3)\nencrypted document\nblobs · presigned\nURLs", fill="#fef9c3", stroke="#a16207", fs=11, tcol="#713f12"))
    b.append(_box(370, y, 150, 86, "Pinecone\nvector store\nembeddings for\nRAG retrieval", fill="#fef9c3", stroke="#a16207", fs=11, tcol="#713f12"))
    for cx in [115, 280, 445]:
        b.append(_line(cx, 232, cx, y-1))
    # AI automation tier (n8n)
    b.append(_box(540, 286, 180, 116, "AI Automation Tier — n8n\nWorkflows: Ingestion & Query\nDeepSeek (chat model)\nCohere (embeddings + reranker)",
                  fill="#ffe4e6", stroke="#be123c", bold=True, fs=11, tcol="#881337"))
    b.append(_line(560, 232, 600, 285))                    # API -> n8n
    b.append(_label(556, 268, "/chat", 9, anchor="start"))
    b.append(_line(540, 344, 520, 344, col="#be123c"))     # n8n -> Pinecone
    b.append(_label(505, 338, "vectors", 8, "#be123c", anchor="end"))
    b.append(_box(40, 432, 680, 44, "Cross-cutting concerns:  Audit Logging · Scheduled Reminders (Cron) · Real-time Gateway · Validation (DTO) · Centralised Error Handling",
                  fill="#f1f5f9", stroke="#475569", fs=11, tcol="#334155"))
    return _svg(w, h, "".join(b))


# ---------------------------------------------------------------- ER diagram
def erd():
    w, h = 760, 560
    b = []
    def ent(x, y, name, rows, wd=150):
        hh = 26 + len(rows)*15
        s = [f'<rect x="{x}" y="{y}" width="{wd}" height="{hh}" rx="4" fill="#ffffff" stroke="#1f2937" stroke-width="1.3"/>']
        s.append(f'<rect x="{x}" y="{y}" width="{wd}" height="22" rx="4" fill="#1f2937"/>')
        s.append(f'<text {FONT} font-size="11.5" font-weight="bold" fill="#fff" text-anchor="middle" x="{x+wd/2}" y="{y+15}">{name}</text>')
        for i, r in enumerate(rows):
            s.append(f'<text {FONT} font-size="10" fill="#111827" x="{x+8}" y="{y+38+i*15}">{r}</text>')
        return "".join(s)
    b.append(ent(300, 20, "Tenant (Firm)", ["PK id", "name, slug", "plan, country", "barNumber"]))
    b.append(ent(60, 150, "User", ["PK id", "FK tenant_id", "email, role", "passwordHash"]))
    b.append(ent(300, 175, "Client", ["PK id", "FK tenant_id", "name, type", "email, phone"]))
    b.append(ent(560, 150, "Invitation", ["PK id", "FK tenant_id", "email, role", "token, used"]))
    b.append(ent(300, 330, "Case", ["PK id", "FK tenant_id", "FK client_id", "FK assignee_id", "status, priority"]))
    b.append(ent(60, 360, "Document", ["PK id", "FK tenant_id", "FK case_id", "type, status", "file_url"]))
    b.append(ent(560, 330, "Event/Deadline", ["PK id", "FK case_id", "dueAt, isDone"]))
    b.append(ent(60, 480, "AuditLog", ["PK id", "FK tenant_id", "action, entity"], wd=150))
    b.append(ent(300, 480, "Notification", ["PK id", "FK tenant_id", "level, motif"], wd=150))
    b.append(ent(560, 470, "ChatConversation", ["PK id", "FK tenant_id", "FK user_id"], wd=160))
    b.append(_line(375, 101, 300, 150, arrow=False))
    b.append(_line(385, 101, 375, 175, arrow=False))
    b.append(_line(450, 101, 600, 150, arrow=False))
    b.append(_line(375, 261, 375, 330, arrow=False))
    b.append(_line(300, 360, 210, 360, arrow=False))
    b.append(_line(450, 360, 560, 360, arrow=False))
    b.append(_line(135, 240, 135, 360, arrow=False))
    b.append(_label(388, 138, "1..N", 9.5, "#6b7280", anchor="start"))
    return _svg(w, h, "".join(b))
