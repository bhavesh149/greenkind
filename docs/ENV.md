# Environment variables — where to get values (step by step)

Paths: copy `apps/api/.env.example` → `apps/api/.env`, and `apps/web/.env.example` → `apps/web/.env.local`. The **root** `.env.example` is a quick reference only.

**Deploy on Railway:** [RAILWAY.md](./RAILWAY.md) — API uses [railway.toml](../railway.toml); the Next app on Railway uses [railway.web.toml](../railway.web.toml).

---

## 1. Local database — `DATABASE_URL`

**What it is:** PostgreSQL connection string for Prisma.

**How to get it (local Docker):**

1. From the repo root: `docker compose up -d`.
2. Use: `postgresql://postgres:postgres@localhost:5432/greenkind` (matches [docker-compose.yml](../docker-compose.yml)).

**Hosted (e.g. Supabase):**

1. Create a project at [https://supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI**.  
3. Replace the password placeholder with your DB password. Use the **pooler** URI for serverless if you deploy that way later.

---

## 2. Redis — `REDIS_URL` (API, jobs / BullMQ)

**What it is:** URL for Redis (queues, future background work).

**Local Docker:** after `docker compose up -d`, use `redis://localhost:6379`.

**Managed:** e.g. [Upstash](https://upstash.com), [Redis Cloud](https://redis.io/cloud), or Railway’s Redis plugin — copy the **rediss://** or **redis://** URL they show.

**Skip in tests:** `SKIP_REDIS=1` (see [apps/api/test/jest-e2e.setup.ts](../apps/api/test/jest-e2e.setup.ts)) omits Bull module so e2e does not need Redis.

---

## 3. JWT secrets — `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (API)

**What they are:** Symmetric keys to sign access JWTs and (with refresh flow) protect refresh tokens on the server.

**You generate them** (do not reuse across production and dev):

```bash
openssl rand -base64 48
```

Run twice; use **different** values for access vs refresh. **Minimum length enforced in code: 32 characters** (see [env.schema.ts](../apps/api/src/config/env.schema.ts)).

**Web app:** add the **same** `JWT_ACCESS_SECRET` to `apps/web/.env.local` (not `NEXT_PUBLIC_*`). The [Next.js middleware](../apps/web/src/middleware.ts) uses it to verify `gk_access` for `/app` and `/admin` routes. **Never commit** real secrets.

---

## 4. CORS — `FRONTEND_ORIGIN` (API)

**What it is:** Allowed browser origin for credentialed requests to the API.

**Local (this repo’s defaults):** `http://localhost:3001` — the **Next** dev server. It must match what you type in the browser. The **API** uses a different port (`3000`); CORS is only about the **web** origin, not the API’s port.

**Production:** your real site URL, e.g. `https://app.yourdomain.com` (no trailing slash).

---

## 5. Stripe (billing & webhooks) — `STRIPE_*` (API, `apps/api/.env`)

Set these in **`apps/api/.env`**. See also [`apps/api/.env.example`](../apps/api/.env.example).

| Variable | What it is |
|----------|------------|
| `STRIPE_SECRET_KEY` | **Secret key** (never expose to the browser). Test: `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | **Signing secret** for `POST /v1/stripe/webhook` (must match the endpoint you use) |
| `STRIPE_PRICE_ID_MONTHLY` | **Price ID** for the monthly plan (`price_...`) |
| `STRIPE_PRICE_ID_YEARLY` | **Price ID** for the yearly plan (`price_...`) |

### 5a. Secret key (`STRIPE_SECRET_KEY`)

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers → API keys**.
2. Reveal the **Secret key** (Test mode for development).
3. Paste into `STRIPE_SECRET_KEY=` in `apps/api/.env`.

### 5b. Product & prices (`STRIPE_PRICE_ID_MONTHLY` / `YEARLY`)

These must be **Stripe Price object IDs** (`price_...`), not dollar amounts. Putting `5` or `10` in `.env` will make Checkout fail with: *"The `price` parameter should be the ID of a price object"*.

**Option A — Dashboard:** **Product catalog** → **Add product** → add a **recurring** price in **monthly** and one in **yearly** (or two products). Open each price → **Copy price ID** (`price_...`).

**Option B — seed script in this repo (test mode):** from `apps/api` with a valid `STRIPE_SECRET_KEY` in `apps/api/.env`, run:

```bash
pnpm run stripe:seed-prices
```

It creates a product with **$5.00 USD / month** and **$10.00 USD / year** (test mode) and prints `STRIPE_PRICE_ID_*` lines to paste into `apps/api/.env`.

The API maps Checkout to `SubscriptionPlan` (MONTHLY / YEARLY) by comparing the Stripe line item’s price id to these env values.

**INR (rupees) for local testing:** the seed script defaults to **`INR`**: `pnpm run stripe:seed-prices` creates **₹5/month** and **₹10/year** in **test mode** (amounts are in *paise* in the API: 500 and 1000). To create **USD** dev prices instead, set `STRIPE_DEV_CURRENCY=usd` in the environment for that one command, e.g. `STRIPE_DEV_CURRENCY=usd pnpm run stripe:seed-prices`.

### 5b.1 — Sandbox: test card (not a real card number)

In **Test mode**, Stripe does not charge real money. You must use [Stripe’s test card numbers](https://docs.stripe.com/testing#cards) — **not** random digits like `1234…`.

- **Simple success (Visa, many currencies including INR in test):** `4242 4242 4242 4242`  
- **Expiry:** any **future** date (e.g. `12 / 34`)  
- **CVC:** any 3 digits (e.g. `123`)  
- **Name / billing:** fill required fields; use a real-format address if the form still errors.

The screenshot error *"Your card number is invalid"* means the number is not a valid **test** pattern. With INR checkout, the page shows **₹** once the **Price** objects are INR (after you point `STRIPE_PRICE_ID_*` at the INR `price_...` ids from the script).

### 5c. Webhook signing secret (`STRIPE_WEBHOOK_SECRET`)

The API verifies bodies with `STRIPE_WEBHOOK_SECRET`. You can use the Dashboard or the Stripe CLI; **the secret must be the one for the endpoint that actually delivers webhooks to your server.**

**Option A — Stripe Dashboard (deployed or tunnel URL):**

1. **Developers → Webhooks** → **Add endpoint**.
2. URL: `https://<your-api-host>/v1/stripe/webhook` (in production) or a tunnel URL in dev.
3. Choose events, at least: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` (and any other events you add later).
4. After saving, open the endpoint → **Signing secret** → `whsec_...` → put in `STRIPE_WEBHOOK_SECRET`.

**Option B — Local with [Stripe CLI](https://docs.stripe.com/stripe-cli) (recommended for dev):**

```bash
stripe listen --forward-to localhost:3000/v1/stripe/webhook
```

**Do not use port 3001 here.** In this monorepo, **3001** is the **Next.js** dev server. Webhooks are handled by **Nest** on **3000**. Forwarding to 3001 routes through Next’s proxy, which can break **Stripe signature verification** (the raw body must match what was signed). Always forward directly to the API port. The CLI prints a **`whsec_...`** (new each time you run it unless you use a **named** `stripe listen` profile). Put **that** value in `STRIPE_WEBHOOK_SECRET` in `apps/api/.env` while you test locally. Restart the API after you change it.

**Trigger test events (optional):**

```bash
stripe trigger checkout.session.completed
```

(Real flows still need real Checkout; webhooks for local testing are easiest with the forwarder to the **API** port, default `3000` in this repo.)

### 5d. CORS and cookies

`FRONTEND_ORIGIN` in `apps/api/.env` must be the **exact** origin the browser uses for the web app (e.g. `http://localhost:3001` in this monorepo’s default). Browsers will not send `httpOnly` cookies on credentialed `fetch` if CORS `origin` is wrong or if `Access-Control-Allow-Origin` is `*` (the API is configured to use `FRONTEND_ORIGIN`, not `*`).

---

## 6. Email (Resend, later) — `RESEND_API_KEY`

**Where:** [resend.com](https://resend.com) → **API Keys** → create and copy.

---

## 7. Supabase Storage / S3 (later file uploads) — `S3_*`

**Where:** Supabase **Project Settings → Storage** (S3-compatible endpoint and keys), or any S3 provider (Bucket, access key, secret, region, optional custom endpoint).

---

## 8. Web → API base URL

**Browser calls:** the Next app rewrites `GET/POST /v1/...` to the API (see [next.config.ts](../apps/web/next.config.ts)). Default target is `http://127.0.0.1:3000`. Set **`API_REWRITE_URL`** in `apps/web/.env.local` if the API is not there (e.g. Docker, different host, or a different `PORT` in `apps/api/.env`).

**Vercel / production:** add the same variable in the Vercel project settings (Build & Runtime) with your **deployed API** base URL (`https://…`). The marketing `/charities` routes are rendered on demand and call the API at request time; localhost is not available on the build machine. If `API_REWRITE_URL` is omitted, server-side fetches fall back to `https://$VERCEL_URL` so Next can proxy `/v1` to your API when rewrites are configured; setting `API_REWRITE_URL` explicitly is still recommended.

**Optional:** `NEXT_PUBLIC_APP_URL` for absolute links in emails (later).

---

## 9. Apply migrations and seed (after `DATABASE_URL` is set)

```bash
pnpm --filter @greenkind/api run db:migrate:deploy
pnpm --filter @greenkind/api run db:seed
```

Test logins and password are printed by the seed script; see [seed.ts](../apps/api/prisma/seed.ts).

---

## 10. Run stack locally

1. `docker compose up -d` (Postgres + Redis), *or* use a local PostgreSQL and optional `SKIP_REDIS=1` if you skip Redis.
2. `cp apps/api/.env.example apps/api/.env` and fill `JWT_*`, `FRONTEND_ORIGIN`, and Stripe values when you test billing.
3. `cp apps/web/.env.example apps/web/.env.local` — at minimum **`JWT_ACCESS_SECRET` must match** the API.
4. Migrations + seed (above).
5. `pnpm dev` from repo root (Turbo runs API + web), or start each app separately.

**Cookies:** the UI uses `fetch('/v1/...', { credentials: 'include' })` so `httpOnly` auth cookies are set for the **Next origin** via the reverse proxy, not a separate public API URL in the browser.

**Local ports in this repository:** the **web** app runs on **3001** (`next dev` is pinned in [apps/web/package.json](../apps/web/package.json)). The **API** runs on **3000** (`PORT` in `apps/api/.env` and the Prisma/defaults in [env.schema.ts](../apps/api/src/config/env.schema.ts)). `API_HOST` (default `0.0.0.0`) controls the bind address. Next rewrites `/v1/*` to `API_REWRITE_URL` or `http://127.0.0.1:3000` ([`next.config.ts`](../apps/web/next.config.ts)).

---

## 11. Troubleshooting

### `Error: listen EADDRINUSE ...` (port 3000 and/or 3001)

A port can only be used by one process. If the **web** and **API** are both set to the same `PORT`, or a **zombie** `node` from an old dev run still holds a port, the new process exits with `EADDRINUSE`.

- **Web** (Next) is expected on **3001** in this repo.  
- **API** (Nest) is expected on **3000** in this repo.  
If you see `EADDRINUSE` for **3000**, something else is using the API port. If you see it for **3001**, something else (often another `next dev`) is using the web port.

1. **List listeners (replace `3000` with the port from the error):**

   ```bash
   lsof -nP -iTCP:3000 -sTCP:LISTEN
   lsof -nP -iTCP:3001 -sTCP:LISTEN
   ```

2. **Stop the process** (replace `<pid>`):

   ```bash
   kill <pid>
   ```

   If needed: `kill -9 <pid>`.

3. **Restart** `pnpm dev`. Do not run two copies of the API on the same `PORT`.

### `connect ECONNREFUSED` or `EADDRNOTAVAIL` to the API from the web app

The API is not listening (crashed, wrong `PORT`, or not started), or `API_REWRITE_URL` / `PORT` are inconsistent. The Next rewrite targets `http://127.0.0.1:3000` by default; the API must be listening on that port unless you change both sides.

### Webhook `400` / signature errors

- `STRIPE_WEBHOOK_SECRET` must be the secret for the **same** delivery path the CLI or Dashboard uses.
- The handler must receive the **raw** body (this repo uses `json({ verify })` in [`main.ts`](../apps/api/src/main.ts)); do not put another JSON parser in front of `/v1/stripe/webhook` that consumes the body without preserving bytes for verification.

---

## Resend (transactional email) — `apps/api/.env`

| Variable | What it is |
|----------|------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (optional for local dev; emails are skipped if unset) |
| `RESEND_FROM` | Verified sender, e.g. `GreenKind <mail@yourdomain.com>` (required for real delivery) |
| `DISABLE_EMAIL_DIGEST` | `1` or `true` to disable the daily 09:00 digest job (e.g. tests) |

The API sends: welcome (signup), subscription thank-you (Checkout completed), “you won” (draw publish), verification outcome (admin approve/reject), and a daily digest when users have unread in-app notifications.
