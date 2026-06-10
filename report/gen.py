# -*- coding: utf-8 -*-
"""Generate the LexManage BTech project report as HTML (then printed to PDF).
Two-pass: pass 1 produces report.html with empty page refs; an external step
prints it, pdfplumber reads back the page of each marker, and pass 2 fills the
Table of Contents and List of Figures with real page numbers."""
import json, os, sys, html
import diagrams as D

# ----------------------------- Cover / identity -----------------------------
UNIVERSITY   = "UNIVERSITY OF BUEA"
FACULTY      = "COLLEGE OF TECHNOLOGY (COLTECH)"
DEPARTMENT   = "DEPARTMENT OF COMPUTER ENGINEERING"
PROGRAMME    = "Bachelor of Technology (B.Tech) in Software Engineering"
TITLE        = ("Design and Implementation of LexManage: A Multi-Tenant SaaS "
                "Legal Practice Management Platform with AI-Powered Document Analysis")
STUDENT      = "Emmanuel Nyouma"
SUPERVISOR   = "Mr Baloko"
ACAD_YEAR    = "2025/2026"
CITY         = "Buea, Cameroon"

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = {}
if os.path.exists(os.path.join(HERE, "pages.json")):
    with open(os.path.join(HERE, "pages.json"), encoding="utf-8") as f:
        PAGES = json.load(f)

# ----------------------------- Builder --------------------------------------
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}

class Doc:
    def __init__(self):
        self.body = []
        self.toc = []     # (level, number, title, token)
        self.figs = []    # (label, caption, token)
        self.tabs = []    # (label, caption)
        self._tok = 0
        self.chapnum = 0  # current chapter number for auto-numbering
        self.fig_n = 0
        self.tab_n = 0
        self.figmap = {}  # key -> "Figure 3.2"  (resolved at assembly for cross-refs)
        self.tabmap = {}  # key -> "Table 3.2"

    def tok(self):
        self._tok += 1
        return f"t{self._tok}"

    def FIG(self, key):
        return f"@@FIG:{key}@@"   # placeholder, resolved at assembly

    def TAB(self, key):
        return f"@@TAB:{key}@@"

    def marker(self, tok):
        # invisible (tiny white) marker captured by pdfplumber for page lookup
        return f'<span style="font-size:1px;color:#ffffff">@@{tok}@@</span>'

    def chapter(self, roman, title):
        self.chapnum = ROMAN.get(roman, self.chapnum)
        self.fig_n = 0
        self.tab_n = 0
        tok = self.tok()
        self.toc.append((0, f"CHAPTER {roman}", title, tok))
        self.body.append(
            f'<div class="chapter">{self.marker(tok)}'
            f'<div class="chlabel">CHAPTER {roman}</div>'
            f'<h1>{html.escape(title)}</h1></div>')

    def frontheading(self, title):
        tok = self.tok()
        self.toc.append((0, "", title, tok))
        self.body.append(f'<div class="frontsec">{self.marker(tok)}<h1 class="fronth">{html.escape(title)}</h1>')

    def end_front(self):
        self.body.append('</div>')

    def h2(self, num, title):
        tok = self.tok()
        self.toc.append((1, num, title, tok))
        self.body.append(f'{self.marker(tok)}<h2>{num}&nbsp;&nbsp;{html.escape(title)}</h2>')

    def h3(self, num, title):
        tok = self.tok()
        self.toc.append((2, num, title, tok))
        self.body.append(f'{self.marker(tok)}<h3>{num}&nbsp;&nbsp;{html.escape(title)}</h3>')

    def h4(self, title):
        self.body.append(f'<p class="h4">{html.escape(title)}</p>')

    def p(self, text):
        self.body.append(f'<p>{text}</p>')

    def ul(self, items):
        lis = "".join(f'<li>{i}</li>' for i in items)
        self.body.append(f'<ul>{lis}</ul>')

    def ol(self, items):
        lis = "".join(f'<li>{i}</li>' for i in items)
        self.body.append(f'<ol>{lis}</ol>')

    def figure(self, key, caption, svg=None, img=None, width="100%"):
        self.fig_n += 1
        label = f"Figure {self.chapnum}.{self.fig_n}"
        self.figmap[key] = label
        tok = self.tok()
        self.figs.append((label, caption, tok))
        if svg:
            inner = svg
        elif img and os.path.exists(os.path.join(HERE, "figures", img)):
            inner = f'<img src="figures/{img}" style="width:{width}" class="shot"/>'
        else:
            inner = (f'<div class="ph" style="width:{width}"><b>[ {label} ]</b><br/>'
                     f'Screenshot to be inserted: <code>figures/{img}</code></div>')
        # caption is author-controlled HTML (may contain &mdash; etc.) — do NOT escape.
        self.body.append(
            f'<figure>{self.marker(tok)}{inner}'
            f'<figcaption><b>{label}:</b> {caption}</figcaption></figure>')

    def table(self, key, caption, headers, rows, widths=None, label=None):
        if label is None:
            self.tab_n += 1
            label = f"Table {self.chapnum}.{self.tab_n}"
        self.tabmap[key] = label
        self.tabs.append((label, caption))
        colg = ""
        if widths:
            colg = "<colgroup>" + "".join(f'<col style="width:{w}"/>' for w in widths) + "</colgroup>"
        thead = "<tr>" + "".join(f"<th>{h}</th>" for h in headers) + "</tr>"
        body = ""
        for r in rows:
            body += "<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>"
        self.body.append(
            f'<table>{colg}<caption><b>{label}:</b> {caption}</caption>'
            f'<thead>{thead}</thead><tbody>{body}</tbody></table>')

    def raw(self, h):
        self.body.append(h)

d = Doc()

# =========================================================================
#  FRONT MATTER  (certification page intentionally skipped)
# =========================================================================
def P(tok_title):  # page-ref lookup
    return str(PAGES.get(tok_title, ""))

# --- Attestation ---
d.frontheading("ATTESTATION")
d.p("I, <b>%s</b>, hereby declare that this project report entitled "
    "&ldquo;%s&rdquo; is the result of my own original work carried out under the "
    "supervision of %s. To the best of my knowledge, it contains no material previously "
    "published or written by another person, nor material which has been accepted for the "
    "award of any other degree or diploma, except where due acknowledgement has been made "
    "in the text. All sources of information have been duly referenced." % (STUDENT, TITLE, SUPERVISOR))
d.raw('<div class="signrow"><div>Student: <b>%s</b><br/>Signature: ........................<br/>Date: ........................</div>'
      '<div>Supervisor: <b>%s</b><br/>Signature: ........................<br/>Date: ........................</div></div>' % (STUDENT, SUPERVISOR))
d.end_front()

# --- Dedication ---
d.frontheading("DEDICATION")
d.raw('<p style="text-align:center;font-style:italic;margin-top:60px">'
      'To my family, whose constant encouragement and sacrifices made this work possible, '
      'and to every legal professional striving to serve justice more efficiently.</p>')
d.end_front()

# --- Acknowledgements ---
d.frontheading("ACKNOWLEDGEMENTS")
d.p("I wish to express my sincere gratitude to my supervisor, <b>%s</b>, for the guidance, "
    "constructive criticism and patience that shaped this project from concept to completion." % SUPERVISOR)
d.p("My thanks also go to the academic staff of the %s, %s, for the solid grounding in "
    "software engineering principles that underpins this work." % (DEPARTMENT.title(), UNIVERSITY.title()))
d.p("Finally, I am deeply grateful to my family, friends and classmates for their moral "
    "support, and to the open-source community whose tools made this platform achievable.")
d.end_front()

# --- Abstract ---
d.frontheading("ABSTRACT")
d.p("Law firms manage a high volume of cases, clients, hearings and confidential documents, "
    "yet many still rely on fragmented tools&mdash;spreadsheets, shared drives and email&mdash;that "
    "are error-prone, insecure and difficult to audit. This project presents <b>LexManage</b>, an "
    "enterprise-grade, multi-tenant Software-as-a-Service (SaaS) platform that consolidates legal "
    "practice management into a single secure web application.")
