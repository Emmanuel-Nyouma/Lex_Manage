# LexManage - Security Mandates

This file contains foundational mandates for developing LexManage. All code changes must adhere to these standards.

## 1. Database & SQL Injection
- **Standard Operations:** Always use Prisma's standard methods (`findMany`, `findUnique`, `create`, `update`, `delete`).
- **Raw Queries:** Avoid raw SQL where possible. If strictly necessary, use `$queryRaw` or `$executeRaw` with template literals.
- **NEVER** use `$queryRawUnsafe` or `$executeRawUnsafe` with string interpolation from user input.

## 2. Multi-Tenancy & Isolation
- **Tenant Context:** All service methods must respect the `tenantId` from the context or the `PrismaService` extension.
- **Row-Level Security:** Ensure all new models added to `schema.prisma` are also added to `TENANT_BOUND_MODELS` in `prisma.service.ts` to enforce automatic filtering.

## 3. Authentication & Authorization
- **Role-Based Access:** Use `@Roles()` decorator and `RolesGuard` on all state-changing or sensitive endpoints.
- **Active User Check:** For real-time features (WebSockets), always verify that the user is still `isActive` in the database before establishing or maintaining a connection.

## 4. Rate Limiting
- **Global Throttler:** Maintain the tiered throttler (short, medium, long) in `AppModule`.
- **Sensitive Endpoints:** Apply stricter `@Throttle()` limits to authentication and registration endpoints.

## 5. Security Headers & TLS
- **Helmet:** Ensure `helmet()` is used in `main.ts`.
- **HTTPS:** Ensure the production redirect to HTTPS is maintained.
