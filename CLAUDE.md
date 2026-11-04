# CLAUDE.md

Express 5 + TypeScript + Prisma 7 (PostgreSQL) REST backend for a chat app. Auth is Passport (local login → JWT, Bearer on protected routes). Package manager is **pnpm**, never npm or yarn.

Full rules and the reasons behind them: [docs/PROJECT_GUIDELINE_IMPROVEMENTS.md](docs/PROJECT_GUIDELINE_IMPROVEMENTS.md). Setup and API usage: [README.md](README.md). `docs/deprecated/` is no longer used; don't follow or link to it.

## Commands

```bash
pnpm run dev            # tsx watch src/index.ts
pnpm run typecheck      # tsc (noEmit)
pnpm exec prisma migrate dev --name <change>   # create + apply a migration
pnpm exec prisma generate                      # regenerate the client (migrate dev does NOT do this in Prisma 7)
pnpm dlx newman run postman/chat_backend.postman_collection.json --color off   # API tests, server must be running
```

- Use `pnpm exec <bin>` for local binaries. `pnpm dlx tsc` runs the wrong package.
- `prisma`, `@prisma/client` and `@prisma/adapter-pg` are pinned to **7.10.1**. Don't upgrade (plain `pnpm add prisma` pulls the 8.x RC).
- Verify a change with `pnpm run typecheck`, then the newman suite (28 requests, 73 assertions, all must pass).

## Architecture

```
src/
├── index.ts        # starts the server, graceful shutdown
├── app.ts          # helmet, cors, pino-http, json, passport, /health, /customer/api/v1, error handlers
├── routes/v1.ts    # mounts module routers (/auth, /posts)
├── config/         # env (Zod-validated), database (Prisma + PrismaPg), logger (Pino), passport strategies
├── shared/         # errors/AppError.ts, middleware (validate, auth, error), types/express.d.ts
└── modules/<name>/ # one folder per feature
```

Each module is layered: **routes → controller → service → repository**.

| File | Responsibility |
| :--- | :--- |
| `<name>.schema.ts` | Zod schemas for body / query / params |
| `<name>.repository.ts` | `class XRepository { constructor(db) }`: Prisma queries only, each with a `select` whitelist. No business rules, no throwing. |
| `<name>.service.ts` | `class XService { constructor(repository) }`: business rules; throws `AppError` subclasses; never touches `req`/`res`. |
| `<name>.controller.ts` | `class XController { constructor(service) }`: reads `req`, calls the service, sends the response. |
| `<name>.routes.ts` | The **composition root**: creates the instances and wires middleware → handler. |
| `index.ts` | Exports only the router, plus any instance outside code needs (e.g. `authService` for passport). |

### Dependency injection rules

```typescript
// <name>.routes.ts — the only place `new` appears
const postRepository = new PostRepository(prisma);
const postService = new PostService(postRepository);
const postController = new PostController(postService);

postRouter.post('/', validate({ body: createPostSchema }), postController.create);
```

1. Every dependency comes in through the constructor, **with no default values** (`= new X()` is forbidden).
2. Repositories receive `DatabaseClient` (`constructor(private readonly db: DatabaseClient)`). They never import `prisma` directly.
3. `new` only appears in `<name>.routes.ts`. Services and controllers import the layer below with `import type`.
4. Dependencies are `private readonly`.
5. Controller handlers are **arrow-function properties** (`create = async (req, res) => {…}`) so `this` stays bound when passed to the router.
6. Code outside a module talks to its service through the instance exported from `index.ts`, never to its repository.

### Folder layout

- One audience → a flat module folder (`post/post.*.ts`), as today.
- Two or more audiences → `<audience>-<module>/` sub-folders plus `shared/<module>.repository.ts`. Audiences: `customer` (`/customer/api/v1`, Flutter app), `agent` (`/agent/api/v1`, staff), `guest` (no login). Each sub-folder's `routes.ts` is its own composition root.
- When the first `agent` route arrives, split `v1Router` into `customerV1Router` and `agentV1Router`, mounted separately in `app.ts`.
- Tests go in `__tests__/` next to the code they test.

## Requests, responses, errors

- **Validation:** every route with input uses `validate({ body?, query?, params? })` with a Zod schema. `validate()` replaces `req.body` / `req.query` / `req.params` with the parsed values.
- **Request DTOs are paused.** Schema files export no `z.infer` types; handlers pass `req.body` / `req.query` through and services/repositories take `input: any`. Route ids are read as `req.params.id as string`. Don't re-add `z.infer` types unless asked; if asked, mark each with `// dto`.
- **Response DTOs are deferred.** Instead, each repository's `select` constant (`postSelect`, `publicUserSelect`) is the response contract. Never return a model without a `select`. To expose a column, add it there on purpose. `passwordHash` must never appear in a select used for responses.
- **Response envelope:**
  ```typescript
  res.status(200).json({ status: 'success', data });
  res.status(200).json({ status: 'success', data: items, meta: { total, page, size, totalPages } }); // lists
  res.status(201).json({ status: 'success', data: created });
  res.status(204).send(); // delete
  ```
- **Errors:** throw an `AppError` subclass (`BadRequestError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409) from `@shared/errors/AppError.js`, mostly from services. Never `res.status(4xx).json(...)`, and don't try/catch just to reformat; Express 5 forwards async errors. The global handler returns `{ status: 'error', error: { code, message, details? } }`, maps Prisma `P2002` → 409 and `P2025` → 404, and turns anything else into a logged 500. New status → new subclass in `AppError.ts`.
- **Auth:** protect routes with `authenticate` (JWT); login uses `authenticateLocal`. Read the user with `getAuthUser(req)` (typed by `src/shared/types/express.d.ts`: `id`, `email`, `name`).

## Code conventions

- Import with path aliases (`@config/*`, `@shared/*`, `@modules/*`) and **`.js` extensions** (`nodenext`). Use `import type` for type-only imports (`verbatimModuleSyntax`).
- Read config from `env` in `@config/env.js`, never `process.env` (new variables go in the Zod schema there and in `.env.example`).
- Log with the Pino `logger`, never `console.log`.
- Comments only where they explain *why*, using the `// * ` style already in the code.
- Prisma Client is generated into `generated/prisma` (git-ignored); import it via `@config/database.js`.
- Schema changes: edit `prisma/schema.prisma` (snake_case columns via `@map` / `@@map`, UUID ids) → `migrate dev --name …` → `generate`. Never edit an applied migration.

## Constraints

- The user manages Postgres and `.env` themselves (local Homebrew Postgres 17, `postgres` superuser, DBeaver as the UI). Don't create DB users, don't edit `.env`, and never print `JWT_SECRET` or the DB password. Never commit `.env`.
- No Docker, no Prisma Studio.
- Commit or push only when asked.

## Known issues

- `src/modules/banner/` is LOS reference code, not mounted. It causes ~113 typecheck errors (missing vitest, supertest, openapi, rbac/upload middleware, `Gallery` model). Ignore errors from that folder when typechecking; it's slated to move out of `src/`.
- Response/error shape vs the LOS API is an open decision; don't change the envelope without asking.