d.p("LexManage is built as a decoupled system: a React&nbsp;19 single-page application communicates "
    "with a NestJS REST API backed by PostgreSQL through the Prisma ORM. Strict tenant isolation is "
    "enforced at the application layer using Node.js <i>AsyncLocalStorage</i> together with a Prisma "
    "client extension, guaranteeing that one firm can never access another firm&rsquo;s data. The "
    "platform provides role-based access control, JWT authentication with refresh tokens, an immutable "
    "audit trail, real-time notifications over Socket.io, secure document storage on MinIO via presigned "
    "URLs, and an AI assistant (<b>LexAssist</b>) that uses Retrieval-Augmented Generation (RAG)&mdash;"
    "implemented as n8n workflows with Cohere embeddings, a Pinecone vector database and a DeepSeek "
    "language model&mdash;to answer questions over case files with verifiable citations.")
d.p("The system was developed following an iterative, Agile methodology and validated through unit, "
    "integration and system testing. The result is a responsive, bilingual (English/French) platform "
    "that improves the efficiency, security and traceability of day-to-day legal operations. This report "
    "documents the problem analysis, requirements, design, implementation and testing of the platform.")
d.raw('<p style="margin-top:14px"><b>Keywords:</b> Legal Tech, SaaS, Multi-tenancy, NestJS, React, '
      'Prisma, RBAC, Retrieval-Augmented Generation, Vector Database, Audit Trail.</p>')
d.end_front()

# --- List of Abbreviations ---
d.frontheading("LIST OF ABBREVIATIONS")
abbr = [
    ("AI", "Artificial Intelligence"), ("ALS", "AsyncLocalStorage"),
    ("API", "Application Programming Interface"), ("CRM", "Client Relationship Management"),
    ("CRUD", "Create, Read, Update, Delete"), ("CI/CD", "Continuous Integration / Continuous Delivery"),
    ("DFD", "Data Flow Diagram"), ("DMS", "Document Management System"),
    ("DTO", "Data Transfer Object"), ("ERD", "Entity-Relationship Diagram"),
    ("HTTP", "HyperText Transfer Protocol"), ("JWT", "JSON Web Token"),
    ("LLM", "Large Language Model"), ("MFA", "Multi-Factor Authentication"),
    ("ORM", "Object-Relational Mapping"), ("RAG", "Retrieval-Augmented Generation"),
    ("RBAC", "Role-Based Access Control"), ("REST", "Representational State Transfer"),
    ("SaaS", "Software as a Service"), ("SPA", "Single-Page Application"),
    ("SQL", "Structured Query Language"), ("UI/UX", "User Interface / User Experience"),
    ("WSS", "WebSocket Secure"),
]
rows = "".join(f'<tr><td style="width:18%;font-weight:bold">{a}</td><td>{b}</td></tr>' for a, b in abbr)
d.raw(f'<table class="plain"><tbody>{rows}</tbody></table>')
d.end_front()

# --- List of Figures (placeholder; filled in assembly) ---
d.raw("__LIST_OF_FIGURES__")
# --- Table of Contents (placeholder; filled in assembly) ---
d.raw("__TABLE_OF_CONTENTS__")

# =========================================================================
#  CHAPTER I — GENERAL INTRODUCTION
# =========================================================================
d.chapter("I", "GENERAL INTRODUCTION")

d.h2("1.1", "Introduction")
d.p("The legal profession is, by its very nature, information-intensive. A single case may involve "
    "dozens of clients, hearings, statutory deadlines and hundreds of pages of confidential documents "
    "that must be stored, retrieved and acted upon with precision. As caseloads grow, the tools many "
    "firms use to coordinate this work&mdash;spreadsheets, shared folders and email threads&mdash;struggle "
    "to keep pace. This chapter introduces <b>LexManage</b>, a web-based legal practice management "
    "platform designed to address these challenges, and sets out the background, problem, objectives "
    "and scope of the project.")

d.h2("1.2", "Background of the Study")
d.p("Digital transformation has reshaped most professional services, yet legal practice management "
    "in many jurisdictions remains comparatively under-digitised. Where dedicated software exists it is "
    "often expensive, installed on a single machine, or hosted abroad with limited regard for local data-"
    "protection expectations. Meanwhile, advances in cloud computing have popularised the "
    "<b>Software-as-a-Service (SaaS)</b> delivery model, in which a single, centrally maintained "
    "application securely serves many independent organisations (tenants) over the internet.")
d.p("In parallel, the maturation of <b>Large Language Models (LLMs)</b> has created an opportunity to "
    "augment knowledge work. When combined with <b>Retrieval-Augmented Generation (RAG)</b>&mdash;a "
    "technique that grounds an LLM&rsquo;s answers in an organisation&rsquo;s own documents&mdash;these "
    "models can summarise lengthy files, draft routine clauses and answer questions with traceable "
    "citations. LexManage was conceived to bring both of these advances, secure multi-tenant SaaS and "
    "document-grounded AI, to the day-to-day operations of a law firm.")

d.h2("1.3", "Statement of the Problem")
d.p("Law firms that rely on disconnected, manual tools face a set of recurring and costly problems:")
d.ul([
    "<b>Fragmented data.</b> Client details, case files and documents live in separate places, making a "
    "complete, reliable view of a matter difficult to obtain.",
    "<b>Weak security and confidentiality.</b> Shared drives and email offer little access control, "
    "putting privileged information at risk and complicating compliance.",
    "<b>Missed deadlines.</b> Hearings and statutory time-limits tracked in personal calendars are "
    "easily overlooked, with serious professional consequences.",
    "<b>No traceability.</b> Without an audit trail it is hard to know who changed what and when, which "
    "undermines accountability.",
    "<b>Slow document review.</b> Manually reading and summarising voluminous case files consumes "
    "billable hours that could be spent on higher-value legal reasoning.",
])
d.p("The core problem this project addresses is therefore the <b>absence of a single, secure and "
    "intelligent system</b> that unifies client, case, calendar and document management for a law firm "
    "while guaranteeing strict data isolation between firms.")

d.h2("1.4", "Objectives of the Study")
d.h3("1.4.1", "General Objective")
d.p("To design and implement a secure, multi-tenant SaaS platform that centralises and streamlines "
    "the management of clients, cases, hearings and documents for law firms, enhanced with an "
    "AI assistant for document analysis.")
d.h3("1.4.2", "Specific Objectives")
d.ol([
    "To analyse the operational needs of a typical law firm and derive functional and non-functional "
    "requirements.",
    "To design a multi-tenant architecture that enforces strict data isolation between firms.",
    "To implement secure authentication and role-based access control (admin, lawyer, assistant).",
    "To build modules for client (CRM), case, calendar/deadline and document management.",
    "To integrate a Retrieval-Augmented Generation assistant for summarising and querying case documents.",
    "To provide real-time notifications and an immutable audit trail for accountability.",
    "To validate the platform through unit, integration and system testing.",
])

d.h2("1.5", "Significance of the Study")
d.p("For <b>legal practitioners</b>, LexManage reduces administrative overhead, lowers the risk of "
    "missed deadlines and accelerates document review, freeing time for substantive legal work. For "
    "<b>firm administrators</b>, it provides governance through RBAC, audit logging and centralised "
    "configuration. For the <b>discipline of software engineering</b>, the project is a concrete case "
    "study in building a secure multi-tenant SaaS system and in applying RAG to a regulated, "
    "confidentiality-sensitive domain.")

