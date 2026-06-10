# Graph Report - .  (2026-06-09)

## Corpus Check
- 179 files · ~60,613 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 888 nodes · 1510 edges · 61 communities (46 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Audit & Auth Modules|Audit & Auth Modules]]
- [[_COMMUNITY_Backend Controllers Layer|Backend Controllers Layer]]
- [[_COMMUNITY_Backend Package Dependencies|Backend Package Dependencies]]
- [[_COMMUNITY_Frontend Package Dependencies|Frontend Package Dependencies]]
- [[_COMMUNITY_AI Chat & Embedding Service|AI Chat & Embedding Service]]
- [[_COMMUNITY_Auth Controller & JWT Flow|Auth Controller & JWT Flow]]
- [[_COMMUNITY_RAG  n8n Workflow|RAG / n8n Workflow]]
- [[_COMMUNITY_Backend Runtime Dependencies|Backend Runtime Dependencies]]
- [[_COMMUNITY_MinIO Document Storage|MinIO Document Storage]]
- [[_COMMUNITY_Documents Controller & DMS|Documents Controller & DMS]]
- [[_COMMUNITY_Notification Center UI|Notification Center UI]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_Case Drawer & PDF Preview|Case Drawer & PDF Preview]]
- [[_COMMUNITY_AI & Cleanup Services|AI & Cleanup Services]]
- [[_COMMUNITY_Case Management & Company Settings UI|Case Management & Company Settings UI]]
- [[_COMMUNITY_Real-Time Notifications System|Real-Time Notifications System]]
- [[_COMMUNITY_Cases REST API|Cases REST API]]
- [[_COMMUNITY_Clients REST API|Clients REST API]]
- [[_COMMUNITY_Users & Roles API|Users & Roles API]]
- [[_COMMUNITY_Shared UI Components|Shared UI Components]]
- [[_COMMUNITY_App Router & Idle Timeout|App Router & Idle Timeout]]
- [[_COMMUNITY_Notifications REST API|Notifications REST API]]
- [[_COMMUNITY_AI Assistant Chat UI|AI Assistant Chat UI]]
- [[_COMMUNITY_Documents View & DMS Config|Documents View & DMS Config]]
- [[_COMMUNITY_Socket.io Events Gateway|Socket.io Events Gateway]]
- [[_COMMUNITY_Dashboard KPIs View|Dashboard KPIs View]]
- [[_COMMUNITY_Audit Service & Case Storage|Audit Service & Case Storage]]
- [[_COMMUNITY_Case-Documents Link API|Case-Documents Link API]]
- [[_COMMUNITY_AI Dashboard & Audit Logs UI|AI Dashboard & Audit Logs UI]]
- [[_COMMUNITY_Calendar View|Calendar View]]
- [[_COMMUNITY_API Client & Gemini Lib|API Client & Gemini Lib]]
- [[_COMMUNITY_Error Handling & Sidebar|Error Handling & Sidebar]]
- [[_COMMUNITY_Global Error Boundary|Global Error Boundary]]
- [[_COMMUNITY_Auth Screen & Validation|Auth Screen & Validation]]
- [[_COMMUNITY_Clients Directory View|Clients Directory View]]
- [[_COMMUNITY_Notifications Hook & Store|Notifications Hook & Store]]
- [[_COMMUNITY_Header & Search Palette|Header & Search Palette]]
- [[_COMMUNITY_NestJS CLI Config|NestJS CLI Config]]
- [[_COMMUNITY_TypeScript Types|TypeScript Types]]
- [[_COMMUNITY_Profile View|Profile View]]
- [[_COMMUNITY_Stats & Dashboard Service|Stats & Dashboard Service]]
- [[_COMMUNITY_Reminders Queue Processor|Reminders Queue Processor]]
- [[_COMMUNITY_Prisma Check-User Script|Prisma Check-User Script]]
- [[_COMMUNITY_Stats Service (root)|Stats Service (root)]]
- [[_COMMUNITY_Abandoned Doc Cleanup|Abandoned Doc Cleanup]]
- [[_COMMUNITY_Claude Permissions Config|Claude Permissions Config]]
- [[_COMMUNITY_Design System & Accessibility|Design System & Accessibility]]
- [[_COMMUNITY_Case Zod Schemas (Backend)|Case Zod Schemas (Backend)]]
- [[_COMMUNITY_Business Domain Concepts|Business Domain Concepts]]
- [[_COMMUNITY_Prisma Seed Script|Prisma Seed Script]]
- [[_COMMUNITY_Case Zod Schemas (Frontend)|Case Zod Schemas (Frontend)]]
- [[_COMMUNITY_Stats Module (modules)|Stats Module (modules)]]
- [[_COMMUNITY_Stats Module (root)|Stats Module (root)]]

