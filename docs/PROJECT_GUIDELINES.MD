# Project Guidelines

This document is the starting point for anyone new to the Chat Backend codebase. It explains **how we build things here** — the conventions, patterns, and rules that keep the codebase consistent as the team grows. Read it before writing your first line of code, before adding a new feature, or before submitting a PR.

---

## Table of Contents

- [Project Guidelines](#project-guidelines)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack Quick Reference](#tech-stack-quick-reference)
  - [Architecture Overview](#architecture-overview)
    - [Three API Namespaces](#three-api-namespaces)
    - [Directory Layout](#directory-layout)
    - [Request Lifecycle](#request-lifecycle)
    - [Layered Module Pattern](#layered-module-pattern)
  - [Module Structure \& File Conventions](#module-structure--file-conventions)
    - [File Naming Reference](#file-naming-reference)
  - [Coding Conventions](#coding-conventions)
    - [Naming](#naming)
    - [Imports — Use Path Aliases](#imports--use-path-aliases)
    - [Layer Rules (enforce these in PR review)](#layer-rules-enforce-these-in-pr-review)
    - [Zod Schemas as Source of Truth](#zod-schemas-as-source-of-truth)
    - [Commenting Rules](#commenting-rules)
  - [Authentication \& Authorization](#authentication--authorization)
    - [JWT Token Structure](#jwt-token-structure)
    - [Middleware Order](#middleware-order)
    - [`requirePermission` vs `requireRole`](#requirepermission-vs-requirerole)
  - [Request Validation](#request-validation)
  - [Response Contracts](#response-contracts)
  - [Error Handling](#error-handling)
  - [Database \& Migrations](#database--migrations)
  - [Environment Variables](#environment-variables)
  - [Logging](#logging)
    - [Commit Messages](#commit-messages)
  - [Related](#related)

---

## Tech Stack Quick Reference

| Category       | Technology                   | Notes                                              |
| -------------- | ---------------------------- | -------------------------------------------------- |
| Runtime        | Node.js 22                   | ES module support required                         |
| Framework      | Express 5                    | HTTP server & routing                              |
| Language       | TypeScript (strict)          | All code is TypeScript — no plain `.js` source     |
| ORM            | Prisma 7                     | Type-safe database client; all DB access goes here |
| Database       | MySQL 8+                     | Primary data store                                 |
| Cache          | Redis (ioredis)              | Permissions, rate limiting, session flags          |
| Validation     | Zod 4                        | Schemas are the source of truth for types too      |
| Auth           | Passport (local + JWT)       | `passport-local` login, `passport-jwt` Bearer auth |
| Testing        | Vitest                       | Unit and integration tests                         |
| Logging        | Pino                         | Structured JSON logs — never `console.log`         |
| Error tracking | Sentry                       | Production error monitoring                        |
| Push notifs    | Firebase Admin SDK           | Mobile push notifications                          |
| File storage   | Google Cloud Storage / local | Configured via `DOCUMENT_STORAGE_DRIVER`           |

**Package manager: `pnpm`** — do not use npm or yarn.

| Script                    | What it does                                                                |
| ------------------------- | --------------------------------------------------------------------------- |
| `pnpm run dev`            | Start dev server with hot reload                                            |
| `pnpm run build`          | Type-check and compile to `dist/`                                           |
| `pnpm test`               | Run unit tests                                                              |
| `pnpm test:coverage`      | Run unit tests with coverage report                                         |
| `pnpm test:integration`   | Run integration tests (requires running DB, or `TESTCONTAINERS=1` + Docker) |
| `pnpm prisma migrate dev` | Apply a new migration to the local DB                                       |
| `pnpm prisma db seed`     | Seed the local database                                                     |

> **Tip:** To generate or extend seed data, use the `/seed-los-data` skill in Claude Code. It creates realistic entries in `prisma/seed.ts` following project conventions.

---

## Architecture Overview

LOS Backend v2 follows a **monolithic-modular** architecture: one deployable process, but with internally isolated feature modules. This means you get the simplicity of a monolith (no inter-service networking) while keeping modules easy to reason about and test independently.

### Three API Namespaces

Every route belongs to exactly one namespace:

| Namespace  | Path prefix         | Consumers            | Auth                 |
| ---------- | ------------------- | -------------------- | -------------------- |
| `customer` | `/customer/api/v1/` | customer using mobile app flutter     | to be confirm                 |
| `agent`    | `/agent/api/v1/`    | Internal staff       | to be confirm   |

All routes are registered in `src/routes/v1.ts`. New modules get mounted there under the right namespace prefix.

### Directory Layout

```
src/
├── config/        # Infrastructure singletons (DB, Redis, logger, env validation)
├── modules/       # modules — all business logic lives here
├── shared/        # Cross-cutting concerns (middleware, error classes, utilities)
├── routes/        # Top-level router (v1.ts) that mounts all modules
└── app.ts         # Express app setup (middleware chain)
```

### Request Lifecycle

Every authenticated request flows through this chain:

```
HTTP Request
  → helmet / cors
  → Pino HTTP logger + AsyncLocalStorage context
  → body parser
  → validate             (Zod schema check on body/query/params)
  → controller           (extract inputs, call service, return JSON)
  → errorHandler         (catch any thrown AppError, serialize to JSON)
```

### Layered Module Pattern

Every module enforces a strict separation of concerns:

```
Routes → Controller → Service → Repository → Prisma (DB)
```

| Layer          | Responsibility                                    | Rule                               |
| -------------- | ------------------------------------------------- | ---------------------------------- |
| **Routes**     | Wire middleware + controller handler              | No business logic                  |
| **Controller** | Extract `req` inputs, call service, send response | No Prisma, no business decisions   |
| **Service**    | Business logic, validation, orchestration         | No `req`/`res` references          |
| **Repository** | Prisma queries only                               | No business logic, no error throws |

---

## Module Structure & File Conventions

Each feature module lives under `src/modules/<module-name>/`. When a module has separate admin and customer surfaces, use namespace subdirectories:

```
src/modules/repayment/
├── admin-repayment/
│   ├── __tests__/
│   │   ├── admin-repayment.controller.test.ts
│   │   └── admin-repayment.service.test.ts
│   ├── admin-repayment.controller.ts
│   ├── admin-repayment.service.ts
│   ├── admin-repayment.routes.ts
│   ├── admin-repayment.schema.ts
│   ├── admin-repayment.openapi.ts
│   └── types/
│       └── admin-repayment.types.ts
├── customer-repayment/
│   └── ...
├── shared/
│   └── repayment.repository.ts     ← shared DB access
└── index.ts                        ← exports only public routers + repository
```

### File Naming Reference

| File                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `<name>.controller.ts` | Express handlers — extract inputs, call service, return JSON             |
| `<name>.service.ts`    | Business logic — no `req`/`res`, no Prisma                               |
| `<name>.repository.ts` | Prisma queries — no business logic                                       |
| `<name>.routes.ts`     | Route definitions — wires middleware, validation, controller             |
| `<name>.schema.ts`     | Zod validation schemas — source of truth for request shapes and TS types |
| `<name>.openapi.ts`    | OpenAPI path registrations via `@asteasolutions/zod-to-openapi`          |
| `<name>.types.ts`      | TypeScript interfaces and type aliases for the module                    |

For the full step-by-step guide to creating a new module, see [module-authoring-guide.md](./module-authoring-guide.md).

---

## Coding Conventions

### Naming

| Thing            | Convention       | Example                                  |
| ---------------- | ---------------- | ---------------------------------------- |
| Classes          | PascalCase       | `AdminRepaymentService`                  |
| Functions        | camelCase        | `completeRepayment`                      |
| Constants        | UPPER_SNAKE_CASE | `STATUS_IN_REVIEW`                       |
| Files            | kebab-case       | `admin-repayment.service.ts`             |
| Interfaces/Types | PascalCase       | `TokenPayload`, `RepaymentWithRelations` |
| DB columns       | snake_case       | Managed by Prisma schema                 |

### Imports — Use Path Aliases

Never use deep relative paths like `../../../shared/middleware/auth`. Use path aliases instead:

```typescript
// Good
import { authenticate } from '@shared/middleware/auth.middleware.js';
import { prisma } from '@config/database.js';
import { logger } from '@config/logger.js';

// Bad
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
```

Available aliases: `@shared/*`, `@modules/*`, `@config/*`, `@lib/*`.

### Layer Rules (enforce these in PR review)

**Controllers** — only allowed to:

- Read `req.body`, `req.query`, `req.params`, `req.user`, `req.fileUrl`
- Call service methods
- Call `res.status().json()`
- Throw `AppError` for request-level problems (missing param, etc.)

**Services** — only allowed to:

- Accept plain arguments (no `req`/`res`)
- Call repository methods
- Call other shared services (`AutoAssignmentService`, `activityLogService`, etc.)
- Throw `AppError` subclasses

**Repositories** — only allowed to:

- Execute Prisma queries
- Accept and return plain values / Prisma types

### Zod Schemas as Source of Truth

Define the schema once in `.schema.ts` and derive the TypeScript type from it:

```typescript
// Good — single definition
export const createRepaymentSchema = z.object({
  amount: z.number().positive(),
  dueDate: z.iso.datetime(),
});
export type CreateRepaymentInput = z.infer<typeof createRepaymentSchema>;

// Bad — duplicated definition
interface CreateRepaymentInput {
  amount: number;
  dueDate: string;
}
```

### Commenting Rules

- **Default: no comments.** Well-named code, clear logic, and proper structure beat comments almost always.
- **Comment the "why", not the "what."** Don't duplicate what the code already says (`i++; // increment i` adds nothing).
- **Don't use comments to excuse unclear code.** Fix the code first; comments are enhancement, not a Band-Aid.
- **Explain unidiomatic code**: clever tricks, performance hacks, non-obvious language quirks merit a comment.
- **Link sources** when code is copied from elsewhere (Stack Overflow, a blog, another project).
- **Link references** (specs, RFCs, GitHub issues, tickets, docs) when implementing something non-obvious from outside the codebase.
- **Comment bug fixes**: explain the bug and why the fix works, so a future editor doesn't "simplify" the fix away.
- **Mark incomplete work explicitly** rather than leaving it silent.

**Syntax**: always use Better Comments tags — `// !` (warning/must-fix), `// *` (highlight/important), `// ?` (question/uncertainty), `// TODO:` (pending task). Never a plain `//` note.

**JSX**: inside JSX markup (`.tsx`/`.jsx` return blocks), use `{/* comment */}` — never `// comment` inside JSX. Outside JSX, in plain logic blocks, the tagged `//` syntax above applies.

---

## Authentication & Authorization

### JWT Token Structure

Both staff and customer tokens share the same payload shape:

```typescript
interface TokenPayload {
  userId: string;
  role: string; // staff role (e.g. 'CREDIT_ASSESSMENT') or 'CUSTOMER'
  type: 'staff' | 'customer';
  jti: string; // unique token ID (used for revocation)
}
```

`req.user` is populated by the `authenticate` middleware and is available in all protected routes.

### Middleware Order

Always apply middleware in this order on protected routes:

```typescript
router.post(
  '/:id/complete',
  authenticate, // 1. verify JWT
  requirePermission('REPAYMENT', 'Complete Repayment'), // 2. check permission
  validate({ params: idParamSchema }), // 3. validate inputs
  controller.complete // 4. handle
);
```

### `requirePermission` vs `requireRole`

| Middleware                          | When to use                                                     |
| ----------------------------------- | --------------------------------------------------------------- |
| `requirePermission(module, action)` | Most routes — fine-grained, Redis-cached, configurable per role |
| `requireRole(Role.X, Role.Y, ...)`  | When the check is structural (e.g. customer-only or admin-only) |
| `requireAdmin`                      | Shorthand for admin-only routes                                 |
| `requireCustomer`                   | Shorthand for customer-only routes                              |

`ADMIN` role always bypasses `requirePermission` checks.

For the full role/permission matrix, see [rbac.md](./rbac.md).

---

## Request Validation

Always validate incoming data with the `validate()` middleware. Never validate manually inside a controller or service.

```typescript
import { validate } from '@shared/middleware/validate.middleware.js';
import { listQuerySchema, createBodySchema } from './my-module.schema.js';

router.get('/list', authenticate, validate({ query: listQuerySchema }), controller.list);
router.post('/create', authenticate, validate({ body: createBodySchema }), controller.create);
```

**Rules:**

- Put schemas in `.schema.ts` — not inline in routes
- Use `z.coerce.number()` for numeric query params (query strings are always strings)
- Use `z.string().uuid()` for ID params
- Validation failures automatically return `400 BAD_REQUEST` with field-level error messages — no extra code needed

---

## Response Contracts

Standardize every response. Do not invent custom shapes.

```typescript
// Success (200)
res.status(200).json({ status: 'success', data: result });

// Created (201)
res.status(201).json({ status: 'success', data: created });

// Paginated list (200)
res.status(200).json({
  status: 'success',
  data: items,
  meta: { total, page, size, totalPages },
});
```

**Never call `res.json()` for errors.** Throw an `AppError` subclass and let the global error handler serialize it. See [api-response-contracts.md](./api-response-contracts.md) for the full reference.

---

## Error Handling

Use the `AppError` class hierarchy from `@shared/errors/AppError.ts`. Throw errors from services and controllers — don't catch and re-format them yourself.

| Class                     | HTTP Status | Code                  |
| ------------------------- | ----------- | --------------------- |
| `BadRequestError`         | 400         | `BAD_REQUEST`         |
| `UnauthorizedError`       | 401         | `UNAUTHORIZED`        |
| `ForbiddenError`          | 403         | `FORBIDDEN`           |
| `NotFoundError`           | 404         | `NOT_FOUND`           |
| `ConflictError`           | 409         | `CONFLICT`            |
| `TooManyRequestsError`    | 429         | `RATE_LIMIT_EXCEEDED` |
| `ServiceUnavailableError` | 503         | `SERVICE_UNAVAILABLE` |

```typescript
// Simple
throw new NotFoundError('Repayment not found');

// With context (second arg is included in the response `details` field)
throw new BadRequestError('Invalid status transition', {
  expected: 'REPAYMENT_REVIEW',
  actual: current.status,
});
```

Prisma constraint errors are mapped automatically by the global error handler — `P2002` (unique violation) → `409 CONFLICT`, `P2025` (record not found) → `404 NOT_FOUND`.


```bash
pnpm test              # Run all unit tests
pnpm test:coverage     # Run with coverage report
pnpm test:integration  # Integration tests (requires running DB + Redis)
```

---

## Database & Migrations

- **All schema changes go through Prisma migrations.** Never `ALTER TABLE` manually.
  This applies to **dev only** — staging and production run against the freelancer's
  DB via manual raw SQL in `prisma/scripts/*.sql`, not Prisma migrations. Any schema
  change there must follow the expand/contract sequencing rule in the "Migration
  sequencing" section of `docs/blue-green-approach.md`, since staging/prod deploys are
  blue-green and old/new containers briefly run concurrently against the same DB.
- Run `pnpm prisma migrate dev --name <description>` to create a new migration.
- Run `pnpm prisma db seed` to populate the database with seed data (`prisma/seed.ts`).
- Wrap multi-step operations in `prisma.$transaction()` to ensure atomicity.
- Never import `PrismaClient` directly in modules — use the singleton from `@config/database.ts`.

```typescript
// Good
import { prisma } from '@config/database.js';

// Bad
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

---

## Environment Variables

All environment variables are validated at startup by `src/config/env.ts` using a Zod schema. If a required variable is missing or malformed, the process exits immediately with a clear error message.

**Rules:**

- Never access `process.env` directly in application code — import from `@config/env.ts`.
- When adding a new variable, update both `src/config/env.ts` and `.env.example`.
- Secrets (API keys, JWT secrets) must never be committed to the repository.

```typescript
// Good
import { env } from '@config/env.js';
const apiKey = env.PLASGATE_API_KEY;

// Bad
const apiKey = process.env.PLASGATE_API_KEY;
```

---

## Logging

Use the Pino logger from `@config/logger.ts`. Never use `console.log`, `console.error`, or `console.warn` in application code.

```typescript
import { logger } from '@config/logger.js';

// Good — structured object
logger.info({ repaymentId, staffId }, 'Repayment completed');
logger.warn({ userId }, 'Failed login attempt');
logger.error({ err, repaymentId }, 'Unexpected error during completion');

// Bad — string interpolation loses structure
logger.info(`Repayment ${repaymentId} completed by ${staffId}`);
```

Request correlation (userId, requestId) is injected automatically via AsyncLocalStorage — you don't need to pass it manually. Every log line for a given request will carry the same correlation ID.

---


### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format with a lowercase imperative subject:

```
feat(repayment): add waive sub-option to Pay Partial
fix(auth): prevent token reuse after password change
refactor(schema): normalize role/permission into 3-table design
```

---

## Related

- [Module Authoring Guide](./module-authoring-guide.md) — step-by-step guide to creating a new module
- [API Response Contracts](./api-response-contracts.md) — standard response and error shapes
- [Project README](../README.md) — setup, infrastructure, and project overview