d.h2("1.6", "Scope of the Study")
d.p("The project covers the design and implementation of a working web platform comprising: firm "
    "onboarding and team invitations; authentication and RBAC; client, case, calendar and document "
    "management; real-time notifications; an audit trail; and an AI document-analysis assistant. The "
    "work focuses on the software system itself. Native mobile applications, online payment "
    "processing, integration with external court e-filing systems and large-scale production "
    "deployment/operations are considered out of scope, although the architecture is designed to "
    "accommodate such extensions in future.")

d.h2("1.7", "Definition of Working Terms")
d.table("terms", "Definition of key working terms",
        ["Term", "Meaning in this report"],
        [
            ("Tenant", "An isolated organisation (law firm) within the SaaS platform; all of a tenant&rsquo;s data is private to it."),
            ("Multi-tenancy", "An architecture where one running application instance securely serves many tenants."),
            ("RBAC", "Role-Based Access Control&mdash;permissions granted according to a user&rsquo;s role."),
            ("JWT", "A signed token used to authenticate API requests without server-side session storage."),
            ("RAG", "Retrieval-Augmented Generation&mdash;grounding an LLM&rsquo;s answers in retrieved documents."),
            ("Vector database", "A store of numerical &lsquo;embeddings&rsquo; enabling semantic similarity search (Pinecone)."),
            ("Presigned URL", "A temporary, signed link granting time-limited access to a stored file."),
            ("Audit trail", "An immutable log of who performed which action on which record and when."),
        ], widths=["22%", "78%"])

d.h2("1.8", "Organisation of the Study")
d.p("The remainder of this report is organised as follows. <b>Chapter II</b> reviews existing systems "
    "and positions the proposed solution. <b>Chapter III</b> presents the materials and methods used, "
    "covering the development methodology, system analysis (requirements and diagrams) and system "
    "design (architecture, data model and user-interface design). <b>Chapter IV</b> describes the "
    "implementation, results and testing of the platform. <b>Chapter V</b> concludes the report and "
    "offers recommendations and perspectives for further work.")

# =========================================================================
#  CHAPTER II — LITERATURE REVIEW
# =========================================================================
d.chapter("II", "LITERATURE REVIEW")

d.h2("2.1", "Introduction")
d.p("This chapter surveys existing approaches to legal practice management and the technologies that "
    "underpin them, in order to identify gaps that LexManage seeks to fill. It examines representative "
    "commercial systems, the general-purpose tools firms improvise with, and the technical foundations "
    "of multi-tenancy and Retrieval-Augmented Generation, before stating the proposed solution.")

d.h2("2.2", "Review of Existing Systems")
d.p("A range of solutions are used, formally or informally, to manage legal work. The most relevant "
    "categories and representative examples are reviewed below.")

d.h3("2.2.1", "Clio")
d.p("Clio is a mature, cloud-based legal practice management suite offering case management, billing "
    "and client intake. It is feature-rich and widely adopted, but it is a commercial product priced "
    "per user per month, hosted in foreign data centres, and offers limited document-grounded AI; its "
    "cost and data-residency model can be unsuitable for smaller or locally focused firms.")
d.h3("2.2.2", "MyCase")
d.p("MyCase provides case management, client communication and invoicing with a friendly interface. "
    "Like Clio it is subscription-based and closed-source, and its automation focuses on workflow "
    "templates rather than on AI-assisted analysis of the firm&rsquo;s own documents.")
d.h3("2.2.3", "PracticePanther")
d.p("PracticePanther emphasises automation and ease of use for small firms. It covers the core "
    "management functions well but, again, is a proprietary hosted service with limited transparency "
    "over how and where data is stored and no open, document-grounded AI capability.")
d.h3("2.2.4", "Generic office tools (spreadsheets, shared drives, email)")
d.p("Many firms manage matters with general-purpose tools. These are inexpensive and familiar but "
    "provide no access control beyond folder permissions, no audit trail, no structured deadline "
    "tracking and no protection against data being mixed between unrelated matters or clients.")
d.h3("2.2.5", "Document management systems (e.g. NetDocuments, iManage)")
d.p("Dedicated legal DMS products excel at secure document storage and versioning but are typically "
    "expensive, focus narrowly on documents rather than the full practice workflow, and are not "
    "designed around modern document-grounded AI assistants.")
d.h3("2.2.6", "Summary of the gap")
d.p("The review shows that existing options force a trade-off: powerful commercial suites are costly, "
    "proprietary and host data abroad with little AI grounding, while improvised tools are cheap but "
    "insecure and fragmented. None combine, in a single accessible system: strict multi-tenant "
    "isolation, role-based governance, an audit trail, real-time alerts and an AI assistant that "
    "answers questions over the firm&rsquo;s own documents with citations.")
d.table("compare", "Comparison of existing systems with the proposed solution",
        ["Capability", "Commercial suites", "Generic tools", "Legal DMS", "LexManage"],
        [
            ("Multi-tenant SaaS", "Yes", "No", "Partial", "Yes"),
            ("RBAC &amp; audit trail", "Partial", "No", "Partial", "Yes"),
            ("Case + calendar + CRM", "Yes", "Manual", "No", "Yes"),
            ("Secure document store", "Yes", "No", "Yes", "Yes"),
            ("Document-grounded AI (RAG)", "Limited", "No", "No", "Yes"),
            ("Real-time notifications", "Partial", "No", "No", "Yes"),
        ], widths=["30%","18%","14%","14%","12%"])

d.h2("2.3", "Proposed Solution")
d.p("LexManage is proposed as an integrated, multi-tenant SaaS platform that unifies the strengths of "
    "the reviewed categories while closing their gaps. It delivers full practice management (clients, "
    "cases, calendar, documents) with enterprise-grade security (JWT authentication, RBAC, strict "
    "tenant isolation, audit logging and presigned-URL document access), real-time collaboration via "
    "Socket.io, and a built-in AI assistant&mdash;<b>LexAssist</b>&mdash;that applies Retrieval-Augmented "
    "Generation over the firm&rsquo;s documents to provide summaries, drafts and grounded answers with "
    "citations. The design, methods and implementation that realise this solution are detailed in the "
    "following chapters.")

# =========================================================================
#  CHAPTER III — MATERIALS AND METHODS USED
# =========================================================================
d.chapter("III", "MATERIALS AND METHODS USED")

d.h2("3.1", "Introduction")
d.p("This chapter describes how the LexManage platform was engineered. It first presents the "
    "development methodology, then the system analysis&mdash;requirements, data-flow, use-case and "
    "activity models, cost and schedule&mdash;and finally the system design, covering the tools used, "
    "architecture, class and sequence models, user-interface design, the entity-relationship model and "
    "the data dictionary.")

d.h2("3.2", "Methods Used")

d.h3("3.2.1", "Development Methodology Used")
d.p("An <b>iterative and incremental (Agile)</b> methodology was adopted. Rather than attempting to "
    "specify the entire system up front, development proceeded in short cycles, each delivering a "
    "working slice of functionality (for example, authentication, then case management, then the AI "
    "assistant). Every iteration comprised requirements refinement, design, implementation and testing, "
    "allowing feedback to be incorporated continuously and risk to be reduced early. This approach "
    "suited a single-developer project of evolving scope and aligned naturally with the modular "
    "structure of the NestJS backend and the component-based React frontend.")

d.h3("3.2.2", "System Analysis")
d.p("System analysis translates the problem and objectives of Chapter&nbsp;I into a precise "
    "specification of what the platform must do and the constraints under which it must operate.")

d.h4("External Interface Requirements")
d.ul([
    "<b>User interface:</b> a responsive web SPA accessible from any modern browser, with light/dark "
    "themes and English/French localisation.",
    "<b>Software interfaces:</b> a RESTful HTTP/JSON API; a WebSocket (Socket.io) channel for real-time "
    "notifications; the MinIO S3 API for object storage; the Pinecone API for vector search; and n8n "
    "workflows (DeepSeek and Cohere) for the AI assistant.",
    "<b>Hardware interfaces:</b> none beyond a standard internet-connected client device and a server "
    "host; no specialised peripherals are required.",
    "<b>Communication interfaces:</b> HTTPS for all client-server traffic and WSS for the real-time "
    "channel; SMTP for outgoing invitation and reminder e-mails.",
])