## God Nodes (most connected - your core abstractions)
1. `PrismaService` - 47 edges
2. `NotificationsService` - 23 edges
3. `JwtAuthGuard` - 19 edges
4. `compilerOptions` - 19 edges
5. `useLexStore` - 19 edges
6. `CurrentUser` - 17 edges
7. `AuditService` - 17 edges
8. `DocumentsService` - 17 edges
9. `AuthService` - 15 edges
10. `MinioService` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TenantStore` --implements--> `Multi-Tenant SaaS Architecture`  [EXTRACTED]
  lexmanage-backend/src/common/context/tenant.context.ts → LEXMANAGE_DOC.md
- `JwtAuthGuard` --implements--> `JWT Authentication`  [EXTRACTED]
  lexmanage-backend/src/common/guards/jwt-auth.guard.ts → LEXMANAGE_DOC.md
- `AI RAG Pipeline` --references--> `N8nRagModule`  [INFERRED]
  LEXMANAGE_DOC.md → lexmanage-backend/src/modules/ai/n8n-rag.module.ts
- `DocumentsService` --implements--> `Document Management System (DMS)`  [EXTRACTED]
  lexmanage-backend/src/modules/documents/documents.service.ts → LEXMANAGE_DOC.md
- `AppModule` --implements--> `Tiered Rate Limiting`  [EXTRACTED]
  lexmanage-backend/src/app.module.ts → GEMINI.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication & Authorization Flow** — guards_jwt_auth_guard_jwtauthguard, auth_auth_service_authservice, decorators_roles_decorator_roles, guards_roles_guard_rolesguard, lexmanage_doc_jwt_auth [INFERRED 0.85]
- **Multi-Tenant Isolation Mechanism** — context_tenant_context_tenantcontext, context_tenant_context_tenantstore, middleware_tenant_middleware_tenantmiddleware, gemini_tenant_bound_models, lexmanage_doc_multitenant_saas [INFERRED 0.85]
- **Document Storage & AI RAG Pipeline** — documents_documents_service_documentsservice, documents_minio_service_minioservice, ai_n8n_rag_service_n8nragservice, lexmanage_doc_dms, lexmanage_doc_ai_rag [INFERRED 0.85]

## Communities (61 total, 15 thin omitted)

### Community 0 - "Audit & Auth Modules"
Cohesion: 0.06
Nodes (24): AuditController, AuditModule, AuthModule, CalendarController, CalendarModule, CasesModule, DeadlinesController, ClientsModule (+16 more)

### Community 1 - "Backend Controllers Layer"
Cohesion: 0.08
Nodes (23): SendMessageDto, CurrentUser, Roles(), CreateNotificationDto, JwtAuthGuard, RolesGuard, CreateNotificationSchema, MOTIF_LEVEL_CONSTRAINTS (+15 more)

### Community 2 - "Backend Package Dependencies"
Cohesion: 0.04
Nodes (48): author, description, devDependencies, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma (+40 more)

### Community 3 - "Frontend Package Dependencies"
Cohesion: 0.04
Nodes (44): dependencies, axios, dompurify, @hookform/resolvers, lucide-react, @radix-ui/react-tooltip, react, react-dom (+36 more)

### Community 4 - "AI Chat & Embedding Service"
Cohesion: 0.06
Nodes (13): AiController, AiModule, AiService, N8nRagModule, N8nChatParams, N8nIngestParams, N8nRagService, ChatController (+5 more)

### Community 5 - "Auth Controller & JWT Flow"
Cohesion: 0.08
Nodes (13): AuthController, AuthService, TenantContext, TenantStore, LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto (+5 more)

### Community 6 - "RAG / n8n Workflow"
Cohesion: 0.05
Nodes (37): active, main, connections, AI Agent, Default Data Loader, Embeddings HuggingFace Inference, Embeddings HuggingFace Inference1, On form submission (+29 more)

### Community 7 - "Backend Runtime Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, bcryptjs, bullmq, cache-manager, class-transformer, class-validator, cookie-parser, file-type (+27 more)

### Community 8 - "MinIO Document Storage"
Cohesion: 0.08
Nodes (5): MinioService, Document Management System (DMS), TenantsController, TenantsService, UpdateTenantDto

### Community 9 - "Documents Controller & DMS"
Cohesion: 0.13
Nodes (6): DocumentsController, DocumentsService, CreateDocumentDto, DocumentStatus, DocumentType, UpdateDocumentDto

### Community 10 - "Notification Center UI"
Cohesion: 0.09
Nodes (15): countdown(), fmtDate(), LEVEL_CONFIG, motifLabel(), NotificationCenterView(), ScheduledRow(), ScheduleForm(), STATUS_CONFIG (+7 more)

### Community 11 - "TypeScript Compiler Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+14 more)

### Community 12 - "Case Drawer & PDF Preview"
Cohesion: 0.19
Nodes (11): CaseDrawer(), NewCaseDialog(), PdfPreviewModal(), useCreateCase(), useCreateDeadline(), useDeadlines(), useMarkDeadlineDone(), useKeyboardNavigation() (+3 more)

### Community 13 - "AI & Cleanup Services"
Cohesion: 0.15
Nodes (4): EmbeddingChunk, PrismaService, TENANT_BOUND_MODELS, SearchService

### Community 14 - "Case Management & Company Settings UI"
Cohesion: 0.17
Nodes (12): CaseManagementView(), CompanySettingsView(), FirmField(), ROLE_LABELS, ROLE_VARIANT, NewEventDialog(), LEVEL_NUM_MAP, SendNotificationDialog() (+4 more)

### Community 15 - "Real-Time Notifications System"
Cohesion: 0.12
Nodes (6): Active-User WebSocket Check, Automated Hearing Reminders, Real-Time Notifications, Urgency Alert System, NotificationsService, RemindersService

### Community 16 - "Cases REST API"
Cohesion: 0.13
Nodes (6): CasesController, CasesService, CasePriority, CaseStatus, CreateCaseDto, UpdateCaseDto

### Community 17 - "Clients REST API"
Cohesion: 0.14
Nodes (5): ClientsController, ClientsService, ClientType, CreateClientDto, UpdateClientDto

### Community 18 - "Users & Roles API"
Cohesion: 0.15
Nodes (5): CreateUserDto, UpdateUserDto, UserRole, UsersController, UsersService

### Community 19 - "Shared UI Components"
Cohesion: 0.12
Nodes (6): Breadcrumbs(), HIDDEN_ROUTES, routeNames, Checkbox, spacingScale, Textarea

### Community 20 - "App Router & Idle Timeout"
Cohesion: 0.13
Nodes (11): useIdleTimeout(), AiAssistantView, CalendarView, CaseManagementView, CompanySettingsView, DashboardView, DocumentsView, MainLayout() (+3 more)

### Community 21 - "Notifications REST API"
Cohesion: 0.13
Nodes (3): NotificationsController, CreateScheduledDto, CreateTemplateDto

### Community 22 - "AI Assistant Chat UI"
Cohesion: 0.20
Nodes (9): AiAssistantView(), greeting(), ICON, MessageBubble(), SIZES, SUGGESTED_PROMPTS, useTypewriter(), chatApi (+1 more)

### Community 23 - "Documents View & DMS Config"
Cohesion: 0.24
Nodes (8): DocumentsView(), DocumentUpload(), ACCESS_ROLES, DMS_CATEGORIES, useDeleteDocument(), useDocuments(), getDocumentSignedUrl(), Skeleton()

### Community 25 - "Dashboard KPIs View"
Cohesion: 0.20
Nodes (6): COLOR, DashboardView(), greeting(), MOCK, SEVERITY, tooltipStyle

### Community 27 - "Case-Documents Link API"
Cohesion: 0.22
Nodes (3): CaseDocumentsController, CaseDocumentsModule, CaseDocumentsService

### Community 28 - "AI Dashboard & Audit Logs UI"
Cohesion: 0.22
Nodes (4): AiDashboardView(), useAiDashboard(), Badge(), badgeSemantics

### Community 29 - "Calendar View"
Cohesion: 0.24
Nodes (6): CalendarView(), DAYS, DAYS_FULL, MONTHS, useGlobalDeadlines(), useDeleteDeadline()

### Community 31 - "Error Handling & Sidebar"
Cohesion: 0.25
Nodes (4): ErrorHandler(), SettingsView(), Sidebar(), translations

### Community 33 - "Auth Screen & Validation"
Cohesion: 0.29
Nodes (4): forgotPasswordSchema, loginSchema, mfaSchema, signupSchema

### Community 34 - "Clients Directory View"
Cohesion: 0.48
Nodes (3): ClientsDirectoryView(), useClients(), QUERY_KEYS

### Community 35 - "Notifications Hook & Store"
Cohesion: 0.52
Nodes (6): Header(), useNotifications(), useNotificationStore, useSocket(), LexManageApp(), useLexStore

### Community 36 - "Header & Search Palette"
Cohesion: 0.40
Nodes (3): LEVEL_UI, MOTIF_LABELS, SearchPalette()

### Community 37 - "NestJS CLI Config"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 38 - "TypeScript Types"
Cohesion: 0.33
Nodes (5): Case, CreateCaseDto, Document, PaginatedResponse, User

### Community 39 - "Profile View"
Cohesion: 0.60
Nodes (3): profileSchema, ProfileView(), useUpdateProfile()

### Community 46 - "Design System & Accessibility"
Cohesion: 0.67
Nodes (3): Accessibility Standards, Design System Component Library, WCAG Contrast Compliance

### Community 48 - "Business Domain Concepts"
Cohesion: 0.67
Nodes (3): Case & Hearing Management, CRM (Client Management), Profitability Engine

## Knowledge Gaps
- **240 isolated node(s):** `allow`, `name`, `nodes`, `pinData`, `main` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PrismaService` connect `AI & Cleanup Services` to `Audit & Auth Modules`, `Backend Controllers Layer`, `AI Chat & Embedding Service`, `Auth Controller & JWT Flow`, `Stats & Dashboard Service`, `Documents Controller & DMS`, `Reminders Queue Processor`, `Stats Service (root)`, `Abandoned Doc Cleanup`, `MinIO Document Storage`, `Real-Time Notifications System`, `Clients REST API`, `Users & Roles API`, `Socket.io Events Gateway`, `Audit Service & Case Storage`, `Case-Documents Link API`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `NotificationsService` connect `Real-Time Notifications System` to `Audit & Auth Modules`, `Backend Controllers Layer`, `Reminders Queue Processor`, `Notifications REST API`, `Socket.io Events Gateway`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `JwtAuthGuard` connect `Backend Controllers Layer` to `Documents Controller & DMS`, `Auth Controller & JWT Flow`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `allow`, `name`, `nodes` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Audit & Auth Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.055191256830601096 - nodes in this community are weakly interconnected._
- **Should `Backend Controllers Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08166969147005444 - nodes in this community are weakly interconnected._
- **Should `Backend Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._