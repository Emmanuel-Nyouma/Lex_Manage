# Entity-Relationship Diagram — LexManage

```mermaid
erDiagram
    %% ── Core Entities ─────────────────────────────────────────────

    TENANT {
        uuid id PK
        string name
        string slug UK
        string plan
        string country
        string city
        string address
        string phone
        string fax
        string website
        string siret
        string barNumber
        string logoUrl
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    USER {
        uuid id PK
        uuid tenantId FK
        string email UK
        string passwordHash
        string firstName
        string lastName
        string avatarUrl
        string phone
        enum role
        boolean isActive
        string refreshToken
        datetime refreshTokenExpiresAt
        datetime createdAt
        datetime updatedAt
    }

    CLIENT {
        uuid id PK
        uuid tenantId FK
        string name
        string email
        string phone
        string address
        string type_client
        datetime createdAt
        datetime updatedAt
    }

    CASE {
        uuid id PK
        uuid tenantId FK
        string title
        string description
        string clientName
        string courtName
        string caseNumber
        enum status
        string priority
        uuid clientId FK
        uuid assigneeId FK
        datetime closedAt
        datetime createdAt
        datetime updatedAt
    }

    %% ── Document Repository ──────────────────────────────────────

    DOCUMENT {
        cuid id PK
        uuid tenantId FK
        string title
        string file_name
        string file_url
        string file_type
        int file_size
        string category
        string subCategory
        array allowedRoles
        enum type
        enum status
        uuid uploaderId FK
        uuid case_id FK
        boolean isPending
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    %% ── Notifications ─────────────────────────────────────────────

    NOTIFICATION {
        cuid id PK
        uuid tenantId FK
        enum level
        enum motif
        string title
        string message
        uuid createdById FK
        array recipientIds
        array readByIds
        uuid caseId FK
        datetime createdAt
    }

    NOTIFICATION_TEMPLATE {
        cuid id PK
        uuid tenantId FK
        string name
        enum level
        enum motif
        string title
        string message
        array recipientRoles
        uuid createdById FK
        datetime createdAt
    }

    SCHEDULED_NOTIFICATION {
        cuid id PK
        uuid tenantId FK
        enum level
        enum motif
        string title
        string message
        array recipientRoles
        datetime scheduledAt
        string status
        string jobId
        uuid caseId FK
        uuid createdById FK
        datetime createdAt
    }

    %% ── Supporting Entities ──────────────────────────────────────

    DEADLINE {
        uuid id PK
        uuid tenantId FK
        uuid caseId FK
        string title
        datetime dueAt
        string priority
        boolean isDone
        datetime createdAt
        datetime updatedAt
    }

    INVITATION {
        uuid id PK
        uuid tenantId FK
        string email
        enum role
        string token UK
        datetime expiresAt
        boolean used
        datetime createdAt
    }

    AUDIT_LOG {
        uuid id PK
        uuid tenantId FK
        uuid userId FK
        string action
        string entity
        string entityId
        json details
        string ipAddress
        datetime createdAt
    }

    CHAT_CONVERSATION {
        uuid id PK
        uuid tenantId FK
        uuid userId FK
        string title
        datetime createdAt
        datetime updatedAt
    }

    CHAT_MESSAGE {
        uuid id PK
        uuid conversationId FK
        string role
        string content
        json sources
        datetime createdAt
    }

    %% ── Relationships ─────────────────────────────────────────────

    TENANT ||--o{ USER : "has"
    TENANT ||--o{ CLIENT : "manages"
    TENANT ||--o{ CASE : "owns"
    TENANT ||--o{ DOCUMENT : "stores"
    TENANT ||--o{ NOTIFICATION : "sends"
    TENANT ||--o{ NOTIFICATION_TEMPLATE : "defines"
    TENANT ||--o{ SCHEDULED_NOTIFICATION : "schedules"
    TENANT ||--o{ DEADLINE : "tracks"
    TENANT ||--o{ INVITATION : "issues"
    TENANT ||--o{ AUDIT_LOG : "logs"
    TENANT ||--o{ CHAT_CONVERSATION : "hosts"

    USER ||--o{ CASE : "assigned to"
    USER ||--o{ DOCUMENT : "uploads"
    USER ||--o{ NOTIFICATION : "creates"
    USER ||--o{ NOTIFICATION_TEMPLATE : "authors"
    USER ||--o{ SCHEDULED_NOTIFICATION : "creates"
    USER ||--o{ AUDIT_LOG : "generates"
    USER ||--o{ CHAT_CONVERSATION : "owns"

    CLIENT ||--o{ CASE : "linked to"

    CASE ||--o{ DOCUMENT : "contains"
    CASE ||--o{ DEADLINE : "has"
    CASE ||--o{ NOTIFICATION : "referenced by"
    CASE ||--o{ SCHEDULED_NOTIFICATION : "referenced by"

    CHAT_CONVERSATION ||--o{ CHAT_MESSAGE : "contains"
```

---

## Enum Reference

| Enum | Values |
|------|--------|
| **Role** | `SUPER_ADMIN`, `CABINET_ADMIN`, `LAWYER`, `ASSISTANT`, `SECRETARY` |
| **CaseStatus** | `OPEN`, `IN_PROGRESS`, `PENDING`, `CLOSED`, `ARCHIVED` |
| **NotificationLevel** | `NORMAL`, `IMPORTANT`, `URGENT` |
| **NotificationMotif** | `HEARING`, `INTERNAL_MEETING`, `DEADLINE`, `DOCUMENT_TO_SIGN`, `NEW_CLIENT`, `INVOICE_PENDING`, `LEGAL_UPDATE`, `INTERNAL_REMINDER`, `CONFLICT_DETECTED`, `OTHER` |
| **DocumentStatus** | `UPLOADED`, `OCR_PENDING`, `OCR_DONE`, `INDEXED`, `ERROR` |
| **DocumentType** | `SUMMONS`, `SUBPOENA`, `LEGAL_BRIEF`, `MEMORANDUM`, `MOTION`, `COURT_ORDER`, `JUDGMENT`, `HEARING_TRANSCRIPT`, `INVOICE`, `EXHIBIT`, `NDA`, `CONTRACT`, `OTHER` (+ 40 more) |