d.h4("Features or Modules of the System")
d.ul([
    "<b>Identity &amp; Organisation:</b> firm onboarding, secure token-based invitations, RBAC.",
    "<b>Client Management (CRM):</b> directory of physical and legal-entity clients and their matters.",
    "<b>Case Management:</b> full lifecycle of legal files with status, priority and assignment.",
    "<b>Calendar &amp; Deadlines:</b> hearing and deadline scheduling with automated reminders.",
    "<b>Document Management:</b> categorised, role-restricted document library on secure storage.",
    "<b>LexAssist AI:</b> RAG-based summarisation, drafting and grounded Q&amp;A over documents.",
    "<b>Notifications:</b> real-time and scheduled alerts with urgency levels.",
    "<b>Audit &amp; Statistics:</b> immutable audit trail and dashboard key-performance indicators.",
])

d.h4("Functional Requirements")
d.table("fr", "Functional requirements of the system",
        ["ID", "Requirement"],
        [
            ("FR-1", "The system shall allow an administrator to create a firm and invite collaborators via a secure, expiring token."),
            ("FR-2", "The system shall authenticate users with email/password and issue JWT access and refresh tokens."),
            ("FR-3", "The system shall enforce role-based permissions for admin, lawyer and assistant roles."),
            ("FR-4", "The system shall let authorised users create, read, update and archive clients, cases and documents."),
            ("FR-5", "The system shall schedule hearings/deadlines and send reminders ahead of due dates."),
            ("FR-6", "The system shall store documents securely and serve them through time-limited presigned URLs."),
            ("FR-7", "The system shall answer natural-language questions over a firm&rsquo;s documents using RAG, returning citations."),
            ("FR-8", "The system shall deliver real-time notifications and highlight urgent alerts."),
            ("FR-9", "The system shall record an immutable audit log of create/update actions on key entities."),
            ("FR-10", "The system shall isolate each firm&rsquo;s data so it is inaccessible to any other firm."),
        ], widths=["12%", "88%"])

d.h4("Non-functional Requirements")
d.table("nfr", "Non-functional requirements of the system",
        ["ID", "Category", "Requirement"],
        [
            ("NFR-1", "Security", "All traffic over HTTPS; passwords hashed; secrets held server-side; presigned-URL file access."),
            ("NFR-2", "Privacy/Isolation", "Strict per-tenant data isolation enforced automatically on every query."),
            ("NFR-3", "Performance", "Typical interactive requests served in under ~300&nbsp;ms; calendar views optimised for O(1) lookups."),
            ("NFR-4", "Usability", "Responsive, accessible UI with bilingual support and clear empty/error states."),
            ("NFR-5", "Reliability", "Graceful error handling and retry; no single failed request crashes the UI."),
            ("NFR-6", "Maintainability", "Modular, layered codebase with DTO validation and centralised error handling."),
            ("NFR-7", "Scalability", "Stateless API enabling horizontal scaling behind a load balancer."),
        ], widths=["10%", "20%", "70%"])

d.h4("Data Flow Diagrams (DFDs)")
d.p(f"The context (level-0) data-flow diagram in {d.FIG('dfd')} situates LexManage among its external "
    "entities&mdash;firm staff, the n8n AI service (DeepSeek, Cohere and Pinecone), the MinIO object "
    "store and the e-mail gateway&mdash;and shows the principal data exchanged with each.")
d.figure("dfd", "Context (Level-0) Data Flow Diagram of LexManage", svg=D.context_dfd())

d.h4("Use Case Analysis and Diagrams")
d.p("The principal actors are the <b>Cabinet Administrator</b>, the <b>Lawyer</b> and the "
    "<b>Assistant/Secretary</b>. The administrator manages the firm and its members; lawyers manage "
    "cases, clients, documents and use the AI assistant; assistants support document and calendar work. "
    f"{d.FIG('usecase')} presents the use-case diagram.")
d.figure("usecase", "Use Case Diagram of the LexManage platform", svg=D.use_case())

d.h4("Activity Diagrams")
d.p(f"Two activities capture the platform&rsquo;s most important control flows. The first, "
    f"{d.FIG('act_ingest')}, models <b>document ingestion and AI indexing</b>: a file uploaded through "
    "the interface is stored in MinIO, after which an n8n workflow extracts its text (branching on file "
    "type), splits it into overlapping chunks, generates Cohere embeddings and upserts the resulting "
    "vectors into Pinecone before the document is marked as indexed.")
d.figure("act_ingest", "Activity diagram &mdash; document ingestion and AI indexing (n8n)", svg=D.activity_ingestion(), width="60%")
d.p(f"The second, {d.FIG('act_case')}, models <b>creating a new case</b>: the user completes the form, "
    "the input is validated (looping back on error), the case is persisted within the firm&rsquo;s "
    "tenant scope, and an audit entry and a real-time notification are produced in parallel before the "
    "new case appears in the list.")
d.figure("act_case", "Activity diagram &mdash; creating a new case", svg=D.activity_case(), width="58%")

d.h4("Cost Evaluation")
d.p("Because the platform is built entirely on free and open-source software and free service tiers, "
    "the development cost is dominated by human effort. An indicative evaluation is given below.")
d.table("cost", "Indicative cost evaluation",
        ["Item", "Description", "Estimated cost"],
        [
            ("Development effort", "~4 months, single developer (opportunity cost)", "Time-based"),
            ("Software tools", "NestJS, React, PostgreSQL, MinIO, n8n, VS&nbsp;Code (all open-source)", "0"),
            ("AI services", "DeepSeek (chat), Cohere (embeddings/rerank) and Pinecone (vector store) on free/low-cost tiers", "Low / metered"),
            ("Hosting (dev)", "Local Docker environment", "0"),
            ("Hosting (production, indicative)", "Cloud VPS + managed PostgreSQL", "~$20&ndash;50 / month"),
        ], widths=["26%","54%","20%"])

d.h4("Project Schedule")
d.table("sched", "Project schedule by phase",
        ["Phase", "Activities", "Duration"],
        [
            ("1. Analysis", "Requirements gathering, literature review", "Weeks 1&ndash;2"),
            ("2. Design", "Architecture, data model, UI design", "Weeks 3&ndash;4"),
            ("3. Core implementation", "Auth, RBAC, multi-tenancy, CRUD modules", "Weeks 5&ndash;9"),
            ("4. AI &amp; realtime", "RAG assistant, notifications, audit trail", "Weeks 10&ndash;12"),
            ("5. Testing &amp; hardening", "Unit/integration/system tests, fixes", "Weeks 13&ndash;14"),
            ("6. Documentation", "Report writing and finalisation", "Weeks 15&ndash;16"),
        ], widths=["24%","56%","20%"])

# ---- 3.3.2 System Design (numbering follows the template) ----
d.h3("3.3.2", "System Design")
d.p("The design realises the requirements as a decoupled, layered system. This section presents the "
    "tools used, hardware and software requirements, the acquisition strategy, the class, sequence and "
    "architecture models, the user-interface design, and finally the entity-relationship model and data "
    "dictionary.")

d.h4("Tools and Materials Used")
d.p("The technology stack was selected for type-safety, modularity and a strong open-source ecosystem.")
d.h4("1. Hardware Requirements")
d.table("hw", "Hardware requirements",
        ["Environment", "Minimum specification"],
        [
            ("Developer / server host", "Quad-core CPU, 8&nbsp;GB RAM (16&nbsp;GB recommended), 20&nbsp;GB free disk."),
            ("Client device", "Any modern device capable of running a current web browser."),
        ], widths=["30%","70%"])
