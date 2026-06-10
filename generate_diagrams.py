"""
Generate all technical diagrams for the LexManage BTech report.
Uses matplotlib + patches. Saves PNG files to report_screenshots/.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import numpy as np
import os

OUT = r"C:\Users\hp\lex-manage\report_screenshots"
os.makedirs(OUT, exist_ok=True)

# ── Colour palette ──────────────────────────────────────────────────────────
C = dict(
    amber="#F59E0B", dark="#1E293B", blue="#3B82F6", green="#10B981",
    purple="#8B5CF6", red="#EF4444", slate="#64748B", teal="#14B8A6",
    bg="#F8FAFC", white="#FFFFFF", border="#CBD5E1", text="#0F172A",
    orange="#F97316", indigo="#6366F1"
)

def box(ax, x, y, w, h, text, fc=C["white"], ec=C["border"], tc=C["text"],
        fs=9, bold=False, radius=0.02, wrap=False):
    r = FancyBboxPatch((x, y), w, h,
                        boxstyle=f"round,pad=0.01,rounding_size={radius}",
                        fc=fc, ec=ec, lw=1.5, zorder=3)
    ax.add_patch(r)
    weight = 'bold' if bold else 'normal'
    ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=fs,
            color=tc, fontweight=weight, zorder=4, wrap=wrap,
            multialignment='center')

def arrow(ax, x1, y1, x2, y2, color=C["slate"], lw=1.5, style='->', bi=False):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                 arrowprops=dict(arrowstyle=style, color=color, lw=lw,
                                 connectionstyle="arc3,rad=0"))
    if bi:
        ax.annotate("", xy=(x1, y1), xytext=(x2, y2),
                     arrowprops=dict(arrowstyle=style, color=color, lw=lw,
                                     connectionstyle="arc3,rad=0"))

def label_arrow(ax, x1, y1, x2, y2, label, color=C["slate"]):
    arrow(ax, x1, y1, x2, y2, color=color)
    mx, my = (x1+x2)/2, (y1+y2)/2
    ax.text(mx+0.01, my+0.01, label, fontsize=7, color=color, ha='center')

def title_bar(ax, title, subtitle=""):
    ax.text(0.5, 0.97, title, transform=ax.transAxes, ha='center', va='top',
            fontsize=13, fontweight='bold', color=C["dark"])
    if subtitle:
        ax.text(0.5, 0.93, subtitle, transform=ax.transAxes, ha='center', va='top',
                fontsize=9, color=C["slate"])

def save(fig, name):
    path = f"{OUT}/{name}.png"
    fig.savefig(path, dpi=150, bbox_inches='tight', facecolor=C["bg"])
    plt.close(fig)
    print(f"  diagram: {name}.png")

# ════════════════════════════════════════════════════════════════════════════
# D1: System Architecture Diagram
# ════════════════════════════════════════════════════════════════════════════
print("Generating System Architecture Diagram...")
fig, ax = plt.subplots(figsize=(14, 9))
ax.set_xlim(0, 14); ax.set_ylim(0, 9); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("LexManage — System Architecture", fontsize=14, fontweight='bold',
             color=C["dark"], pad=12)

# Tier labels
for y, label, col in [(7.7, "PRESENTATION TIER", C["blue"]),
                       (5.5, "APPLICATION TIER (NestJS Backend)", C["green"]),
                       (2.0, "DATA TIER", C["purple"])]:
    ax.axhline(y=y, color=col, lw=0.8, ls='--', alpha=0.4)
    ax.text(0.15, y+0.12, label, fontsize=8, color=col, fontweight='bold', alpha=0.8)

# Presentation
box(ax, 0.5, 7.2, 3.0, 0.9, "React 19 SPA\n(Vite + Tailwind)", fc="#DBEAFE", ec=C["blue"], fs=9, bold=True)
box(ax, 4.0, 7.2, 2.8, 0.9, "Zustand Store\n+ React Query", fc="#DBEAFE", ec=C["blue"], fs=9)
box(ax, 7.2, 7.2, 2.8, 0.9, "Socket.io Client\n(Real-time)", fc="#DBEAFE", ec=C["blue"], fs=9)
box(ax, 10.4, 7.2, 2.8, 0.9, "Axios REST\nHTTP Client", fc="#DBEAFE", ec=C["blue"], fs=9)

# Application
app_modules = [
    ("AuthModule\nUsersModule\nTenantsModule", 0.5, 5.1),
    ("CasesModule\nClientsModule\nCalendarModule", 3.6, 5.1),
    ("DocumentsModule\nCaseDocumentsModule\nMinioService", 6.7, 5.1),
    ("AiModule\nChatModule\nN8nRagService", 9.8, 5.1),
    ("NotificationsModule\nEventsGateway\nStatsModule", 0.5, 3.7),
    ("AuditModule\nSearchModule\nMailModule", 3.6, 3.7),
    ("BullMQ Queues\n(mail + reminders)", 6.7, 3.7),
    ("TenantMiddleware\nPrismaService\n(Row-Level Filter)", 9.8, 3.7),
]
for text, x, y in app_modules:
    box(ax, x, y, 2.8, 1.1, text, fc="#D1FAE5", ec=C["green"], fs=8)

# Data tier
data_nodes = [
    ("PostgreSQL 15\nRelational DB", 0.5, 0.5, C["purple"]),
    ("MinIO\nObject Storage", 3.2, 0.5, C["orange"]),
    ("Redis 7\nQueues + Cache", 5.9, 0.5, C["red"]),
    ("Pinecone\nVector DB (RAG)", 8.6, 0.5, C["teal"]),
    ("n8n Workflow\n(AI Pipeline)", 11.3, 0.5, C["amber"]),
]
for text, x, y, col in data_nodes:
    box(ax, x, y, 2.4, 0.9, text, fc="#F3F4F6", ec=col, bold=True, fs=9, tc=col)

# Connections (simplified)
for x in [2.0, 5.4, 8.6]:
    arrow(ax, x, 7.2, x, 6.2, color=C["blue"], lw=1.2)
for x in [2.0, 5.4, 8.6]:
    arrow(ax, x, 3.7, x, 1.4, color=C["green"], lw=1.2)
arrow(ax, 11.2, 5.1, 12.5, 1.4, color=C["amber"], lw=1.5)

ax.text(7, 0.1, "All components run in Docker / local environment", ha='center',
        fontsize=8, color=C["slate"], style='italic')
save(fig, "D1_architecture")

# ════════════════════════════════════════════════════════════════════════════
# D2: Multi-Tenant Isolation Model
# ════════════════════════════════════════════════════════════════════════════
print("Generating Multi-Tenant Isolation Diagram...")
fig, ax = plt.subplots(figsize=(12, 8))
ax.set_xlim(0, 12); ax.set_ylim(0, 8); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("Multi-Tenant Data Isolation Model", fontsize=14,
             fontweight='bold', color=C["dark"], pad=10)

# Firm A box
firm_a = FancyBboxPatch((0.3, 1.5), 3.6, 5.8, boxstyle="round,pad=0.1",
                          fc="#EFF6FF", ec=C["blue"], lw=2, alpha=0.7)
ax.add_patch(firm_a)
ax.text(2.1, 7.1, "Firm A — Cabinet Martin", ha='center', fontsize=10,
        fontweight='bold', color=C["blue"])

# Firm B box
firm_b = FancyBboxPatch((4.2, 1.5), 3.6, 5.8, boxstyle="round,pad=0.1",
                          fc="#F0FDF4", ec=C["green"], lw=2, alpha=0.7)
ax.add_patch(firm_b)
ax.text(6.0, 7.1, "Firm B — SCP Durand", ha='center', fontsize=10,
        fontweight='bold', color=C["green"])

# Firm N box
firm_n = FancyBboxPatch((8.1, 1.5), 3.6, 5.8, boxstyle="round,pad=0.1",
                          fc="#FFF7ED", ec=C["orange"], lw=2, alpha=0.7)
ax.add_patch(firm_n)
ax.text(9.9, 7.1, "Firm N — …", ha='center', fontsize=10,
        fontweight='bold', color=C["orange"])

# Items inside each firm
for firm_x, col in [(0.5, C["blue"]), (4.4, C["green"]), (8.3, C["orange"])]:
    items = ["Users + Roles", "Cases + Deadlines", "Documents (MinIO)", "Chat Sessions", "Notifications", "Pinecone Namespace"]
    for i, item in enumerate(items):
        box(ax, firm_x, 1.7 + i*0.8, 3.2, 0.6, item, fc=C["white"], ec=col, fs=8)

# Shared infrastructure
box(ax, 0.3, 0.2, 11.4, 0.9, "Shared Infrastructure: PostgreSQL  |  MinIO  |  Redis  |  Pinecone  |  n8n",
    fc="#F1F5F9", ec=C["dark"], bold=True, fs=10)

# Arrows
for x in [2.1, 6.0, 9.9]:
    arrow(ax, x, 1.5, x, 1.1, color=C["slate"])

# Lock icon text
ax.text(5.9, 0.97, "⟺  ISOLATED by tenantId  ⟺", ha='center', fontsize=9,
        color=C["red"], fontweight='bold')

save(fig, "D2_multi_tenant")

# ════════════════════════════════════════════════════════════════════════════
# D3: ER Diagram
# ════════════════════════════════════════════════════════════════════════════
print("Generating ER Diagram...")
fig, ax = plt.subplots(figsize=(16, 11))
ax.set_xlim(0, 16); ax.set_ylim(0, 11); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("LexManage — Entity-Relationship Diagram", fontsize=14,
             fontweight='bold', color=C["dark"], pad=10)

entities = {
    "Tenant":            (7.0, 8.5, ["id (PK)", "name", "slug", "plan", "isActive"]),
    "User":              (2.0, 6.5, ["id (PK)", "tenantId (FK)", "email", "role", "passwordHash"]),
    "Case":              (7.0, 6.0, ["id (PK)", "tenantId (FK)", "title", "status", "priority"]),
    "Client":            (12.0, 6.5, ["id (PK)", "tenantId (FK)", "name", "email", "type_client"]),
    "Document":          (2.0, 3.0, ["id (PK)", "tenantId (FK)", "file_url", "file_type", "status"]),
    "Deadline":          (7.0, 3.5, ["id (PK)", "tenantId (FK)", "caseId (FK)", "dueAt", "priority"]),
    "Notification":      (12.0, 3.0, ["id (PK)", "tenantId (FK)", "level", "motif", "message"]),
    "AuditLog":          (2.0, 0.8, ["id (PK)", "tenantId (FK)", "userId (FK)", "action", "entity"]),
    "ChatConversation":  (7.0, 1.0, ["id (PK)", "tenantId (FK)", "userId (FK)", "title"]),
    "Invitation":        (12.0, 0.8, ["id (PK)", "tenantId (FK)", "email", "token", "role"]),
}

ent_pos = {}
for name, (cx, cy, fields) in entities.items():
    w, h = 3.2, 0.35 + len(fields)*0.28
    x, y = cx - w/2, cy
    # Header
    box(ax, x, y+h-0.35, w, 0.35, name, fc=C["dark"], ec=C["dark"], tc=C["white"], bold=True, fs=9)
    # Fields
    for i, f in enumerate(fields):
        fc = "#FEF9C3" if "PK" in f else ("#DBEAFE" if "FK" in f else C["white"])
        box(ax, x, y+h-0.7-i*0.28, w, 0.28, f, fc=fc, ec=C["border"], fs=7.5)
    ent_pos[name] = (cx, cy + h)

# Relationships
rels = [
    ("Tenant", "User", "1:N"), ("Tenant", "Case", "1:N"),
    ("Tenant", "Client", "1:N"), ("Tenant", "Document", "1:N"),
    ("Tenant", "Notification", "1:N"), ("Tenant", "AuditLog", "1:N"),
    ("Tenant", "ChatConversation", "1:N"), ("Tenant", "Invitation", "1:N"),
    ("Case", "Deadline", "1:N"), ("Case", "Document", "1:N"),
    ("Client", "Case", "1:N"), ("User", "Case", "1:N"),
    ("User", "ChatConversation", "1:N"),
]
for src, dst, lbl in rels:
    x1, y1 = ent_pos[src]
    x2, y2 = entities[dst][0], entities[dst][1] + 0.35
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1-0.15),
                 arrowprops=dict(arrowstyle="-|>", color=C["slate"], lw=1,
                                 connectionstyle="arc3,rad=0.1"))
    mx, my = (x1+x2)/2, (y1+y2)/2
    ax.text(mx, my, lbl, fontsize=7, color=C["blue"], ha='center',
            bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none'))

# Legend
ax.add_patch(FancyBboxPatch((0.1, 0.1), 1.5, 0.6, boxstyle="round,pad=0.05",
                               fc="white", ec=C["border"]))
ax.text(0.2, 0.55, "■ PK  yellow | FK  blue", fontsize=7, color=C["dark"])
ax.text(0.2, 0.3, "→  Relationship", fontsize=7, color=C["dark"])
save(fig, "D3_er_diagram")

# ════════════════════════════════════════════════════════════════════════════
# D4: Use Case Diagram — Authentication
# ════════════════════════════════════════════════════════════════════════════
print("Generating Use Case Diagrams...")

def use_case_diagram(title, actors, use_cases, associations, fname):
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 12); ax.set_ylim(0, 8); ax.axis('off')
    ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
    ax.set_title(f"Use Case Diagram — {title}", fontsize=13,
                 fontweight='bold', color=C["dark"], pad=10)

    # System boundary
    sb = FancyBboxPatch((2.5, 0.5), 7, 6.8, boxstyle="round,pad=0.1",
                         fc="white", ec=C["dark"], lw=2)
    ax.add_patch(sb)
    ax.text(6.0, 7.1, title, ha='center', fontsize=10,
            color=C["dark"], fontweight='bold', style='italic')

    # Actors (left side)
    actor_pos = {}
    for i, (actor, side) in enumerate(actors):
        x = 0.5 if side == 'left' else 11.2
        y = 1.0 + i * (5.5/max(len([a for a, s in actors if s == side]), 1))
        # Actor: circle head + body
        circle = plt.Circle((x, y+0.5), 0.25, color=C["dark"], fill=False, lw=1.5, zorder=5)
        ax.add_patch(circle)
        ax.plot([x, x], [y+0.25, y-0.15], color=C["dark"], lw=1.5, zorder=5)
        ax.plot([x-0.2, x+0.2], [y+0.05, y+0.05], color=C["dark"], lw=1.5, zorder=5)
        ax.plot([x, x-0.15], [y-0.15, y-0.5], color=C["dark"], lw=1.5, zorder=5)
        ax.plot([x, x+0.15], [y-0.15, y-0.5], color=C["dark"], lw=1.5, zorder=5)
        ax.text(x, y-0.65, actor, ha='center', fontsize=8, color=C["dark"])
        actor_pos[actor] = (x, y+0.1)

    # Use cases (ellipses inside system boundary)
    uc_pos = {}
    cols = [C["blue"], C["green"], C["purple"], C["orange"], C["teal"],
            C["red"], C["amber"], C["indigo"]]
    n = len(use_cases)
    cols_cnt = 2 if n > 4 else 1
    for i, uc in enumerate(use_cases):
        col_i = i % cols_cnt
        row_i = i // cols_cnt
        x = 4.0 + col_i * 3.2
        y = 6.0 - row_i * (5.5 / max(n // cols_cnt, 1))
        e = mpatches.Ellipse((x, y), 2.8, 0.7, fc="#EEF2FF", ec=cols[i%len(cols)], lw=1.5, zorder=3)
        ax.add_patch(e)
        ax.text(x, y, uc, ha='center', va='center', fontsize=8, color=C["dark"], zorder=4)
        uc_pos[uc] = (x, y)

    # Associations
    for actor, uc in associations:
        if actor in actor_pos and uc in uc_pos:
            ax.plot([actor_pos[actor][0], uc_pos[uc][0]-1.4],
                    [actor_pos[actor][1], uc_pos[uc][1]],
                    color=C["slate"], lw=1, zorder=2)
    save(fig, fname)

use_case_diagram(
    "Authentication & Firm Management",
    [("Unregistered\nUser", "left"), ("Registered\nUser", "left"), ("Cabinet\nAdmin", "left")],
    ["Register Firm", "Login", "Logout", "Refresh Token",
     "Update Profile", "Invite Colleague", "Accept Invitation", "Deactivate User"],
    [("Unregistered\nUser","Register Firm"),("Unregistered\nUser","Accept Invitation"),
     ("Registered\nUser","Login"),("Registered\nUser","Logout"),
     ("Registered\nUser","Refresh Token"),("Registered\nUser","Update Profile"),
     ("Cabinet\nAdmin","Invite Colleague"),("Cabinet\nAdmin","Deactivate User")],
    "D4_uc_auth"
)

use_case_diagram(
    "Case Management",
    [("Lawyer", "left"), ("Cabinet\nAdmin", "left"), ("Assistant", "left")],
    ["Create Case", "View Cases", "Update Case",
     "Assign to Lawyer", "Change Status", "Add Deadline", "Archive Case"],
    [("Lawyer","Create Case"),("Lawyer","View Cases"),("Lawyer","Update Case"),
     ("Cabinet\nAdmin","Assign to Lawyer"),("Cabinet\nAdmin","Archive Case"),
     ("Assistant","View Cases"),("Assistant","Add Deadline"),
     ("Cabinet\nAdmin","Change Status")],
    "D5_uc_cases"
)

use_case_diagram(
    "Document Management System",
    [("Lawyer", "left"), ("Cabinet\nAdmin", "left")],
    ["Upload Document", "View Documents", "Download Document",
     "Categorise Document", "Set Access Roles", "Import to LexAssist AI", "Delete Document"],
    [("Lawyer","Upload Document"),("Lawyer","View Documents"),("Lawyer","Download Document"),
     ("Lawyer","Categorise Document"),("Lawyer","Import to LexAssist AI"),
     ("Cabinet\nAdmin","Set Access Roles"),("Cabinet\nAdmin","Delete Document")],
    "D6_uc_dms"
)

use_case_diagram(
    "LexAssist AI",
    [("Lawyer", "left"), ("Cabinet\nAdmin", "left")],
    ["Start New Conversation", "Send Message", "Receive AI Response",
     "View Chat History", "Delete Conversation", "Auto-Ingest on Upload"],
    [("Lawyer","Start New Conversation"),("Lawyer","Send Message"),
     ("Lawyer","Receive AI Response"),("Lawyer","View Chat History"),
     ("Lawyer","Delete Conversation"),("Cabinet\nAdmin","Auto-Ingest on Upload")],
    "D7_uc_ai"
)

use_case_diagram(
    "Notifications",
    [("Cabinet\nAdmin", "left"), ("Lawyer", "left")],
    ["Send Notification", "View Notifications", "Mark as Read",
     "Create Template", "Schedule Notification"],
    [("Cabinet\nAdmin","Send Notification"),("Cabinet\nAdmin","Create Template"),
     ("Cabinet\nAdmin","Schedule Notification"),
     ("Lawyer","View Notifications"),("Lawyer","Mark as Read")],
    "D8_uc_notif"
)

# ════════════════════════════════════════════════════════════════════════════
# D5: Activity Diagrams
# ════════════════════════════════════════════════════════════════════════════
print("Generating Activity Diagrams...")

def activity_diagram(title, steps, decisions=None, fname=""):
    """steps = list of (label, color). decisions = {step_index: (yes_label, no_label)}"""
    fig, ax = plt.subplots(figsize=(8, 11))
    ax.set_xlim(0, 8); ax.set_ylim(0, 11); ax.axis('off')
    ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
    ax.set_title(f"Activity Diagram — {title}", fontsize=12,
                 fontweight='bold', color=C["dark"], pad=10)

    total = len(steps)
    step_h = 9.5 / (total + 1)
    positions = []

    # Start node
    start_y = 10.2
    circle = plt.Circle((4, start_y), 0.18, color=C["dark"], zorder=5)
    ax.add_patch(circle)
    positions.append((4, start_y))

    decisions = decisions or {}

    for i, (label, color) in enumerate(steps):
        y = start_y - (i+1)*step_h
        is_decision = i in decisions

        if is_decision:
            # Diamond shape
            diamond = plt.Polygon([[4, y+0.3], [5.2, y], [4, y-0.3], [2.8, y]],
                                    fc="#FEF3C7", ec=C["amber"], lw=1.5, zorder=3)
            ax.add_patch(diamond)
            ax.text(4, y, label, ha='center', va='center', fontsize=8,
                    color=C["dark"], zorder=4)
        else:
            box(ax, 2.0, y-0.22, 4.0, 0.45, label, fc=f"#{color.lstrip('#')}22" if color else "#EFF6FF",
                ec=color or C["blue"], fs=8.5, radius=0.08)

        positions.append((4, y))

    # End node
    end_y = start_y - (total+1)*step_h
    outer = plt.Circle((4, end_y), 0.22, color=C["dark"], fill=False, lw=2.5, zorder=5)
    inner = plt.Circle((4, end_y), 0.14, color=C["dark"], zorder=6)
    ax.add_patch(outer); ax.add_patch(inner)
    positions.append((4, end_y))

    # Draw arrows
    for i in range(len(positions)-1):
        x1, y1 = positions[i]
        x2, y2 = positions[i+1]
        if i in decisions:
            ax.annotate("", xy=(x2, y2+0.23), xytext=(x1, y1-0.3),
                         arrowprops=dict(arrowstyle='->', color=C["green"], lw=1.5))
            # No branch
            no_x = 6.5
            ax.annotate("", xy=(6.5, y2+0.2), xytext=(x1+1.2, y1),
                         arrowprops=dict(arrowstyle='->', color=C["red"], lw=1.2,
                                         connectionstyle="arc3,rad=-0.3"))
            yes_key, no_key = decisions[i]
            ax.text(3.5, (y1+y2)/2, yes_key, fontsize=7.5, color=C["green"])
            ax.text(5.1, y1+0.1, no_key, fontsize=7.5, color=C["red"])
        else:
            ax.annotate("", xy=(x2, y2+0.23 if i < len(positions)-2 else y2+0.22),
                         xytext=(x1, y1-0.23 if i > 0 else y1-0.18),
                         arrowprops=dict(arrowstyle='->', color=C["slate"], lw=1.5))

    save(fig, fname)

activity_diagram("User Registration & Login",
    [("User opens registration form", C["blue"]),
     ("Fill email, password, firm name", C["blue"]),
     ("Validate form (Zod schema)", C["amber"]),
     ("Check duplicate email (unscoped)", C["purple"]),
     ("Create Tenant record", C["green"]),
     ("Hash password (bcrypt, cost 12)", C["green"]),
     ("Create User record", C["green"]),
     ("Generate JWT access + refresh tokens", C["green"]),
     ("Store refresh token hash in DB", C["green"]),
     ("Return tokens + user to client", C["teal"])],
    fname="D9_activity_register"
)

activity_diagram("Document Upload & AI Ingestion",
    [("User selects file (drag-drop or click)", C["blue"]),
     ("Multer buffers file in memory", C["purple"]),
     ("fileTypeFromBuffer() reads magic bytes", C["amber"]),
     ("Apply text/plain fallback for TXT", C["amber"]),
     ("Validate MIME type (PDF/DOCX/TXT)", C["red"]),
     ("Construct MinIO object key", C["green"]),
     ("Upload to tenant-scoped MinIO bucket", C["green"]),
     ("Prisma create Document record", C["green"]),
     ("Fire n8n ingest webhook (async)", C["teal"]),
     ("Return presigned URL to client", C["blue"])],
    fname="D10_activity_upload"
)

activity_diagram("LexAssist AI Chat",
    [("User types question in chat input", C["blue"]),
     ("React Query POST /ai/dashboard-chat", C["blue"]),
     ("Extract tenantId + userId from JWT", C["purple"]),
     ("POST to n8n chat webhook", C["orange"]),
     ("Cohere embed query text", C["teal"]),
     ("Pinecone query (namespace=tenantId)", C["teal"]),
     ("Cohere rerank top-K results", C["teal"]),
     ("Load conversation memory (sessionId)", C["purple"]),
     ("Gemini LLM generates answer", C["green"]),
     ("Return answer + sources to client", C["blue"])],
    fname="D11_activity_ai_chat"
)

activity_diagram("Real-Time Notification Dispatch",
    [("Admin fills notification form", C["blue"]),
     ("POST /notifications (NestJS)", C["blue"]),
     ("Create Notification in PostgreSQL", C["green"]),
     ("EventsGateway.emitToTenant()", C["purple"]),
     ("Socket.io room broadcast", C["purple"]),
     ("Client receives real-time event", C["teal"]),
     ("Push mail job to BullMQ queue", C["orange"]),
     ("MailProcessor.process()", C["orange"]),
     ("Nodemailer.sendMail()", C["orange"]),
     ("Email delivered to recipient", C["green"])],
    fname="D12_activity_notification"
)

# ════════════════════════════════════════════════════════════════════════════
# D6: Class Diagram (simplified)
# ════════════════════════════════════════════════════════════════════════════
print("Generating Class Diagram...")
fig, ax = plt.subplots(figsize=(16, 11))
ax.set_xlim(0, 16); ax.set_ylim(0, 11); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("Class Diagram — Backend NestJS Modules", fontsize=14,
             fontweight='bold', color=C["dark"], pad=10)

classes = [
    # (name, x, y, methods, color)
    ("AuthController", 0.2, 7.5, ["POST /register", "POST /login", "POST /refresh", "POST /logout", "GET /me"], C["blue"]),
    ("AuthService", 0.2, 4.5, ["register(dto)", "login(dto)", "refreshToken(token)", "logout(userId)", "generateTokens()"], C["blue"]),
    ("CasesController", 4.0, 7.5, ["GET /cases", "POST /cases", "GET /:id", "PATCH /:id", "DELETE /:id"], C["green"]),
    ("CasesService", 4.0, 4.5, ["findAll(tenantId)", "create(dto)", "update(id, dto)", "archive(id)", "findByAssignee()"], C["green"]),
    ("DocumentsController", 8.0, 7.5, ["POST /upload", "GET /", "GET /:id", "GET /:id/download-url", "DELETE /:id"], C["orange"]),
    ("DocumentsService", 8.0, 4.5, ["upload(file,tenantId)", "findAll(tenantId)", "getSignedUrl()", "remove()", "invalidateCache()"], C["orange"]),
    ("AiController", 12.0, 7.5, ["POST /chat", "POST /dashboard-chat", "POST /ingest-document"], C["purple"]),
    ("N8nRagService", 12.0, 5.0, ["chat(params)", "ingestDocument(params)"], C["purple"]),
    ("EventsGateway", 0.2, 1.5, ["handleConnection()", "emitToTenant()", "emitToUser()", "handlePing()"], C["teal"]),
    ("NotificationsService", 4.0, 1.5, ["findAll()", "create()", "markRead()", "schedule()", "broadcast()"], C["red"]),
    ("PrismaService", 8.0, 1.5, ["$extends(query interceptors)", "onModuleInit()", "Row-level filter"], C["slate"]),
    ("MinioService", 12.0, 2.0, ["uploadFile()", "getPresignedUrl()", "getFileBuffer()", "ensureBucket()"], C["amber"]),
]

class_pos = {}
for name, cx, cy, methods, col in classes:
    w, h = 3.5, 0.35 + len(methods)*0.28
    x, y = cx, cy
    box(ax, x, y+h-0.35, w, 0.35, f"«class»\n{name}", fc=col, ec=col, tc="white", fs=8, bold=True)
    for i, m in enumerate(methods):
        box(ax, x, y+h-0.7-i*0.28, w, 0.28, m, fc="white", ec=C["border"], fs=7.5)
    class_pos[name] = (cx+w/2, cy+h)

# Dependency arrows
deps = [
    ("AuthController", "AuthService"),
    ("CasesController", "CasesService"),
    ("DocumentsController", "DocumentsService"),
    ("AiController", "N8nRagService"),
    ("DocumentsService", "MinioService"),
    ("DocumentsService", "PrismaService"),
    ("CasesService", "PrismaService"),
    ("NotificationsService", "EventsGateway"),
]
for src, dst in deps:
    if src in class_pos and dst in class_pos:
        x1, y1 = class_pos[src]
        x2, y2 = class_pos[dst]
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                     arrowprops=dict(arrowstyle="-|>", color=C["slate"], lw=1,
                                     connectionstyle="arc3,rad=0.15", ls="dashed"))

save(fig, "D13_class_diagram")

# ════════════════════════════════════════════════════════════════════════════
# D7: Sequence Diagrams
# ════════════════════════════════════════════════════════════════════════════
print("Generating Sequence Diagrams...")

def sequence_diagram(title, actors, messages, fname):
    """
    actors: list of (name, color)
    messages: list of (from_idx, to_idx, label, return_label_or_None)
    """
    n = len(actors)
    n_msg = len(messages)
    fig_w = max(12, n * 2.5)
    fig_h = max(8, n_msg * 0.7 + 3)
    fig, ax = plt.subplots(figsize=(fig_w, fig_h))
    ax.set_xlim(0, fig_w); ax.set_ylim(0, fig_h)
    ax.axis('off')
    ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
    ax.set_title(f"Sequence Diagram — {title}", fontsize=13,
                 fontweight='bold', color=C["dark"], pad=10)

    xs = [1.5 + i * (fig_w-2)/max(n-1,1) for i in range(n)]
    top_y = fig_h - 1.5
    bottom_y = 0.8

    # Actor boxes + lifelines
    for i, (name, col) in enumerate(actors):
        box(ax, xs[i]-1.0, top_y, 2.0, 0.55, name, fc=col, ec=col,
            tc="white", bold=True, fs=9)
        ax.plot([xs[i], xs[i]], [top_y, bottom_y], color=col,
                lw=1, ls='--', alpha=0.5, zorder=1)

    step_h = (top_y - bottom_y - 0.3) / max(n_msg, 1)

    for idx, (fi, ti, label, ret) in enumerate(messages):
        y = top_y - 0.3 - (idx+0.5) * step_h
        x1, x2 = xs[fi], xs[ti]
        # Activation box
        for xi in [x1, x2]:
            box(ax, xi-0.1, y-0.12, 0.2, 0.25, "", fc="white", ec=C["slate"], fs=6)
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                     arrowprops=dict(arrowstyle="-|>", color=C["dark"], lw=1.5))
        mx = (x1+x2)/2
        ax.text(mx, y+0.08, label, ha='center', fontsize=7.5,
                color=C["dark"],
                bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none', alpha=0.8))
        if ret:
            ay = y - step_h*0.45
            ax.annotate("", xy=(x1, ay), xytext=(x2, ay),
                         arrowprops=dict(arrowstyle="-|>", color=C["slate"], lw=1,
                                         ls='dashed'))
            ax.text((x1+x2)/2, ay+0.08, ret, ha='center', fontsize=7,
                    color=C["slate"], style='italic',
                    bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none', alpha=0.7))
    save(fig, fname)

sequence_diagram(
    "JWT Authentication Flow",
    [("Browser\nClient", C["blue"]), ("AuthController", C["green"]),
     ("AuthService", C["orange"]), ("PrismaService", C["purple"]),
     ("JwtService", C["teal"])],
    [
        (0, 1, "POST /auth/login {email, password}", None),
        (1, 2, "login(dto)", None),
        (2, 3, "user.findUnique({email})", "User | null"),
        (2, 3, "bcrypt.compare(pwd, hash)", "true | false"),
        (2, 4, "signAsync(payload) x2", "{accessToken, refreshToken}"),
        (2, 3, "user.update({refreshToken})", "User"),
        (1, 0, "200 OK: {accessToken, refreshToken, user}", None),
    ],
    "D14_seq_auth"
)

sequence_diagram(
    "RAG Document Ingestion",
    [("Browser", C["blue"]), ("AiController", C["green"]),
     ("PrismaService", C["purple"]), ("MinioService", C["orange"]),
     ("N8nRagService", C["teal"]), ("n8n Workflow", C["red"])],
    [
        (0, 1, "POST /ai/ingest-document {documentId}", None),
        (1, 2, "document.findFirst({id, tenantId})", "Document"),
        (1, 3, "getFileBuffer(tenantId, file_url)", "Buffer"),
        (1, 4, "ingestDocument({tenantId, filename, buffer})", None),
        (4, 5, "POST /webhook/legal-rag-ingest {base64, tenantId}", None),
        (5, 4, "HTTP 200 OK (queued)", None),
        (1, 0, '200 {success:true, message:"..."}', None),
    ],
    "D15_seq_ingest"
)

sequence_diagram(
    "Real-Time Notification",
    [("Admin\nBrowser", C["blue"]), ("NotificationsController", C["green"]),
     ("NotificationsService", C["orange"]), ("EventsGateway", C["purple"]),
     ("Socket.io\nClients", C["teal"]), ("BullMQ\nQueue", C["red"])],
    [
        (0, 1, "POST /notifications {level, message}", None),
        (1, 2, "create(dto, tenantId)", None),
        (2, 2, "prisma.notification.create()", "Notification"),
        (2, 3, "emitToTenant(tenantId, 'notification', data)", None),
        (3, 4, "server.to(tenant_room).emit('notification')", None),
        (4, 0, "Real-time notification bell update", None),
        (2, 5, "mailQueue.add({to, subject, body})", None),
        (5, 5, "MailProcessor.process() → sendMail()", None),
    ],
    "D16_seq_notification"
)

# ════════════════════════════════════════════════════════════════════════════
# D8: DFD Level 0 – Context Diagram
# ════════════════════════════════════════════════════════════════════════════
print("Generating DFDs...")
fig, ax = plt.subplots(figsize=(12, 8))
ax.set_xlim(0, 12); ax.set_ylim(0, 8); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("Data Flow Diagram — Level 0 (Context Diagram)", fontsize=13,
             fontweight='bold', color=C["dark"], pad=10)

# Central system
cx, cy = 5.5, 3.8
e_sys = mpatches.Circle((cx, cy), 1.5, fc="#DBEAFE", ec=C["blue"], lw=2.5, zorder=3)
ax.add_patch(e_sys)
ax.text(cx, cy+0.15, "LEXMANAGE", ha='center', fontsize=12,
        fontweight='bold', color=C["blue"], zorder=4)
ax.text(cx, cy-0.35, "Legal Management Platform", ha='center',
        fontsize=8, color=C["blue"], zorder=4)

# External entities
ext = [
    ("Law Firm\nUsers", 0.3, 6.5, C["green"]),
    ("n8n\nWorkflow", 9.5, 6.5, C["orange"]),
    ("Pinecone\nVector DB", 9.5, 1.0, C["teal"]),
    ("MinIO\nStorage", 0.3, 1.0, C["purple"]),
    ("SMTP\nServer", 5.0, 0.0, C["red"]),
    ("PostgreSQL", 0.3, 4.0, C["slate"]),
]
for name, x, y, col in ext:
    r = FancyBboxPatch((x, y), 1.8, 0.9, boxstyle="round,pad=0.05",
                        fc=f"#{col.lstrip('#')}22", ec=col, lw=2)
    ax.add_patch(r)
    ax.text(x+0.9, y+0.45, name, ha='center', va='center', fontsize=9,
            color=col, fontweight='bold')

# Flows
flows = [
    (1.8, 7.15, cx-1.4, cy+0.8, "Credentials, Queries", C["green"]),
    (cx+1.4, cy+0.8, 9.5, 7.15, "Chat/Ingest Webhooks", C["orange"]),
    (cx+1.4, cy-0.5, 9.5, 1.55, "Embeddings + Answers", C["teal"]),
    (1.8, 1.45, cx-1.4, cy-0.8, "Document Buffers", C["purple"]),
    (cx-0.5, cy-1.5, 5.5, 0.9, "Email Jobs", C["red"]),
    (2.1, 4.45, cx-1.5, cy-0.1, "SQL Queries/Results", C["slate"]),
]
for x1, y1, x2, y2, lbl, col in flows:
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                 arrowprops=dict(arrowstyle="<->", color=col, lw=1.5))
    ax.text((x1+x2)/2+0.1, (y1+y2)/2+0.1, lbl, fontsize=7.5,
            color=col, ha='center',
            bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none', alpha=0.9))
save(fig, "D17_dfd_level0")

# ════════════════════════════════════════════════════════════════════════════
# D9: DFD Level 1
# ════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(0, 14); ax.set_ylim(0, 10); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("Data Flow Diagram — Level 1 (System DFD)", fontsize=13,
             fontweight='bold', color=C["dark"], pad=10)

processes = [
    ("P1\nAuthentication\n& Auth", 1.5, 7.5, C["blue"]),
    ("P2\nCase\nManagement", 5.5, 7.5, C["green"]),
    ("P3\nDocument\nManagement", 9.5, 7.5, C["orange"]),
    ("P4\nLexAssist AI\n(RAG)", 1.5, 3.5, C["purple"]),
    ("P5\nNotifications\n& Events", 5.5, 3.5, C["red"]),
    ("P6\nCalendar &\nDeadlines", 9.5, 3.5, C["teal"]),
    ("P7\nStatistics\n& Dashboard", 5.5, 0.8, C["slate"]),
]
proc_pos = {}
for label, px, py, col in processes:
    e = mpatches.Circle((px, py), 0.9, fc=f"#{col.lstrip('#')}22",
                         ec=col, lw=2, zorder=3)
    ax.add_patch(e)
    ax.text(px, py, label, ha='center', va='center', fontsize=7.5,
            color=col, fontweight='bold', zorder=4, multialignment='center')
    proc_pos[label.split('\n')[0]] = (px, py)

# Data stores
stores = [
    ("D1: users/tenants", 1.5, 5.5, C["slate"]),
    ("D2: cases/deadlines", 5.5, 5.5, C["green"]),
    ("D3: documents", 9.5, 5.5, C["orange"]),
    ("D4: notifications", 5.5, 1.8, C["red"]),
]
for name, sx, sy, col in stores:
    ax.plot([sx-1.2, sx+1.2], [sy, sy], color=col, lw=1.5)
    ax.plot([sx-1.2, sx+1.2], [sy-0.35, sy-0.35], color=col, lw=1.5)
    ax.text(sx, sy-0.175, name, ha='center', va='center', fontsize=8, color=col)

# Connect processes to data stores
connections = [
    (1.5, 7.5, 1.5, 5.85),
    (5.5, 7.5, 5.5, 5.85),
    (9.5, 7.5, 9.5, 5.85),
    (5.5, 3.5, 5.5, 2.15),
    (5.5, 0.8, 5.5, 2.15),
]
for x1, y1, x2, y2 in connections:
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                 arrowprops=dict(arrowstyle="<->", color=C["slate"], lw=1))

# Inter-process flows
ax.annotate("", xy=(4.6, 7.5), xytext=(2.4, 7.5),
             arrowprops=dict(arrowstyle="->", color=C["green"], lw=1.2))
ax.text(3.5, 7.65, "Case + User data", fontsize=7, color=C["green"], ha='center')
ax.annotate("", xy=(8.6, 7.5), xytext=(6.4, 7.5),
             arrowprops=dict(arrowstyle="->", color=C["orange"], lw=1.2))
ax.text(7.5, 7.65, "Doc + Case link", fontsize=7, color=C["orange"], ha='center')
ax.annotate("", xy=(2.4, 3.5), xytext=(1.5, 4.6),
             arrowprops=dict(arrowstyle="->", color=C["purple"], lw=1.2))
ax.text(1.5, 4.05, "Docs\nbuffer", fontsize=7, color=C["purple"], ha='center')
ax.annotate("", xy=(4.6, 3.5), xytext=(1.5+0.9, 3.5),
             arrowprops=dict(arrowstyle="->", color=C["red"], lw=1.2))
ax.text(3.5, 3.65, "Trigger notification", fontsize=7, color=C["red"], ha='center')

save(fig, "D18_dfd_level1")

# ════════════════════════════════════════════════════════════════════════════
# D10: n8n RAG Workflow
# ════════════════════════════════════════════════════════════════════════════
print("Generating n8n RAG Workflow Diagram...")
fig, ax = plt.subplots(figsize=(14, 6))
ax.set_xlim(0, 14); ax.set_ylim(0, 6); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("n8n Legal RAG Workflow (Chat Path)", fontsize=13,
             fontweight='bold', color=C["dark"], pad=10)

nodes = [
    ("Webhook\nTrigger\n/legal-rag-chat", 0.3, 2.3, 1.8, 1.4, C["green"]),
    ("Verify &\nExtract\ntenantId+userId", 2.4, 2.3, 1.8, 1.4, C["blue"]),
    ("Simple\nMemory\n(load history)", 4.5, 2.3, 1.8, 1.4, C["purple"]),
    ("Cohere\nEmbeddings\nembed-v3.0", 4.5, 0.3, 1.8, 1.4, C["teal"]),
    ("Pinecone\nVector Store\n(namespace=tenantId)", 6.6, 1.3, 1.8, 1.4, C["orange"]),
    ("Cohere\nReranker\nrerank-v3", 8.7, 1.3, 1.8, 1.4, C["teal"]),
    ("Gemini\n2.5 Flash\nLLM Agent", 10.8, 2.3, 1.8, 1.4, C["red"]),
    ("Webhook\nResponse\n→ NestJS", 12.0, 2.3, 1.8, 1.4, C["green"]),
]
node_pos = {}
for text, x, y, w, h, col in nodes:
    box(ax, x, y, w, h, text, fc=f"#{col.lstrip('#')}22", ec=col,
        bold=True, fs=8.5, tc=C["dark"])
    node_pos[text] = (x+w/2, y+h/2)

arrows_flow = [
    (nodes[0], nodes[1]), (nodes[1], nodes[2]),
    (nodes[2], nodes[6]), (nodes[2], nodes[3]),
    (nodes[3], nodes[4]), (nodes[4], nodes[5]),
    (nodes[5], nodes[6]), (nodes[6], nodes[7]),
]
for src, dst in arrows_flow:
    sx, sy = src[1]+src[4]/2+src[3]/2, src[2]+src[4]/2
    dx, dy = dst[1], dst[2]+dst[4]/2
    if abs(sy - dy) < 0.1:
        ax.annotate("", xy=(dx, dy), xytext=(sx, sy),
                     arrowprops=dict(arrowstyle="-|>", color=C["slate"], lw=1.5))
    else:
        ax.annotate("", xy=(dx+dst[3]/2, dy), xytext=(sx-src[3]/2, sy),
                     arrowprops=dict(arrowstyle="-|>", color=C["slate"], lw=1.5,
                                     connectionstyle="arc3,rad=0.3"))

ax.text(7, 0.1, "Ingest path: Webhook → Load Doc → Cohere Embed → Pinecone Upsert (same namespace)",
        ha='center', fontsize=8, color=C["slate"], style='italic')
save(fig, "D19_n8n_workflow")

# ════════════════════════════════════════════════════════════════════════════
# D11: Pinecone Namespace Isolation
# ════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(12, 7))
ax.set_xlim(0, 12); ax.set_ylim(0, 7); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("Pinecone Vector Store — Tenant Namespace Isolation", fontsize=13,
             fontweight='bold', color=C["dark"], pad=10)

# Pinecone index
idx = FancyBboxPatch((0.5, 0.5), 11, 5.8, boxstyle="round,pad=0.1",
                      fc="white", ec=C["teal"], lw=2.5)
ax.add_patch(idx)
ax.text(6, 6.15, "Pinecone Index: lexmanage-legal-rag", ha='center',
        fontsize=11, fontweight='bold', color=C["teal"])

ns_data = [
    ("Namespace:\ntenant_A_uuid", 0.8, 1.0, 3.2, C["blue"],
     ["chunk_1: contract clause…", "chunk_2: confidentiality…", "chunk_3: payment terms…"]),
    ("Namespace:\ntenant_B_uuid", 4.3, 1.0, 3.2, C["green"],
     ["chunk_1: lease agreement…", "chunk_2: termination…", "chunk_3: deposit terms…"]),
    ("Namespace:\ntenant_N_uuid", 7.8, 1.0, 3.2, C["orange"],
     ["chunk_1: employment…", "chunk_2: probation…", "chunk_N: …"]),
]
for label, x, y, w, col, chunks in ns_data:
    ns_box = FancyBboxPatch((x, y), w, 4.5, boxstyle="round,pad=0.08",
                              fc=f"#{col.lstrip('#')}11", ec=col, lw=1.5)
    ax.add_patch(ns_box)
    ax.text(x+w/2, y+4.2, label, ha='center', fontsize=9,
            fontweight='bold', color=col)
    for i, chunk in enumerate(chunks):
        box(ax, x+0.1, y+3.2-i*0.9, w-0.2, 0.75, chunk,
            fc="white", ec=col, fs=8, tc=C["dark"])

ax.text(6, 0.2, "Queries are ALWAYS scoped to the requesting firm's namespace — cross-tenant retrieval is impossible",
        ha='center', fontsize=8.5, color=C["red"], fontweight='bold')
save(fig, "D20_pinecone_namespaces")

# ════════════════════════════════════════════════════════════════════════════
# D12: MinIO Bucket Structure
# ════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(11, 7))
ax.set_xlim(0, 11); ax.set_ylim(0, 7); ax.axis('off')
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("MinIO — Tenant-Scoped Bucket Structure", fontsize=13,
             fontweight='bold', color=C["dark"], pad=10)

buckets = [
    ("lex-tenant_A_uuid", 0.3, 0.5, 3.0, C["blue"],
     ["documents/2026/06/abc123/contrat.pdf", "documents/2026/05/def456/facture.docx", "documents/2026/06/ghi789/notes.txt"]),
    ("lex-tenant_B_uuid", 3.8, 0.5, 3.0, C["green"],
     ["documents/2026/06/xyz001/bail.pdf", "documents/2026/06/xyz002/avenant.docx"]),
    ("lex-tenant_N_uuid", 7.3, 0.5, 3.0, C["orange"],
     ["documents/…", "…"]),
]
for bname, x, y, w, col, files in buckets:
    bkt = FancyBboxPatch((x, y), w, 5.8, boxstyle="round,pad=0.08",
                           fc=f"#{col.lstrip('#')}11", ec=col, lw=2)
    ax.add_patch(bkt)
    ax.text(x+w/2, y+5.5, bname, ha='center', fontsize=8.5,
            fontweight='bold', color=col)
    # Folder icon simulation
    for i, fname in enumerate(files):
        box(ax, x+0.1, y+4.5-i*1.1, w-0.2, 0.9, f"📄 {fname}",
            fc="white", ec=col, fs=7.5, tc=C["dark"])

ax.text(5.5, 0.15, "Each bucket named  lex-{tenantId}  —  objects isolated per firm by MinIO access policy",
        ha='center', fontsize=8, color=C["slate"], style='italic')
save(fig, "D21_minio_buckets")

# ════════════════════════════════════════════════════════════════════════════
# D13: Project Gantt Chart
# ════════════════════════════════════════════════════════════════════════════
print("Generating Gantt Chart...")
fig, ax = plt.subplots(figsize=(14, 8))
ax.set_facecolor(C["bg"]); fig.patch.set_facecolor(C["bg"])
ax.set_title("LexManage — Project Gantt Chart (10-Week Development Schedule)",
             fontsize=13, fontweight='bold', color=C["dark"], pad=10)

tasks = [
    ("Project Setup & Scaffold", 0, 1, C["slate"]),
    ("Prisma Schema & Migrations", 0.5, 1.5, C["slate"]),
    ("JWT Auth & Multi-tenant Middleware", 1, 2.5, C["blue"]),
    ("User & Tenant Management", 1.5, 3, C["blue"]),
    ("Case Management Module", 2.5, 4.5, C["green"]),
    ("Client Directory Module", 3, 4.5, C["green"]),
    ("Deadline & Calendar Module", 3.5, 5, C["green"]),
    ("MinIO Integration & DMS", 4, 6, C["orange"]),
    ("Document Upload Pipeline (PDF/DOCX/TXT)", 4.5, 6.5, C["orange"]),
    ("n8n RAG Workflow Design", 5, 7, C["purple"]),
    ("N8nRagService & AI Endpoints", 5.5, 7.5, C["purple"]),
    ("Socket.io Notification Gateway", 6, 7.5, C["red"]),
    ("BullMQ Mail & Reminders Queue", 6.5, 8, C["red"]),
    ("React Frontend (Vite + Tailwind)", 5, 9, C["teal"]),
    ("React Query Hooks & Zustand Store", 6, 9, C["teal"]),
    ("Statistics & Dashboard", 7.5, 9, C["teal"]),
    ("Unit & Integration Tests", 8, 10, C["amber"]),
    ("System Testing & Bug Fixes", 8.5, 10, C["amber"]),
    ("Documentation & Report", 9, 10, C["slate"]),
]

weeks = list(range(11))
ax.set_xlim(-0.5, 10.5)
ax.set_ylim(-0.5, len(tasks)+0.5)
ax.set_yticks(range(len(tasks)))
ax.set_yticklabels([t[0] for t in tasks], fontsize=8)
ax.set_xticks(weeks)
ax.set_xticklabels([f"W{w}" for w in weeks], fontsize=9)
ax.grid(axis='x', color=C["border"], lw=0.5, alpha=0.6)
ax.invert_yaxis()

sprint_colors = [C["blue"], C["green"], C["orange"], C["purple"], C["amber"]]
sprint_labels = ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5"]
for si, (sx, ex) in enumerate([(0,2),(2,4),(4,6),(6,8),(8,10)]):
    ax.axvspan(sx, ex, alpha=0.05, color=sprint_colors[si])
    ax.text((sx+ex)/2, -0.3, sprint_labels[si], ha='center', fontsize=8,
            color=sprint_colors[si], fontweight='bold')

for i, (name, start, end, col) in enumerate(tasks):
    ax.barh(i, end-start, left=start, height=0.65,
            color=col, alpha=0.8, edgecolor='white', linewidth=0.5)

fig.tight_layout(pad=1.5)
save(fig, "D22_gantt")

print("\nAll diagrams generated!")
import os
files = [f for f in sorted(os.listdir(OUT)) if f.startswith('D')]
for f in files:
    sz = os.path.getsize(f"{OUT}/{f}")//1024
    print(f"  {f}  ({sz} KB)")
