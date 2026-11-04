# Chat Backend

REST API backend for the chat mobile and web apps, built with **Express 5**, **Prisma ORM 7**, **TypeScript** and **PostgreSQL**, using **pnpm** as the package manager. Authentication uses **Passport** (email/password login + JWT Bearer tokens).

This README covers **local development only**. Docker is not used for now: PostgreSQL runs locally via Homebrew, and DBeaver is used as the database GUI.

**Contents**

- [Prerequisites](#prerequisites)
- [Getting Started (cloning this repo)](#getting-started-cloning-this-repo)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [API](#api)
- [Project Structure](#project-structure)
- [Adding a New Feature Module](#adding-a-new-feature-module)
- [Scripts & Command Reference](#scripts--command-reference)
- [Troubleshooting](#troubleshooting)
- [How This Project Was Created (from scratch)](#how-this-project-was-created-from-scratch)

---

## Prerequisites

| Tool | Version used | Install |
| :--- | :--- | :--- |
| Node.js | 22 (20+ works) | [nodejs.org](https://nodejs.org/) |
| pnpm | 10 | `corepack enable` or [pnpm.io/installation](https://pnpm.io/installation) |
| PostgreSQL | 17 (Homebrew) | `brew install postgresql@17` |
| DBeaver | any | [dbeaver.io](https://dbeaver.io/) (optional, for browsing data) |

Use **pnpm only**; do not use npm or yarn in this repo.

---

## Getting Started (cloning this repo)

### 1. Start PostgreSQL

```bash
brew services start postgresql@17
```

### 2. Create the database

We use the existing `postgres` superuser; no separate database user is needed. Create an empty database called `chat_backend` using **either** option:

**Terminal:**

```bash
psql -U postgres -c "CREATE DATABASE chat_backend;"
```

**DBeaver:** open your `postgres` connection → SQL Editor (make sure the commit mode in the toolbar is **Auto**) → run:

```sql
CREATE DATABASE chat_backend;
```

Then right-click **Databases** → **Refresh**.

### 3. Install dependencies

```bash
pnpm install
```

Prisma's install scripts are already approved in `pnpm-workspace.yaml`, so no `pnpm approve-builds` prompt is needed.

### 4. Create your `.env`

```bash
cp .env.example .env
openssl rand -base64 48        # copy the output into JWT_SECRET
```

Then edit `.env`. See [Environment Variables](#environment-variables) for what each value means.

### 5. Create the tables and generate the Prisma Client

```bash
pnpm exec prisma migrate dev     # applies every migration in prisma/migrations
pnpm exec prisma generate        # writes the typed client into generated/prisma/
```

Run **both**. In Prisma 7, `migrate dev` no longer runs `generate` for you, and `generated/` is git-ignored, so a fresh clone has no client until you generate it.

### 6. Start the server

```bash
pnpm run dev
```

### 7. Check it works

```bash
curl http://localhost:3000/health
pnpm exec prisma migrate status   # should say "Database schema is up to date!"
```

In DBeaver, refresh `chat_backend` → **Schemas → public → Tables**. You should see `users`, `posts` and `_prisma_migrations`.

Then try the [curl examples](#example-with-curl) below.

---

## Environment Variables

All variables live in `.env` (git-ignored; never commit it). `.env.example` is the template and **is** committed: when you add a variable, add it to both `.env.example` and `src/config/env.ts`.

Every value is validated at startup by `src/config/env.ts` using Zod. If something is missing or invalid, the server prints what's wrong and refuses to start.

| Variable | Example | What it is |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | `development`, `test` or `production`. Development enables pretty logs. |
| `PORT` | `3000` | Port the API listens on. |
| `DATABASE_URL` | `postgresql://postgres@localhost:5432/chat_backend?schema=public` | How the app and the Prisma CLI connect to Postgres. Add `:password` after `postgres` if your local user has one. |
| `JWT_SECRET` | output of `openssl rand -base64 48` | A random string **you generate**. The server signs login tokens with it and checks them with it. It is not from Postgres. Must be at least 32 characters. Anyone who knows it can forge tokens; changing it logs everyone out. |
| `JWT_EXPIRES_IN` | `1h` | How long a login token is valid (`15m`, `1h`, `7d`, …). |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated origins allowed to call the API from a browser. Empty = allow all in development, none in production. |

---

## Database & Migrations

`prisma/schema.prisma` is the single source of truth for the database. Two commands read it:

```
                     ┌── prisma migrate dev ──▶ creates/changes TABLES in Postgres (and writes a SQL migration file)
prisma/schema.prisma ┤
                     └── prisma generate ─────▶ writes the TypeScript CLIENT into generated/prisma/
```

### Changing the schema (adding a model, field, index…)

1. Edit `prisma/schema.prisma`.
2. Create and apply a migration with a short descriptive name:
   ```bash
   pnpm exec prisma migrate dev --name add-conversation-model
   ```
   This writes `prisma/migrations/<timestamp>_add-conversation-model/migration.sql` and applies it to your local DB.
3. Regenerate the client so TypeScript knows about the change:
   ```bash
   pnpm exec prisma generate
   ```
4. **Commit the new folder in `prisma/migrations/`** together with the schema change.

### After pulling a teammate's changes

```bash
pnpm install
pnpm exec prisma migrate dev     # applies any new migrations
pnpm exec prisma generate
```

### Rules

- Never change tables by hand in DBeaver; every schema change goes through a migration.
- Never edit or delete a migration that has already been committed. Create a new one instead.
- Tables and columns use snake_case in the database (`password_hash`, `author_id`) via `@map` / `@@map`, while TypeScript fields stay camelCase (`passwordHash`, `authorId`).
- Application code imports `prisma` from `@config/database.js`. Never create a new `PrismaClient`, and never import from `@prisma/client`; the generated client lives in `generated/prisma/client.js`.

### Useful commands

| Task | Command |
| :--- | :--- |
| See which migrations are applied | `pnpm exec prisma migrate status` |
| Reset local DB (**deletes all data**, re-applies all migrations) | `pnpm exec prisma migrate reset` |
| Check / format the schema | `pnpm exec prisma validate` / `pnpm exec prisma format` |

### Current migrations

| Migration | What it does |
| :--- | :--- |
| `20261103094112_init_user_post` | Creates `users` and `posts` tables |

### Connecting with DBeaver

| Field | Value |
| :--- | :--- |
| Host | `localhost` |
| Port | `5432` |
| Database | `chat_backend` |
| Username | `postgres` |
| Password | *(empty, unless you set one)* |

---

## API

All routes are under `/customer/api/v1`. Protected routes need an `Authorization: Bearer <accessToken>` header.

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/health` *(no prefix)* | — | Health check |
| POST | `/auth/register` | — | Create an account; returns `{ user, accessToken }` |
| POST | `/auth/login` | — | Log in with email + password; returns `{ user, accessToken }` |
| GET | `/auth/me` | JWT | The current user |
| POST | `/posts` | JWT | Create a post |
| GET | `/posts?page=1&size=20` | JWT | List your own posts (paginated, max `size` 100) |
| GET | `/posts/:id` | JWT | Get a post (yours, or anyone's published post) |
| PATCH | `/posts/:id` | JWT | Update your post (`403` if it isn't yours) |
| DELETE | `/posts/:id` | JWT | Delete your post (`204` on success) |

Every response uses one of two shapes:

```jsonc
// success
{ "status": "success", "data": { ... }, "meta": { "total": 1, "page": 1, "size": 20, "totalPages": 1 } }
// error
{ "status": "error", "error": { "code": "NOT_FOUND", "message": "Post not found", "details": { ... } } }
```

`meta` appears only on paginated lists; `details` appears only when there is extra info (for example, field-level validation errors on a `400`).

### Example with curl

```bash
BASE=http://localhost:3000/customer/api/v1

# Register and keep the token
TOKEN=$(curl -s -X POST $BASE/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password123","name":"Alice"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')

# Log in (returns a fresh token)
curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password123"}'

# Current user
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN"

# CRUD
curl -s -X POST $BASE/posts -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"First post"}'
curl -s "$BASE/posts?page=1&size=10" -H "Authorization: Bearer $TOKEN"
curl -s $BASE/posts/<id> -H "Authorization: Bearer $TOKEN"
curl -s -X PATCH $BASE/posts/<id> -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"published":true}'
curl -s -X DELETE $BASE/posts/<id> -H "Authorization: Bearer $TOKEN" -w '%{http_code}\n'
```

### How authentication works

```
1. POST /auth/login ──▶ passport-local looks up the email, checks the password against the bcrypt hash
                        └─▶ server signs a JWT { sub: userId } with JWT_SECRET and returns it

2. Client stores the token and sends it on every request:  Authorization: Bearer <token>

3. Protected route ──▶ passport-jwt checks the signature + expiry with JWT_SECRET
                       └─▶ loads the user from the DB and sets req.user
```

- No sessions or cookies; works the same for the Flutter app and the web app.
- The user is reloaded on every request, so a deleted account loses access immediately.
- Passwords are stored as bcrypt hashes (`password_hash`), never in plain text, and are never returned by the API.
- Strategies live in `src/config/passport.ts`; the route middleware (`authenticate`, `authenticateLocal`) lives in `src/shared/middleware/auth.middleware.ts`.

---

## Project Structure

```
.
├── docs/
│   └── PROJECT_GUIDELINES.MD     # Coding conventions — read before contributing
├── prisma/
│   ├── schema.prisma             # Database models (User, Post)
│   └── migrations/               # SQL migrations (committed)
├── generated/prisma/             # Generated Prisma Client (git-ignored, created by prisma generate)
├── src/
│   ├── config/
│   │   ├── env.ts                # Loads + validates .env (Zod)
│   │   ├── database.ts           # Prisma Client singleton (PrismaPg adapter)
│   │   ├── logger.ts             # Pino logger
│   │   └── passport.ts           # passport-local + passport-jwt strategies
│   ├── shared/
│   │   ├── errors/AppError.ts    # AppError + BadRequest/Unauthorized/Forbidden/NotFound/Conflict
│   │   ├── middleware/           # authenticate, validate, notFound + error handlers
│   │   └── types/express.d.ts    # Types req.user
│   ├── modules/
│   │   ├── auth/                 # register, login, me
│   │   └── post/                 # Post CRUD
│   ├── routes/v1.ts              # Mounts module routers under /customer/api/v1
│   ├── app.ts                    # Express app + middleware chain
│   └── index.ts                  # Starts the server, graceful shutdown
├── prisma.config.ts              # Prisma CLI config (schema path, migrations dir, DATABASE_URL)
├── pnpm-workspace.yaml           # Approves Prisma's install scripts
├── tsconfig.json                 # TypeScript config + path aliases
├── .env.example                  # Template for .env (committed)
└── .env                          # Your local values (git-ignored)
```

### Request flow

```
Request → helmet → cors → pino-http (log) → express.json → passport.initialize
        → route: authenticate → validate (Zod) → controller → service → repository → Prisma
        → errorHandler (turns any thrown AppError / Prisma error into the JSON error shape)
```

---

## Adding a New Feature Module

Copy the shape of `src/modules/post/`. Each module has:

| File | Responsibility |
| :--- | :--- |
| `<name>.schema.ts` | Zod schemas for body/query/params, plus types inferred from them |
| `<name>.repository.ts` | Prisma queries only; no business rules, no throwing |
| `<name>.service.ts` | Business rules; throws `AppError` subclasses; no `req`/`res` |
| `<name>.controller.ts` | Reads `req`, calls the service, sends `{ status: 'success', data }` |
| `<name>.routes.ts` | Wires `authenticate` → `validate(...)` → controller |
| `index.ts` | Exports the router (and anything other modules may use) |

Steps:

1. Add the model to `prisma/schema.prisma`, then run `migrate dev --name ...` and `generate` (see [Changing the schema](#changing-the-schema-adding-a-model-field-index)).
2. Create the module files above.
3. Mount the router in `src/routes/v1.ts`, e.g. `v1Router.use('/conversations', conversationRouter)`.
4. Run `pnpm run typecheck`.

Conventions:

- Import with path aliases (`@config/...`, `@shared/...`, `@modules/...`) and `.js` extensions (`import { prisma } from '@config/database.js'`).
- Use the logger, never `console.log`.
- Read config from `@config/env.js`, never `process.env` directly.

See [docs/PROJECT_GUIDELINES.MD](docs/PROJECT_GUIDELINES.MD) for the full conventions.

---

## Scripts & Command Reference

| Task | Command |
| :--- | :--- |
| Start dev server (auto-restart on change) | `pnpm run dev` |
| Start server (no watch) | `pnpm start` |
| Type check | `pnpm run typecheck` |
| Create + apply a migration | `pnpm exec prisma migrate dev --name <name>` (or `pnpm run db:migrate`) |
| Generate Prisma Client | `pnpm exec prisma generate` (or `pnpm run db:generate`) |
| Migration status | `pnpm exec prisma migrate status` |
| Reset local database | `pnpm exec prisma migrate reset` |
| Start / stop PostgreSQL | `brew services start postgresql@17` / `brew services stop postgresql@17` |

---

## Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `Invalid environment variables:` on startup | A value in `.env` is missing or wrong; the message says which. Compare with `.env.example`. |
| `Cannot find module '.../generated/prisma/client.js'` | Run `pnpm exec prisma generate`. |
| TypeScript says a model or field doesn't exist after a schema change | Run `pnpm exec prisma generate` (and restart the TS server in your editor). |
| `P1001: Can't reach database server` | PostgreSQL isn't running: `brew services start postgresql@17`. |
| `P1003: Database chat_backend does not exist` | Create it (see [Getting Started](#2-create-the-database)). |
| `role "..." does not exist` | The username in `DATABASE_URL` is wrong; use `postgres`. |
| `Ignored build scripts: @prisma/engines, prisma` | Run `pnpm approve-builds` and select both (already done in this repo via `pnpm-workspace.yaml`). |
| `pnpm dlx tsc` prints "This is not the tsc command you are looking for" | Use `pnpm exec tsc`; `dlx` downloads an unrelated package named `tsc`. |
| `prisma init` / `prisma` created `.agents/`, `.claude/`, `.windsurf/`, `skills-lock.json` | These are AI-assistant skill files, not needed. Delete them. |
| Prisma CLI is version 8.x | `pnpm add prisma` without a version installs the Prisma 8 release candidate. Keep `prisma`, `@prisma/client` and `@prisma/adapter-pg` pinned to the **same** 7.x version (currently `7.10.1`). |

---

## How This Project Was Created (from scratch)

For reference, or to start a similar project. You do **not** need these steps to work on this repo; use [Getting Started](#getting-started-cloning-this-repo).

### 1. Initialize the project

```bash
pnpm init
```

Set `"type": "module"` in `package.json` to use ES Modules.

### 2. TypeScript & tooling

```bash
pnpm add -D typescript tsx @types/node
pnpm exec tsc --init
```

Replace the generated `tsconfig.json` with the one in this repo. Key points:

- `"module"` / `"moduleResolution"`: `"nodenext"`. Imports need `.js` extensions.
- `"types": ["node"]`. The generated default `[]` hides Node types (`process.env` becomes an error).
- `"paths"` defines the `@config/*`, `@shared/*` and `@modules/*` aliases; `tsx` resolves them at runtime.
- `"noEmit": true`. `tsx` runs TypeScript directly; `tsc` is only used for type checking.

### 3. Prisma

Pin the CLI, client and adapter to the **same version**:

```bash
pnpm add -D prisma@7.10.1 @types/pg
pnpm add @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 dotenv
pnpm approve-builds        # select @prisma/engines and prisma → saved in pnpm-workspace.yaml
pnpm exec prisma init --datasource-provider postgresql
```

| Package | Role |
| :--- | :--- |
| `prisma` (dev) | The CLI: `init`, `migrate`, `generate`. Not used at runtime. |
| `@prisma/client` | Runtime library the generated client builds on. |
| `@prisma/adapter-pg` | Driver adapter: Prisma 7 talks to Postgres through `pg` (node-postgres). |
| `dotenv` | Loads `.env` into `process.env`. |

`prisma init` creates `prisma/schema.prisma`, `prisma.config.ts` and `.env`. Then:

- Add `.env` to `.gitignore`.
- Delete any AI skill folders it created (see [Troubleshooting](#troubleshooting)).
- In Prisma 7 the database URL lives in `prisma.config.ts` (`datasource.url`), **not** in the schema's `datasource` block.
- The schema uses the new `prisma-client` generator with `output = "../generated/prisma"`.

Define the models in `prisma/schema.prisma`, then:

```bash
pnpm exec prisma migrate dev --name init-user-post
pnpm exec prisma generate
```

### 4. Express, auth & middleware

```bash
pnpm add express cors helmet passport passport-local passport-jwt jsonwebtoken bcryptjs zod pino pino-http
pnpm add -D @types/express @types/cors @types/passport @types/passport-local @types/passport-jwt @types/jsonwebtoken pino-pretty
```

| Package | Used for |
| :--- | :--- |
| `express` | HTTP server and routing (v5) |
| `passport`, `passport-local`, `passport-jwt` | Email/password login, and Bearer-token auth on protected routes |
| `jsonwebtoken` | Signing access tokens |
| `bcryptjs` | Password hashing (pure JS, no native build step) |
| `zod` | Request and environment validation (v4) |
| `helmet`, `cors` | Security headers and cross-origin access |
| `pino`, `pino-http`, `pino-pretty` | Structured logging (pretty output in development) |

`-D` installs a package as a dev dependency: tools and type definitions needed only while developing, not when the server runs.

### 5. Scripts in `package.json`

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "start": "tsx src/index.ts",
  "typecheck": "tsc",
  "db:migrate": "prisma migrate dev",
  "db:generate": "prisma generate"
}
```