d.h4("2. Software Requirements")
d.table("sw", "Software tools and technologies used",
        ["Layer", "Technology", "Purpose"],
        [
            ("Frontend", "React&nbsp;19, Vite, Tailwind&nbsp;CSS", "Responsive single-page user interface"),
            ("State / data", "Zustand, TanStack React Query", "Global state and server-state caching"),
            ("Backend", "NestJS (Node.js, TypeScript)", "Modular REST API and business logic"),
            ("Database", "PostgreSQL + Prisma ORM", "Relational, tenant-scoped persistence"),
            ("Object storage", "MinIO (S3-compatible)", "Secure document storage with presigned URLs"),
            ("Vector store", "Pinecone", "Embedding index for semantic retrieval (RAG)"),
            ("AI orchestration", "n8n", "Low-code workflows for document ingestion and RAG queries"),
            ("Chat model", "DeepSeek", "Grounded answer generation over retrieved context"),
            ("Embeddings &amp; rerank", "Cohere", "Document/query embeddings and relevance reranking"),
            ("Realtime", "Socket.io", "Live notifications and updates"),
            ("Auth", "JWT (access + refresh)", "Stateless authentication"),
            ("Tooling", "Docker, Git, ESLint", "Environment, version control, quality"),
        ], widths=["18%","30%","52%"])

d.h4("System Acquisition Strategy")
d.p("A <b>build</b> rather than <b>buy</b> strategy was chosen. Commercial suites would impose "
    "recurring per-user fees, foreign data residency and limited extensibility, none of which fit the "
    "academic and local-firm context of this project. Building on open-source components yields full "
    "control over data, security and the AI pipeline, and provides a richer learning outcome.")

d.h4("Class Diagram")
d.p(f"At the domain level the principal classes mirror the persistence model. {d.FIG('class')} presents "
    "the UML class diagram. <i>Tenant</i> composes <i>User</i>, <i>Client</i>, <i>Case</i>, "
    "<i>Document</i>, <i>Event/Deadline</i>, <i>Notification</i>, <i>Invitation</i> and <i>AuditLog</i>, "
    "guaranteeing that every object is owned by exactly one firm. A <i>Case</i> belongs to a "
    "<i>Client</i>, is assigned to a <i>User</i>, and aggregates <i>Document</i> and <i>Event</i> "
    "objects; each class carries the attributes and key operations used by the application.")
d.figure("class", "UML class diagram of the LexManage domain model", svg=D.class_diagram(), width="88%")

d.h4("Sequence Diagrams")
d.p(f"Two interactions illustrate the dynamic behaviour of the system. {d.FIG('seq_auth')} shows the "
    "<b>authentication</b> sequence: the user&rsquo;s credentials are verified against the database, the "
    "API signs a short-lived JWT access token and a refresh cookie, and the SPA stores the token and "
    "redirects to the dashboard.")
d.figure("seq_auth", "Sequence diagram &mdash; user authentication (JWT)", svg=D.sequence_auth())
d.p(f"{d.FIG('seq_rag')} shows the <b>LexAssist AI query</b>, the system&rsquo;s most distinctive "
    "workflow. The request is forwarded by the NestJS API to an n8n workflow whose AI Agent embeds the "
    "question with Cohere, performs a reranked similarity search in Pinecone, and passes the retrieved "
    "context to the DeepSeek chat model, which returns a grounded answer with citations.")
d.figure("seq_rag", "Sequence diagram of the LexAssist Retrieval-Augmented Generation query", svg=D.sequence_rag())

d.h4("System Architecture")
d.p("LexManage follows a classic three-tier architecture, decoupled across a presentation tier (React "
    "SPA), an application tier (NestJS API enforcing authentication, RBAC and tenant isolation) and a "
    "data tier (PostgreSQL, MinIO and the Pinecone vector store). The AI capability is provided by a "
    "separate <b>AI-automation tier built with n8n</b>, which the API calls for ingestion and queries "
    "and which in turn uses the DeepSeek chat model and Cohere embeddings/reranker. Tenant isolation is "
    "enforced at the application tier using <i>AsyncLocalStorage</i> to carry the current tenant&rsquo;s "
    "identity through each request and a Prisma client extension that automatically scopes every query "
    f"to that tenant. {d.FIG('arch')} illustrates the architecture.")
d.figure("arch", "Three-tier system architecture of LexManage (with the n8n AI tier)", svg=D.architecture())

d.h4("User Interface Design")
d.p("The interface follows a clean, professional design language with a persistent navigation sidebar, "
    "a global header (search, notifications and the AI entry point) and a content area that renders the "
    f"active view. Care was taken to provide meaningful empty and error states. {d.FIG('login')} shows "
    f"the secure authentication screen and {d.FIG('onboard')} the firm-onboarding (invitation) flow.")
d.figure("login", "Authentication (login) screen", img="login.png", width="80%")
d.figure("onboard", "Firm onboarding &mdash; invitation-based &lsquo;Join the firm&rsquo; flow", img="onboarding.png", width="80%")

d.h4("Entity-Relationship (ER) Diagram")
d.p(f"The relational data model is centred on the <i>Tenant</i> entity, from which all other records "
    f"descend, guaranteeing isolation by construction. {d.FIG('erd')} presents a simplified ER diagram "
    "of the core entities and their relationships.")
d.figure("erd", "Entity-Relationship diagram of the core data model", svg=D.erd())

d.h4("Data Dictionary")
d.p(f"{d.TAB('dict')} documents the principal entities and their key attributes.")
d.table("dict", "Data dictionary of core entities (selected attributes)",
        ["Entity", "Key attributes", "Notes"],
        [
            ("Tenant", "id (PK), name, slug, plan, barNumber, country", "Root firm/organisation; owns all data."),
            ("User", "id (PK), tenant_id (FK), email, passwordHash, role", "Member of a firm; role drives RBAC."),
            ("Client", "id (PK), tenant_id (FK), name, type_client, email", "CRM entity (physical or legal person)."),
            ("Case", "id (PK), tenant_id (FK), client_id (FK), assignee_id (FK), status, priority", "Legal matter/file."),
            ("Document", "id (PK), tenant_id (FK), case_id (FK), type, status, file_url", "Metadata for a file stored in MinIO."),
            ("Deadline", "id (PK), case_id (FK), dueAt, isDone, priority", "Hearing/time-limit; drives reminders."),
            ("Notification", "id (PK), tenant_id (FK), level, motif, recipient_ids", "Real-time/scheduled alert."),
            ("AuditLog", "id (PK), tenant_id (FK), user_id (FK), action, entity, entityId", "Immutable change record."),
            ("ChatConversation", "id (PK), tenant_id (FK), user_id (FK), messages[]", "LexAssist AI conversation history."),
        ], widths=["18%","52%","30%"])

# =========================================================================
#  CHAPTER IV — IMPLEMENTATION, RESULTS AND TESTING
# =========================================================================
d.chapter("IV", "IMPLEMENTATION, RESULTS AND TESTING")

d.h2("4.1", "Introduction")
d.p("This chapter reports how the design of Chapter&nbsp;III was implemented, presents the resulting "
    "system through its user interface, and describes the testing carried out to validate it.")

d.h2("4.2", "Implementation")
d.p("The system was implemented as two cooperating applications&mdash;a React frontend and a NestJS "
    "backend&mdash;sharing a PostgreSQL database, with MinIO for object storage and a set of n8n "
    "workflows (using DeepSeek, Cohere and Pinecone) providing the AI capability, all orchestrated for "
    "development with Docker Compose.")

d.h3("4.2.1", "Multi-tenant Engine and Security")
d.p("Every authenticated request carries a JWT from which the user&rsquo;s tenant is resolved. The "
    "tenant identifier is placed into an <i>AsyncLocalStorage</i> context that follows the request "
    "through the asynchronous call chain. A Prisma client extension then transparently injects a "
    "<code>tenantId</code> filter into all read and write operations, so that application code cannot "
    "accidentally read or write another firm&rsquo;s data. Authentication issues short-lived access "
    "tokens alongside refresh tokens, passwords are hashed, and all sensitive keys (including the AI "
    "service credentials) are held server-side only. Role-based guards restrict administrative routes to "
    "the <i>CABINET_ADMIN</i> and <i>SUPER_ADMIN</i> roles.")

