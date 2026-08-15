# LexManage — DataFactor-style self-audit

Date: 2026-08-15

This is an evidence-based internal assessment. It is not a DataFactor reassessment and does not claim that the external score has changed.

## 1. Before versus after

| Area | DataFactor baseline supplied by the owner | Current verified state |
| --- | --- | --- |
| Overall score | 42/D | Not reassessed; no new score claimed |
| Runnable tests | No frontend suite detected; seven repository specs reported | 14 test files; 44 passing tests (15 frontend, 29 backend) |
| Coverage | No frontend coverage gate | Frontend 13.42% lines; backend 14.95% lines; both enforced in CI |
| CI | Build/typecheck only | Lint, tests, coverage, builds, npm audit, Prisma validation and Docker validation |
| Large React views | `CompanySettingsView` 1,039 lines; `NotificationCenterView` 689 lines | 485 and 86 lines respectively, split into focused components |
| Hardcoded credentials | Two utility-script hits | Removed from capture/report utilities and seed data; environment variables required |
| Dependency audit | Not enforced | Frontend and backend `npm audit` return zero vulnerabilities |
| Isolated startup | Compose/devcontainer present but not executed by the assessment | Full Compose stack built and all five services reached `healthy` |

## 2. Test files added

- `src/components/ClientsDirectoryView.test.jsx`
- `src/components/CompanySettingsView.test.jsx`
- `src/components/NotificationCenterView.test.jsx`
- `src/lib/router.test.jsx`
- `src/utils/dateOnly.test.js`
- `lexmanage-backend/src/modules/auth/auth.service.spec.ts`
- `lexmanage-backend/src/modules/clients/clients.service.spec.ts`
- `lexmanage-backend/src/modules/documents/documents.service.spec.ts`
- `lexmanage-backend/src/modules/documents/minio.service.spec.ts`

The tests cover client mutations and errors, settings/notification access and empty states, router behavior, date-only handling, authentication, tenant-scoped client/document operations, document rollback, and fresh-storage readiness.

## 3. Test count

- Frontend: 5 files, 15 tests, all passing.
- Backend: 9 files, 29 tests, all passing.
- Combined: 14 files, 44 tests, all passing.

## 4. Approximate coverage

- Frontend: 12.80% statements, 11.34% branches, 8.67% functions, 13.42% lines.
- Backend: 14.55% statements, 12.27% branches, 12.94% functions, 14.95% lines.
- Enforced minimums: frontend 12/11/8/13 and backend 14/12/12/14 for statements/branches/functions/lines.

Coverage is materially better and now regression-gated, but still low for a production SaaS. The next target should prioritize authentication controllers, tenant administration, documents, notifications, API error normalization and the principal user workflows instead of raising thresholds without meaningful tests.

## 5. CI improvements

The GitHub Actions workflow now runs frontend and backend linting, tests with coverage, production builds, backend typecheck, Prisma validation, npm security audits and Docker Compose/build validation. Dependabot is configured for npm and GitHub Actions updates.

## 6. Lint improvements

Frontend and backend have explicit ESLint configurations and scripts. Both lint commands pass from clean lockfile installations and are required by CI.

## 7. Large files reduced or split

- `CompanySettingsView.jsx`: reduced from roughly 1,100 working-tree lines to 485, with firm, team, invitations and invite panels extracted.
- `NotificationCenterView.jsx`: reduced from roughly 700 working-tree lines to 86, with history/templates and scheduled-notification panels extracted.

Remaining source files above 500 lines include `ClientsDirectoryView.jsx` (587) and `CalendarView.jsx` (538). Reporting/presentation generators are also large (`generate_report.py`, `report/gen.py`, `generate_diagrams.py`, `presentation/defense_pdf.py`); they are tooling rather than runtime modules, but remain maintenance debt. They were not split merely to improve a metric.

## 8. Security issues fixed

- Removed hardcoded test credentials from capture/report scripts.
- Seed users and passwords now come from required environment variables.
- Removed the generated JavaScript seed duplicate.
- Added tenant scoping and cross-tenant ownership checks across authentication, clients, cases, documents, chat, search, notifications and users.
- Added webhook authentication for n8n RAG operations.
- Added validation, rate limiting, safer error responses and short-lived signed document URLs.
- Compose no longer falls back to default MinIO credentials.
- No real `.env` file is tracked; only `.env.example` files are committed.
- Known-secret scan returned no active source hit; npm audits returned zero vulnerabilities.

