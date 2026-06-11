# Activity Diagrams — LexManage

## Activity 1 — User Registration & Onboarding

```mermaid
flowchart TD
    Start([🟢 Start]) --> A{New firm or\ninvitation?}

    A -->|"New Firm"| B["Fill Step 1\n(email, password)"]
    B --> C["Fill Step 2\n(firm name, country, city)"]
    C --> D["Submit Registration"]
    D --> E{Backend\nvalidation}
    E -->|"Email exists"| F["❌ Show error\n'Email already in use'"]
    F --> B
    E -->|"Valid"| G["Create Tenant + Admin User\nin PostgreSQL"]
    G --> H["Sign JWT + Refresh Token"]

    A -->|"Invitation link"| I["Open /register?token=..."]
    I --> J["Backend validates token\n(not expired, not used)"]
    J -->|"Invalid / Expired"| K["❌ Show 'Invalid invitation' error"]
    J -->|"Valid"| L["Pre-fill email from token"]
    L --> M["Fill password + name only\n(firm fields hidden)"]
    M --> N["Submit (invite flow)"]
    N --> O["Create User in existing Tenant"]
    O --> H

    H --> P["Set HttpOnly Cookie\n(refresh_token, SameSite=None)"]
    P --> Q["Return accessToken"]
    Q --> R["Frontend stores token\nin Zustand store"]
    R --> S["Fetch /auth/me → currentUser"]
    S --> T(["✅ Dashboard"])
```

---

## Activity 2 — Document Upload & AI Ingestion

```mermaid
flowchart TD
    Start([🟢 Start]) --> A["User opens Document Upload\nor New Case dialog"]
    A --> B["Select category + subcategory\nfrom DMS config"]
    B --> C["Drag & drop or browse file\n(PDF / DOCX, max 50 MB)"]
    C --> D{File size\n≤ 50 MB?}
    D -->|"No"| E["❌ 'File too large' toast"]
    E --> C
    D -->|"Yes"| F["Frontend calls\nPOST /documents/upload\n(multipart form-data)"]
    F --> G["Backend: extract tenantId\nfrom JWT"]
    G --> H["Generate S3 key:\ntenantId/category/uuid_filename"]
    H --> I["Upload binary to\nSupabase S3 via AWS SDK v3"]
    I --> J{S3 upload\nsuccess?}
    J -->|"Error"| K["❌ Return 500, log error"]
    K --> End1([🔴 End])
    J -->|"OK"| L["Save Document metadata\nto PostgreSQL\n(key, category, caseId, uploaderId)"]
    L --> M{N8N_RAG_INGEST_URL\nconfigured?}
    M -->|"No"| N["⚠️ Log warning,\nskip ingestion"]
    M -->|"Yes"| O["POST to n8n ingest webhook\n(fire-and-forget)\n{tenantId, filename, base64, caseId}"]
    O --> P{n8n responds\n2xx?}
    P -->|"Error (non-blocking)"| Q["Log error,\ncontinue"]
    P -->|"OK"| R["Document indexed\nin vector store"]
    N --> S
    Q --> S
    R --> S["Return presigned URL\n(15 min expiry)"]
    S --> T["Frontend: React Query\ninvalidates documents cache"]
    T --> U["List refreshes,\nnew doc appears"]
    U --> End2([✅ End])
```

---

## Activity 3 — Case Lifecycle Management

```mermaid
flowchart TD
    Start([🟢 Start]) --> A["Lawyer opens\n'New Case' dialog"]
    A --> B["Fill case title\n(required)"]
    B --> C{Select client\nfrom CRM?}
    C -->|"Yes"| D["Search & select client\nfrom dropdown"]
    C -->|"No (optional)"| E["Leave client blank\nor type free-text name"]
    D --> F
    E --> F["Set status (OPEN)\n+ priority (MEDIUM)"]
    F --> G["Add description,\ncourt, case number (optional)"]
    G --> H{Attach\ndocuments?}
    H -->|"Yes"| I["Upload files\n(triggers Document Upload flow)"]
    H -->|"No"| J
    I --> J["Submit: POST /cases"]
    J --> K{Zod validation\npasses?}
    K -->|"No"| L["❌ Show inline\nvalidation errors"]
    L --> B
    K -->|"Yes"| M["Case created in DB"]
    M --> N["React Query invalidates\n'cases' cache → list refreshes"]
    N --> O(["⚖️ Case is OPEN"])

    O --> P{Work\non case}
    P --> Q["Assign to Lawyer\n(PATCH /cases/:id)"]
    Q --> R(["🔄 IN_PROGRESS"])
    R --> S["Add Deadlines"]
    S --> T["Upload Documents"]
    T --> U{Outcome?}
    U -->|"Resolved"| V["PATCH status → CLOSED"]
    U -->|"Awaiting court"| W["PATCH status → PENDING"]
    W --> U
    V --> X["closedAt timestamp set"]
    X --> End([✅ Case Closed])
```

---

## Activity 4 — Hybrid Global Search

```mermaid
flowchart TD
    Start([🟢 Start]) --> A["User presses ⌘K\nor clicks search bar"]
    A --> B["SearchPalette opens\n(full-screen on mobile)"]
    B --> C["User types query"]
    C --> D{query.length\n≥ 2?}
    D -->|"No"| E["Show 'type at least\n2 characters' hint"]
    E --> C
    D -->|"Yes"| F["300ms debounce fires"]
    F --> G["GET /search/global?q=query"]
    G --> H["Backend: tokenize query\n→ [full phrase, token1, token2...]"]
    H --> I["Run parallel Prisma queries\nfor ALL tokens × ALL entities"]
    I --> J["Cases: title, clientName,\ncaseNumber, description"]
    I --> K["Documents: title,\nfilename, category"]
    I --> L["Members: firstName,\nlastName, email"]
    I --> M["Clients: name,\nemail, phone, address"]
    J --> N["Deduplicate by id\n(seen Set, max 6 per category)"]
    K --> N
    L --> N
    M --> N
    N --> O["Return {cases, documents,\nmembers, clients}"]
    O --> P["Frontend renders\ngrouped results"]
    P --> Q{User selects\nresult?}
    Q -->|"case"| R["Navigate to /cases/:id"]
    Q -->|"document"| S["Navigate to /documents"]
    Q -->|"member"| T["Navigate to /company-settings"]
    Q -->|"client"| U["Navigate to /clients/:id"]
    R --> End([✅ End])
    S --> End
    T --> End
    U --> End
```