d.h3("4.2.2", "Dashboard and Case Management")
d.p(f"The modules expose validated REST endpoints consumed by the frontend through TanStack React "
    f"Query, which provides caching, background refresh and optimistic updates. {d.FIG('dash')} shows the "
    "main application shell&mdash;navigation sidebar, global header and the dashboard, which aggregates "
    "key indicators for the firm.")
d.figure("dash", "Main application shell: navigation, global header and dashboard area", img="dashboard.png", width="100%")
d.p(f"Cases are created from the case-management view through a guided dialog. {d.FIG('case_dlg')} shows "
    "the &lsquo;Open New Case&rsquo; form, which captures the subject, client, case reference, "
    "jurisdiction, initial status and strategic notes, and allows supporting documents to be attached at "
    "creation time.")
d.figure("case_dlg", "Creating a case &mdash; the &lsquo;Open New Case&rsquo; dialog", img="dlg-add-case.png", width="92%")

d.h3("4.2.3", "Client Directory (CRM)")
d.p(f"The CRM module manages the firm&rsquo;s clients. {d.FIG('client_dlg')} shows the &lsquo;Add a "
    "client&rsquo; dialog, which distinguishes individual from corporate clients and records the contact "
    "details and an optional link to an existing record.")
d.figure("client_dlg", "Adding a client &mdash; the &lsquo;Add a client&rsquo; dialog", img="dlg-add-client.png", width="92%")

d.h3("4.2.4", "Calendar, Deadlines and Documents")
d.p(f"The calendar module ({d.FIG('cal')}) presents hearings and deadlines in a month grid optimised "
    "for fast lookups, with automated reminders generated by scheduled (cron) jobs ahead of due dates. "
    f"New entries are added through the dialog in {d.FIG('event_dlg')}, which records the title, due "
    "date, priority and the associated case file.")
d.figure("cal", "Calendar and deadline management view", img="calendar.png", width="100%")
d.figure("event_dlg", "Adding an event &mdash; the &lsquo;New deadline&rsquo; dialog", img="dlg-add-event.png", width="92%")
d.p(f"Documents are managed in a structured, role-aware library. {d.FIG('upload_dlg')} shows the upload "
    "panel, where a file is categorised, an access level is chosen (which roles may consult it) and the "
    "file is dropped for secure storage in MinIO (PDF, DOCX or TXT).")
d.figure("upload_dlg", "Uploading a document &mdash; categorisation, access control and drop zone", img="dlg-upload-document.png", width="100%")

d.h3("4.2.5", "Firm Management, RBAC and Notifications")
d.p(f"Administrators manage their firm from a dedicated panel ({d.FIG('firm')}): they can view the "
    "team, issue secure, expiring e-mail invitations, assign roles and edit firm information. New "
    f"members join through the invitation flow shown earlier ({d.FIG('onboard')}).")
d.figure("firm", "Firm management panel (team, invitations and roles)", img="firm-settings.png", width="100%")
d.p(f"Administrators can also broadcast alerts to the team. {d.FIG('notif_dlg')} shows the first step of "
    "the &lsquo;Send Notification&rsquo; wizard, where the urgency level (normal, important or urgent) is "
    "selected; urgent alerts bypass the standard queue and trigger an immediate pop-up for recipients.")
d.figure("notif_dlg", "Sending a notification &mdash; urgency selection step", img="dlg-send-notification.png", width="92%")

d.h3("4.2.6", "LexAssist AI — RAG Workflows with n8n")
d.p("The AI assistant is implemented not inside the backend but as two <b>n8n</b> low-code workflows "
    "that the NestJS API invokes over webhooks. This keeps AI credentials and orchestration logic "
    "outside the client and makes the pipeline easy to inspect and modify. The first workflow ingests "
    "and indexes documents; the second answers questions using Retrieval-Augmented Generation.")
d.p(f"{d.FIG('n8n_ingest_fig')} shows the <b>ingestion workflow</b>. When a document is uploaded, the "
    "workflow extracts its text, splits it into overlapping chunks, embeds them with Cohere and stores "
    f"the vectors in Pinecone. {d.TAB('n8n_ingest')} explains the role of each node.")
d.figure("n8n_ingest_fig", "n8n document-ingestion &amp; indexing workflow", img="n8n-ingest.png", width="100%")
d.table("n8n_ingest", "Role of each node in the n8n ingestion workflow",
        ["Node", "Role in the workflow"],
        [
            ("Ingest Webhook (POST)", "Entry point; receives the upload event (document id, tenant, file reference) from the NestJS backend."),
            ("Extract / Edit fields", "Normalises the payload&mdash;document id, tenant namespace, file URL and MIME type."),
            ("Switch (Format &mdash; Rules)", "Routes the item by file type (PDF / DOCX / TXT) to the correct extractor."),
            ("Extract from File", "Reads the binary file and extracts its raw text content (e.g. Extract&nbsp;from&nbsp;PDF)."),
            ("Recursive Character Text Splitter", "Splits long text into overlapping chunks suitable for embedding."),
            ("Default Data Loader", "Wraps each chunk together with its metadata into a document object."),
            ("Embeddings (Cohere)", "Generates a numerical vector embedding for every chunk."),
            ("Pinecone Vector Store (Insert)", "Upserts the chunk vectors into the firm&rsquo;s Pinecone namespace, completing indexing."),
        ], widths=["30%","70%"])
d.p(f"{d.FIG('n8n_rag_fig')} shows the <b>query workflow</b>. An AI&nbsp;Agent node orchestrates "
    "retrieval and generation: it embeds the question, searches and reranks the relevant chunks in "
    f"Pinecone, and asks the DeepSeek chat model for a grounded answer. {d.TAB('n8n_query')} explains "
    "each node.")
d.figure("n8n_rag_fig", "n8n Retrieval-Augmented Generation (query) workflow", img="n8n-rag.png", width="100%")
d.table("n8n_query", "Role of each node in the n8n RAG query workflow",
        ["Node", "Role in the workflow"],
        [
            ("Webhook (POST)", "Receives the user&rsquo;s question and context from the backend /chat endpoint."),
            ("Verify &amp; Extract userId", "Validates the request and extracts the user/tenant so retrieval is scoped to the firm."),
            ("AI Agent", "Orchestrates the RAG loop&mdash;decides when to call the retrieval tool and composes the final answer."),
            ("DeepSeek Chat Model", "The large language model that generates the grounded natural-language answer."),
            ("Simple Memory", "Maintains short-term conversational context across successive questions."),
            ("Pinecone Vector Store (tool)", "Retrieval tool; performs semantic search over the firm&rsquo;s indexed document vectors."),
            ("Embeddings (Cohere)", "Embeds the question so it can be compared against the stored vectors."),
            ("Reranker (Cohere)", "Re-orders the retrieved chunks by relevance before they reach the model."),
            ("Respond to Webhook", "Returns the generated answer (with citations) to the backend, which relays it to the UI."),
        ], widths=["30%","70%"])
d.p(f"In the application itself, the assistant is reached through the LexAssist panel ({d.FIG('ai')}), "
    "which offers guided prompts and renders answers with their supporting citations.")
d.figure("ai", "LexAssist AI assistant (secure RAG mode) with guided prompts", img="ai-assistant.png", width="100%")

d.h3("4.2.7", "Account Security and Application Settings")
d.p(f"Each user manages their identity and security from the profile view ({d.FIG('profile')}), which "
    "surfaces multi-factor-authentication status and password management. Application-wide preferences "
    "such as language (English/French) and light/dark appearance are configured in settings "
    f"({d.FIG('settings')}), satisfying the usability and localisation requirements.")