## 9. Logging improvements

Backend services use Nest `Logger`, request IDs are emitted by the global exception filter, and dependency failures have explicit readiness states. This is structured enough for container logs but not yet centralized or correlated across frontend/backend workers.

## 10. Error tracking status

Global frontend error boundaries and normalized backend API errors are present. External error tracking (for example Sentry) is not configured. Production exception aggregation, release correlation and alerting remain open work.

## 11. Dependabot status

`.github/dependabot.yml` is present for weekly npm updates in both workspaces and GitHub Actions. Pull requests still require human review and green CI.

## 12. Documentation added

- Contribution and focused-commit guidance.
- Changelog and release notes.
- Docker isolated-development instructions and environment reference.
- Tenant identity architecture notes.
- n8n RAG deployment/security notes.

## 13. Release and versioning status

Frontend, backend and Android metadata are aligned to `0.1.0`; Android uses `versionCode 1`. Release notes exist at `docs/releases/v0.1.0.md`. Publication/tagging is intentionally deferred until the focused commits are reviewed and merged into `main`.

## 14. Docker and self-contained status

Compose configuration validates. Frontend and backend images build on Node 22. BuildKit npm caching and bounded retries reduce registry instability. A fresh isolated stack successfully applied Prisma migrations, created the shared MinIO bucket, connected to Redis/Postgres/MinIO, proxied frontend API traffic and reached `healthy` for frontend, backend, Postgres, Redis and MinIO. Temporary containers were stopped without deleting volumes.

## 15. Git history observations

The repository has genuine single-author history (104 commits over the period reported by DataFactor). Existing commits were not rewritten, authors were not fabricated, and no activity was manufactured. The current engineering work should be committed as a small number of coherent conventional commits containing the corresponding tests.

## 16. Remaining weaknesses

- Overall line coverage remains below 15% in both workspaces.
- Several critical controllers/services and end-to-end flows have no automated coverage.
- Frontend error tracking and centralized production telemetry are absent.
- Two runtime React views remain above 500 lines.
- The optional presentation generator requires `pptxgenjs`, whose current transitive `image-size` dependency has unresolved high-severity advisories; it is intentionally not installed in the application workspace.
- The Vite package remains an npm alias to `rolldown-vite`; migration back to an official stable Vite release should be evaluated.
- No tagged releases existed before this release preparation.
- Project history is still single-author and task capacity can improve only through future genuine feature/fix work with tests.

## 17. Recommended next improvements

1. Add controller/integration tests for auth refresh/logout, tenant invitations/roles, document upload/download and notification scheduling.
2. Add Playwright smoke tests for onboarding, login, client/case/document CRUD and mobile navigation.
3. Raise coverage gates incrementally with each tested feature, targeting 30%, then 50%, rather than changing percentages alone.
4. Add Sentry or equivalent release-aware frontend/backend error tracking and alerting.
5. Split `ClientsDirectoryView` and `CalendarView` along form/list/detail boundaries.
6. Add signed release artifacts and a documented Play Store AAB pipeline after the `v0.1.0` source release.
7. Reassess with DataFactor only after the release is public; do not infer an external score from this report.

## Buyer-fit signals

| Signal | Current assessment | Evidence |
| --- | --- | --- |
| BUILD + TESTS AT HEAD | Pass locally/isolated | 44 tests pass; lint, coverage, frontend/backend builds, TypeScript, Prisma and APK build pass |
| TASK CAPACITY | Improving, still weak historically | Legitimate focused changes now include tests; historical single-author/test-light commits remain unchanged |
| GENUINE HISTORY | Pass | Existing 104-commit history preserved; no rewritten/fabricated activity |
| SELF-CONTAINED | Pass | Fresh Compose stack built, migrated and reached five healthy services |
| NOT A DEMO | Pass | Multi-tenant legal SaaS with auth, cases, clients, documents, notifications, audit, chat and AI integration |
