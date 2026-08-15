# Changelog

All notable changes to LexManage are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-08-15

### Added

- First-run product onboarding and Android/Capacitor packaging.
- Frontend and backend Vitest suites with global coverage reporting and regression thresholds.
- CI checks for lint, tests, coverage, builds, Prisma validation, dependency audits, Docker image builds, and production endpoint safety.
- Architecture and n8n RAG deployment documentation.
- Reproducible Docker Compose stack with readiness checks for the API and its dependencies.

### Changed

- Hardened multi-tenant authorization, authentication lifecycle, API validation, error handling, responsive states, and production configuration.
- Aligned Android Gradle tooling with the supported Android Studio toolchain.
- Split the company settings and notification center views into focused modules.

### Security

- Removed embedded screenshot credentials and documented environment-based test authentication.
- Added production dependency auditing to CI.
- Required environment-provided credentials for seed and screenshot utilities.

[Unreleased]: https://github.com/Emmanuel-Nyouma/Lex_Manage/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Emmanuel-Nyouma/Lex_Manage/compare/d594df1...v0.1.0