d.figure("profile", "User profile and account-security view", img="profile.png", width="100%")
d.figure("settings", "Application settings: language and appearance", img="settings.png", width="100%")

d.h2("4.3", "Testing")
d.p("Testing followed the classic V-model levels&mdash;unit, integration and system&mdash;to validate "
    "correctness from individual functions up to complete user workflows. The platform&rsquo;s "
    "resilient design was also confirmed: when a backend service is unavailable, views display clear, "
    "non-fatal error states with a retry action rather than crashing.")

d.h3("4.3.1", "Unit Testing")
d.p("Individual services and pure functions were exercised in isolation (for example the notifications "
    "service) using the Jest framework, with external dependencies mocked. Unit tests confirmed business "
    "rules such as role checks and tenant scoping behave as specified.")
d.table("ut", "Representative unit test cases",
        ["ID", "Unit under test", "Expected result", "Status"],
        [
            ("UT-1", "Password hashing/verification", "Correct password verifies; wrong password rejected", "Pass"),
            ("UT-2", "Tenant-scoping Prisma extension", "Query is filtered by current tenantId", "Pass"),
            ("UT-3", "RBAC guard for admin route", "Non-admin role is denied access", "Pass"),
            ("UT-4", "Notification urgency classification", "URGENT alerts flagged for pop-up", "Pass"),
        ], widths=["10%","36%","42%","12%"])

d.h3("4.3.2", "Integration Testing")
d.p("Integration tests verified that modules cooperate correctly across boundaries&mdash;controller to "
    "service to database, and API to external services such as MinIO and the n8n AI workflows.")
d.table("it", "Representative integration test cases",
        ["ID", "Interaction", "Expected result", "Status"],
        [
            ("IT-1", "Login &rarr; JWT issue &rarr; protected request", "Valid token grants access; invalid token rejected", "Pass"),
            ("IT-2", "Upload document &rarr; MinIO &rarr; presigned URL", "File stored; time-limited URL returned", "Pass"),
            ("IT-3", "Create case &rarr; audit log + realtime event", "Audit entry written; clients notified live", "Pass"),
            ("IT-4", "AI query &rarr; n8n (Cohere + Pinecone) &rarr; DeepSeek", "Grounded answer with citations returned", "Pass"),
        ], widths=["10%","40%","38%","12%"])

d.h3("4.3.3", "System Testing")
d.p("End-to-end system testing validated complete user journeys against the functional requirements, "
    "and confirmed cross-tenant isolation by attempting (and failing, as designed) to access another "
    "firm&rsquo;s records.")
d.table("st", "Representative system (end-to-end) test cases",
        ["ID", "Scenario", "Expected result", "Status"],
        [
            ("ST-1", "Admin creates firm, invites lawyer, lawyer joins", "Both users operate within the same isolated firm", "Pass"),
            ("ST-2", "Lawyer creates client, case, schedules hearing", "Records persist and reminder is scheduled", "Pass"),
            ("ST-3", "User from firm A requests firm B&rsquo;s case", "Access denied; no data leakage", "Pass"),
            ("ST-4", "Backend offline during navigation", "UI shows graceful error + retry, no crash", "Pass"),
        ], widths=["10%","40%","38%","12%"])

# =========================================================================
#  CHAPTER V — CONCLUSIONS AND RECOMMENDATIONS
# =========================================================================
d.chapter("V", "CONCLUSIONS AND RECOMMENDATIONS")

d.h2("5.1", "Conclusions")
d.p("This project set out to design and implement a secure, multi-tenant SaaS platform to unify and "
    "modernise legal practice management, enhanced with AI document analysis. All of the specific "
    "objectives were met: a working platform was delivered with firm onboarding and invitations, JWT "
    "authentication and RBAC, strict per-tenant data isolation, full client, case, calendar and document "
    "management, real-time notifications, an immutable audit trail, and the LexAssist Retrieval-"
    "Augmented Generation assistant. The system was validated through unit, integration and system "
    "testing and demonstrates that enterprise-grade isolation and document-grounded AI can be combined "
    "in a single, accessible application built entirely on open-source foundations.")

d.h2("5.2", "Recommendations")
d.ul([
    "Adopt a managed PostgreSQL instance and automated backups before any production deployment.",
    "Add comprehensive end-to-end test automation and a CI/CD pipeline to safeguard future changes.",
    "Introduce rate limiting and a web-application firewall to harden the public API surface.",
    "Provide administrator training so firms exploit RBAC, audit logging and the AI assistant fully.",
])

d.h2("5.3", "Perspectives for Further Study")
d.ul([
    "<b>Billing &amp; time-tracking:</b> complete the profitability engine with invoicing and online payments.",
    "<b>Native mobile apps:</b> extend access through dedicated iOS/Android clients.",
    "<b>Court e-filing integration:</b> connect to external judicial systems where APIs exist.",
    "<b>Advanced AI:</b> automatic document classification, clause extraction and deadline detection.",
    "<b>Analytics:</b> richer firm-level dashboards and predictive workload forecasting.",
])

# =========================================================================
#  REFERENCES
# =========================================================================
d.frontheading("REFERENCES")
refs = [
    "NestJS. <i>NestJS Documentation — A progressive Node.js framework.</i> https://docs.nestjs.com",
    "Meta Open Source. <i>React Documentation.</i> https://react.dev",
    "Prisma. <i>Prisma ORM Documentation.</i> https://www.prisma.io/docs",
    "PostgreSQL Global Development Group. <i>PostgreSQL Documentation.</i> https://www.postgresql.org/docs",
    "Pinecone. <i>Pinecone Vector Database Documentation.</i> https://docs.pinecone.io",
    "n8n. <i>n8n &mdash; Workflow Automation Documentation.</i> https://docs.n8n.io",
    "Cohere. <i>Cohere Embed &amp; Rerank Documentation.</i> https://docs.cohere.com",
    "MinIO. <i>MinIO Object Storage Documentation.</i> https://min.io/docs",
    "DeepSeek. <i>DeepSeek API Documentation.</i> https://api-docs.deepseek.com",
    "Lewis, P. et&nbsp;al. (2020). <i>Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.</i> "
    "Advances in Neural Information Processing Systems (NeurIPS).",
    "Socket.IO. <i>Socket.IO Documentation.</i> https://socket.io/docs",
    "Tailwind Labs. <i>Tailwind CSS Documentation.</i> https://tailwindcss.com/docs",
    "Internet Engineering Task Force. <i>RFC 7519: JSON Web Token (JWT).</i> https://datatracker.ietf.org/doc/html/rfc7519",
]
d.raw('<ol class="refs">' + "".join(f'<li>{r}</li>' for r in refs) + '</ol>')
d.end_front()

# =========================================================================
#  APPENDICES
# =========================================================================
d.frontheading("APPENDICES")
d.h4("Appendix A — Selected REST API Endpoints")
d.table("api", "Selected REST API endpoints",
        ["Method &amp; Path", "Description"],
        [
            ("POST /auth/login", "Authenticate a user and issue JWT access/refresh tokens."),
            ("POST /auth/refresh", "Exchange a refresh token for a new access token."),
            ("GET /cases", "List the authenticated firm&rsquo;s cases (tenant-scoped)."),
            ("POST /clients", "Create a new client in the firm&rsquo;s directory."),
            ("POST /documents", "Upload document metadata; returns a presigned URL for the file."),
            ("POST /chat", "Submit a question to LexAssist; returns a grounded answer with citations."),
            ("GET /notifications", "Retrieve the user&rsquo;s notifications."),
        ], widths=["32%","68%"], label="Table A.1")
d.h4("Appendix B — Source Code Repository")
d.p("The complete source code of LexManage is maintained under version control at "
    "<i>https://github.com/Emmanuel-Nyouma</i>. The repository is organised into a React frontend "
    "(<code>src/</code>) and a NestJS backend (<code>lexmanage-backend/</code>) with a Prisma schema "
    "describing the data model presented in Chapter&nbsp;III.")
