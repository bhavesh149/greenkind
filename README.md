# GreenKind

Monorepo: **Next.js** (`apps/web`) + **NestJS** (`apps/api`), **pnpm** + **Turborepo**.

## Requirements

- Node.js 20+
- pnpm 9+ (`corepack enable`)

## Setup

```bash
pnpm install
cp .env.example .env
```

Use app-specific env files: `apps/api/.env`, `apps/web/.env.local`.

**Local dev ports:** Next **3001**, API **3000** (see `docs/ENV.md`). `FRONTEND_ORIGIN` in the API must be `http://localhost:3001`; set `API_REWRITE_URL=http://127.0.0.1:3000` in `apps/web/.env.local` if you change the API port.

## Database (NestJS + Prisma)

1. Start Postgres: `docker compose up -d` (from the repo root). Default URL: `postgresql://postgres:postgres@localhost:5432/greenkind`.
2. `cp apps/api/.env.example apps/api/.env` and set `DATABASE_URL` if you change credentials.
3. Apply migrations: `pnpm --filter @greenkind/api run db:migrate:deploy` (or `db:migrate` in development to create/apply new migrations).
4. Seed dev data: `pnpm --filter @greenkind/api run db:seed` (logins are printed; password is in `apps/api/prisma/seed.ts`).

The Prisma schema and SQL migrations live under `apps/api/prisma/`. Pin: Prisma **5.22.x** (avoids Prisma 7’s separate datasource config in `schema.prisma` until you choose to upgrade).

**Auth (Phase 4):** API routes are under `/v1` (see `apps/api/src/main.ts`). The web app proxies `/v1/*` to the API via Next rewrites so `httpOnly` cookies stay on the Next origin. Sign-in: `/sign-in`, sign-up: `/sign-up`. Middleware protects `/app/*` and `/admin/*` using the same `JWT_ACCESS_SECRET` as the API (set in `apps/web/.env.local`).

## Commands

| Command        | Description                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | All apps in dev (Turbo)        |
| `pnpm build`   | Build all packages and apps    |
| `pnpm typecheck` | TypeScript check across repo |
| `pnpm lint`    | ESLint in each app             |
| `pnpm format`  | Prettier (root)                |

## Structure

- `apps/api` — NestJS API
- `apps/web` — Next.js frontend
- `packages/rbac` — Shared role/permission helpers
- `packages/validation` — Shared Zod schemas
- `packages/config-ts` — Shared TSConfig fragments
- `packages/ui-tokens` — Design tokens (JSON, Phase 1+)

Design tokens for GreenKind are defined in CSS (`apps/web/src/app/globals.css`, `--gk-*`) and mirrored in [`packages/ui-tokens/tokens.json`](packages/ui-tokens/tokens.json). Use Tailwind utilities like `text-brand-600` and `bg-warm-50` — do not hard-code hex in components.

**Environment variables (where each value comes from):** see [docs/ENV.md](docs/ENV.md).

Product requirements doc (`PRD_Cursor_Brief.md`) is local-only and not committed; keep a copy in your drive or product wiki if you need to share it.
