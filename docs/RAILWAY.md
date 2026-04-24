# Railway — API + optional Web (monorepo)

The repo can host **one or two** services from the same GitHub project:

| Service | Config file | Role |
| -------- | ------------ | ---- |
| **@greenkind/api** | [railway.toml](../railway.toml) | Nest, Prisma migrations in pre-deploy, `GET /health` |
| **@greenkind/web** | [railway.web.toml](../railway.web.toml) | Next.js — **do not** reuse `railway.toml` or the web build will be wrong. |

**Two services in one project (your case):** open **@greenkind/web** → **Settings** → under **Config as code** / **Build & Deploy**, point this service at **`railway.web.toml`**, or paste the **Build** and **Start** commands from that file. Leave **@greenkind/api** using [railway.toml](../railway.toml) (migrations + `start:prod`). If a service picks up the API config by mistake, the Next build will try to run Nest.

**Apply / Deploy:** use **Apply changes** (or **Deploy**) when you are ready. The yellow *Railway dashboard* banner is a platform notice; if deploy fails, retry after the incident is cleared.

**Web env on Railway** (Variables on `@greenkind/web`): `JWT_ACCESS_SECRET` (match API), `API_REWRITE_URL` = the **public URL of the API** service, production `FRONTEND_ORIGIN` = this web app’s public URL, etc. (see [apps/web/.env.example](../apps/web/.env.example)).

The API package is **[@greenkind/api](../apps/api)**.

## 1. Create a service

1. [Railway](https://railway.com) → **New project** → **Deploy from GitHub** → select **greenkind** (or your fork).
2. **Do not** set a subdirectory root: the build must run from the repo root so pnpm can install workspace packages (`packages/rbac`, `packages/validation`).
3. **[railway.toml](../railway.toml)** supplies build, pre-deploy (migrations), and start. After first connect, open **Service → Settings** and confirm **Build** / **Deploy** commands match, or override only if you know what you are doing.

## 2. Databases

1. In the same project, **Add** → **Database** → **PostgreSQL**. Railway sets `DATABASE_URL` on the service when you [link the variable](https://docs.railway.com/guides/variables#referencing-a-database-url) (or add Postgres’s `DATABASE_URL` to the API service).
2. **Redis** (recommended for jobs / Bull): **Add** → **Redis** → map its URL to `REDIS_URL` on the API service. If you skip Redis, set `SKIP_REDIS=1` (jobs/queues that use Bull will not run; see [app.module.ts](../apps/api/src/app.module.ts)).

## 3. Environment variables (API service)

Set these on the **API** service (Variables tab). `PORT` and `NODE_ENV=production` are often injected by Railway; add `PORT` if your service does not get it (Nest reads `PORT` from [env.schema.ts](../apps/api/src/config/env.schema.ts)).

| Variable | Notes |
| -------- | ----- |
| `DATABASE_URL` | From PostgreSQL plugin (must start with `postgres` / `postgresql`). |
| `FRONTEND_ORIGIN` | Your **Next.js** public URL, e.g. `https://your-app.vercel.app` — used for CORS and cookies. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings (≥32 chars). **Must match** the web app’s `JWT_ACCESS_SECRET` for cookie-based auth. |
| `REDIS_URL` | From Redis, or `SKIP_REDIS=1` to disable Bull. |
| `STRIPE_*` / `RESEND_*` | As in [apps/api/.env.example](../apps/api/.env.example) and [ENV.md](./ENV.md). |
| `API_HOST` | `0.0.0.0` in containers (default in schema). |

## 4. Public URL and web

1. In Railway → **Settings → Networking** → **Generate domain** (or attach a custom domain). Your API base is `https://<host>` (no trailing slash).
2. Point **Vercel** (or your web host) at this API:
   - `API_REWRITE_URL=https://<your-railway-api-host>` in the Next app env.
3. **Stripe** webhook: `POST https://<your-railway-api-host>/v1/stripe/webhook` (see [stripe-webhook.controller.ts](../apps/api/src/billing/stripe-webhook.controller.ts)).

## 5. Migrations

`preDeployCommand` in [railway.toml](../railway.toml) runs `prisma migrate deploy` for **@greenkind/api** on each deploy. First deploy needs a valid `DATABASE_URL` before the release step.

## 6. Health check

`GET /health` (no `/v1` prefix) is used for Railway healthcheck; it reports DB status in the JSON body.

## Troubleshooting

- **Build fails on pnpm**: ensure `packageManager` in the root [package.json](../package.json) is respected (`corepack enable` is in the build command).
- **Module not found for workspace package**: the service **must** build from the **monorepo root**, not `apps/api` alone.
- **CORS errors**: set `FRONTEND_ORIGIN` to the exact browser origin of the web app (scheme + host, no path).