d.end_front()

# =========================================================================
#  ASSEMBLY
# =========================================================================
def pg(tok):
    return str(PAGES.get(tok, ""))

def tocrow(text_html, page, indent=0, bold=False, gap=True):
    cls = "tocrow" + (" b" if bold else "")
    style = f'margin-left:{indent}px'
    dots = '<span class="dots"></span>' if gap else '<span class="dots"></span>'
    return (f'<div class="{cls}" style="{style}"><span class="t">{text_html}</span>'
            f'{dots}<span class="pg">{page}</span></div>')

# --- List of Figures HTML ---
lof_rows = "".join(
    tocrow(f"{label}: {cap}", pg(tok)) for (label, cap, tok) in d.figs
)
lof_html = (f'<div class="frontsec"><h1 class="fronth">LIST OF FIGURES</h1>{lof_rows}</div>')

# --- Table of Contents HTML ---
toc_parts = []
for level, number, title, tok in d.toc:
    if level == 0 and number.startswith("CHAPTER"):
        label = f'{number}: {html.escape(title)}'
        toc_parts.append(tocrow(label, pg(tok), indent=0, bold=True))
    elif level == 0:
        toc_parts.append(tocrow(html.escape(title), pg(tok), indent=0, bold=True))
    elif level == 1:
        toc_parts.append(tocrow(f'{number} {html.escape(title)}', pg(tok), indent=22))
    else:
        toc_parts.append(tocrow(f'{number} {html.escape(title)}', pg(tok), indent=44))
toc_html = (f'<div class="frontsec"><h1 class="fronth">TABLE OF CONTENTS</h1>'
            + "".join(toc_parts) + '</div>')

# --- Title page ---
title_page = f"""
<div class="title-page">
  <div class="tp-top">
    <div class="tp-uni">{UNIVERSITY}</div>
    <div class="tp-fac">{FACULTY}</div>
    <div class="tp-dep">{DEPARTMENT}</div>
  </div>
  <div class="tp-logo">&#9878;</div>
  <div class="tp-mid">
    <div class="tp-pre">A Project Report submitted in partial fulfilment of the requirements for the award of the</div>
    <div class="tp-deg">{PROGRAMME}</div>
    <div class="tp-titlelabel">Topic</div>
    <div class="tp-title">{html.escape(TITLE)}</div>
  </div>
  <div class="tp-by">
    <div><span class="lbl">Presented by:</span> <b>{STUDENT}</b></div>
    <div><span class="lbl">Supervised by:</span> <b>{SUPERVISOR}</b></div>
  </div>
  <div class="tp-foot">
    <div>Academic Year {ACAD_YEAR}</div>
    <div>{CITY}</div>
  </div>
</div>
"""

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;
       color:#000; text-align: justify; }
p { margin: 0 0 9pt 0; }
.h4 { font-weight: bold; font-size: 12pt; margin: 10pt 0 4pt 0; text-align:left; }
h1 { font-size: 16pt; font-weight: bold; margin: 0 0 12pt 0; text-align:center; }
h2 { font-size: 14pt; font-weight: bold; margin: 14pt 0 6pt 0; text-align:left; }
h3 { font-size: 12pt; font-weight: bold; margin: 10pt 0 5pt 0; text-align:left; }
ul, ol { margin: 0 0 9pt 0; padding-left: 22pt; }
li { margin-bottom: 4pt; }
code { font-family: 'Courier New', monospace; font-size: 10.5pt; }

.chapter { page-break-before: always; padding-top: 8pt; }
.chlabel { text-align:center; font-size:16pt; font-weight:bold; letter-spacing:1px; margin-bottom:6pt; }
.frontsec { page-break-before: always; padding-top: 8pt; }
.fronth { text-align:center; font-size:16pt; font-weight:bold; margin-bottom:16pt; text-transform:uppercase; }

/* Title page */
.title-page { height: 100vh; display:flex; flex-direction:column; justify-content:space-between;
              text-align:center; padding: 18mm 20mm; }
.tp-top { margin-top: 4mm; }
.tp-uni { font-size:18pt; font-weight:bold; letter-spacing:1px; }
.tp-fac { font-size:13pt; font-weight:bold; margin-top:4pt; }
.tp-dep { font-size:12pt; margin-top:2pt; }
.tp-logo { font-size:60pt; color:#b45309; line-height:1; }
.tp-mid { }
.tp-pre { font-size:12pt; margin-bottom:6pt; }
.tp-deg { font-size:14pt; font-weight:bold; margin-bottom:14pt; }
.tp-titlelabel { font-size:12pt; text-transform:uppercase; letter-spacing:2px; color:#444; }
.tp-title { font-size:15pt; font-weight:bold; margin:6pt auto 0; max-width:150mm; line-height:1.4;
            border-top:2px solid #b45309; border-bottom:2px solid #b45309; padding:10pt 0; }
.tp-by { text-align:center; font-size:13pt; }
.tp-by div { margin:5pt 0; }
.tp-by .lbl { color:#444; }
.tp-foot { font-size:12pt; font-weight:bold; }
.tp-foot div { margin-top:2pt; }

/* Figures */
figure { margin: 12pt 0; text-align:center; page-break-inside: avoid; }
figure img, figure svg { display:block; margin:0 auto; max-width:100%; height:auto; }
figure img.shot { border:1px solid #cbd5e1; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.12); }
figcaption { font-size:11pt; font-style:italic; text-align:center; margin-top:5pt; }
.ph { margin:0 auto; border:1.5px dashed #94a3b8; background:#f8fafc; color:#475569;
      padding:26pt 12pt; font-size:11pt; border-radius:6px; }

/* Tables */
table { width:100%; border-collapse: collapse; margin:8pt 0 12pt; font-size:11pt;
        page-break-inside: avoid; }
caption { caption-side: top; text-align:left; font-style:italic; font-size:11pt; margin-bottom:4pt; }
th, td { border:1px solid #555; padding:4pt 6pt; text-align:left; vertical-align:top; }
th { background:#e5e7eb; font-weight:bold; }
table.plain td { border:none; padding:3pt 6pt; }
table.plain { font-size:12pt; }

/* References / appendices */
ol.refs { padding-left:20pt; text-align:left; }
ol.refs li { margin-bottom:7pt; }
.signrow { display:flex; justify-content:space-between; margin-top:40pt; font-size:12pt; }

/* TOC / LOF rows */
.tocrow { display:flex; align-items:flex-end; margin:3pt 0; font-size:12pt; }
.tocrow.b { font-weight:bold; margin-top:6pt; }
.tocrow .t { white-space:normal; }
.tocrow .dots { flex:1 1 auto; border-bottom:1px dotted #777; margin:0 4px 3px; min-width:14px; }
.tocrow .pg { white-space:nowrap; }
"""

body_html = "".join(d.body)
body_html = body_html.replace("__LIST_OF_FIGURES__", lof_html)
body_html = body_html.replace("__TABLE_OF_CONTENTS__", toc_html)

# Resolve symbolic figure/table cross-references (forward refs allowed).
for _k, _label in d.figmap.items():
    body_html = body_html.replace(f"@@FIG:{_k}@@", _label)
for _k, _label in d.tabmap.items():
    body_html = body_html.replace(f"@@TAB:{_k}@@", _label)
import re as _re
_left = sorted(set(_re.findall(r"@@(?:FIG|TAB):[\w-]+@@", body_html)))
if _left:
    print("WARNING: unresolved cross-references:", _left)

full = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>LexManage Project Report</title>
<style>{CSS}</style></head>
<body>{title_page}{body_html}</body></html>"""

with open(os.path.join(HERE, "report.html"), "w", encoding="utf-8") as f:
    f.write(full)

print("report.html written; figures:", len(d.figs), "toc entries:", len(d.toc))
