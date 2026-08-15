# Contributing to LexManage

Thank you for improving LexManage. Keep each change focused, reviewable, and supported by evidence.

## Development setup

Use Node.js 20 and install from the committed lockfiles:

```bash
npm ci
cd lexmanage-backend
npm ci
```

Copy the provided `.env.example` files and supply your own local credentials. Never commit `.env` files, access tokens, passwords, production exports, or customer data.

## Change workflow

1. Create a branch with a descriptive name.
2. Keep one feature, fix, or refactor per commit whenever practical.
3. Add or update tests that fail before the change and pass afterward.
4. Do not mix formatting-only rewrites with behavior changes.
5. Update documentation and `CHANGELOG.md` when behavior, configuration, or API contracts change.

Use Conventional Commit subjects such as `fix(auth): reject revoked refresh tokens` or `test(clients): cover create and delete flows`.

## Required checks

From the repository root:

```bash
npm run lint
npm run test:coverage
npm run build
npm audit --omit=dev --audit-level=high
```

From `lexmanage-backend`:

```bash
npm run lint
npm run test:coverage
npx prisma validate
npx tsc --noEmit
npm run build
npm audit --omit=dev --audit-level=high
```

All checks must pass before a pull request is merged.

## Pull requests

Describe the user-visible problem, the root cause, the chosen solution, test evidence, deployment or migration impact, and rollback considerations. Include screenshots for UI changes and never include real client data.

## Security

Do not open a public issue for a suspected vulnerability or leaked credential. Revoke exposed credentials immediately and contact the repository owner privately with reproduction details and affected versions.
