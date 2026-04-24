# PRD Build Brief — Digital Heroes Sample Assignment

## 1) Product in one line

Build a subscription-based golf score tracking platform with charity selection, monthly prize draws, winner verification, and a full admin panel. The product must feel emotional, modern, and impact-driven rather than like a traditional golf site. The PRD positions this as a single source of truth for design, development, and evaluation. fileciteturn0file0

---

## 2) What the product is

This is a web app with four major systems:

1. Subscription and payment handling
2. Golf score capture and rolling score history
3. Monthly draw and prize distribution engine
4. Charity contribution and winner verification workflows

It also requires:

- A public marketing website
- A subscriber dashboard
- An admin dashboard
- Reports and analytics
- Secure authentication
- Responsive UI
- Deployment to a fresh Vercel and fresh Supabase setup per the PRD. fileciteturn0file0

---

## 3) Core requirements extracted from the PRD

### 3.1 Public visitor experience
A visitor must be able to:
- Understand the platform concept
- Explore charities
- Understand how the draw works
- Start a subscription flow. fileciteturn0file0

### 3.2 Registered subscriber experience
A subscriber must be able to:
- Manage profile and settings
- Enter and edit golf scores
- Select a charity recipient
- View participation and winnings
- Upload proof when they win. fileciteturn0file0

### 3.3 Administrator experience
An admin must be able to:
- Manage users and subscriptions
- Configure and run draws
- Manage charities
- Verify winners and payouts
- View reports and analytics. fileciteturn0file0

---

## 4) Functional requirements by module

### 4.1 Subscription and payment system
Requirements:
- Monthly plan
- Yearly plan with discount
- Stripe or equivalent PCI-compliant gateway
- Restricted access for non-subscribers
- Renewal, cancellation, and lapsed subscription lifecycle
- Real-time subscription status validation on every authenticated request. fileciteturn0file0

Build implications:
- Need webhook-driven billing state sync
- Need subscription gating middleware
- Need access flags for feature-level authorization
- Need a clear inactive / active / past_due / canceled / trial-like state model even if trial is not in PRD

### 4.2 Score management system
Requirements:
- Users submit their last 5 golf scores
- Score range: 1–45 in Stableford format
- Each score must include a date
- Only latest 5 scores are retained
- New score replaces the oldest automatically
- Scores shown in reverse chronological order
- Only one score entry per date
- Duplicate scores for same date are not allowed
- Existing score for a date may only be edited or deleted. fileciteturn0file0

Build implications:
- Need unique constraint on `(userId, scoreDate)`
- Need rolling-window logic of max 5 records per user
- Need deterministic ordering by date desc and createdAt desc
- Need server-side validation, not just UI validation

### 4.3 Draw and reward system
Requirements:
- Draw types:
  - 5-number match
  - 4-number match
  - 3-number match
- Draw logic options:
  - Random generation
  - Algorithmic weighted by user score frequency
- Monthly cadence
- Admin can publish draw results
- Simulation / pre-analysis before official publish
- Jackpot rollover if no 5-match winner. fileciteturn0file0

Build implications:
- Need a draw engine service
- Need a simulation mode with dry-run output
- Need a published vs draft state for draws
- Need deterministic audit logs for each draw run

### 4.4 Prize pool logic
Requirements:
- Fixed percentage of subscription revenue goes into prize pool
- Split:
  - 5-match: 40% and rollover eligible
  - 4-match: 35%
  - 3-match: 25%
- Auto-calculation based on active subscriber count
- Equal split among multiple winners in same tier
- Unclaimed 5-match jackpot carries forward. fileciteturn0file0

Build implications:
- Need a prize pool ledger per month
- Need payout calculation service
- Need carry-forward balance
- Need auditability for every value

### 4.5 Charity system
Requirements:
- User selects a charity at signup
- Minimum contribution: 10% of subscription fee
- Optional higher contribution percentage
- Independent donation option not tied to gameplay
- Charity directory with search and filter
- Charity profile with description, images, upcoming events
- Featured charity section on homepage. fileciteturn0file0

Build implications:
- Need charity entities and rich media support
- Need configurable contribution percentage
- Need fundraising / donation separation from prize logic
- Need homepage CMS-like spotlight content

### 4.6 Winner verification system
Requirements:
- Only winners go through verification
- Proof upload: screenshot of scores from golf platform
- Admin approves or rejects
- Payment states: pending → paid. fileciteturn0file0

Build implications:
- Need file upload storage
- Need review queue for admins
- Need payout status transitions
- Need rejection reasons and re-submission flow

### 4.7 User dashboard
Must show:
- Subscription status
- Renewal date
- Score entry and edit interface
- Selected charity and contribution percentage
- Participation summary
- Winnings overview and payment status. fileciteturn0file0

### 4.8 Admin dashboard
Must support:
- User management
- Draw management
- Charity management
- Winners management
- Reports and analytics. fileciteturn0file0

### 4.9 UI / UX requirements
The product must:
- Not look like a traditional golf site
- Feel emotional, clean, modern, and motion-enhanced
- Lead with charity and impact, not sport
- Avoid golf clichés like fairways, plaid, and club imagery as the main language
- Have a strong homepage that explains what it does, how users win, and how charity works
- Use subtle transitions and micro-interactions
- Make the subscribe CTA prominent and persuasive. fileciteturn0file0

### 4.10 Technical requirements
Requirements:
- Mobile-first, fully responsive
- Fast performance
- Secure authentication using JWT or session-based auth
- HTTPS enforced
- Email notifications for system updates, draw results, and winner alerts. fileciteturn0file0

### 4.11 Scalability requirements
Must support:
- Multi-country expansion
- Teams / corporate accounts later
- Future campaign module
- Mobile app friendly codebase structure. fileciteturn0file0

### 4.12 Delivery requirements
Must deliver:
- Live website
- User panel with test credentials
- Admin panel with test credentials
- Database and backend schema
- Clean source code
- New Vercel account
- New Supabase project
- Proper env configuration. fileciteturn0file0

---

## 5) Recommended tech decision: React or Next.js?

### Recommendation: use Next.js for this assignment

Why:
- React is the UI library, while Next.js is a React framework for full-stack web apps. React’s docs describe it as a library for building user interfaces, and Next.js describes itself as a React framework with extra production features and optimizations. citeturn241463search0turn241463search1turn241463search4
- The PRD includes public pages, authenticated dashboards, admin tools, and server-backed workflows, so you benefit from a framework that handles routing, server rendering, and production structure out of the box. Next.js App Router uses React features like Server Components, Suspense, and Server Functions. citeturn241463search8turn241463search17turn241463search20
- Next.js documentation explicitly recommends fetching data on the server whenever possible for better access to backend resources and improved app structure. citeturn241463search2turn241463search23

When plain React is enough:
- Use plain React only if the assignment were just a frontend SPA with a separate backend already decided and no need for server rendering, server actions, or integrated routing. That is not this PRD’s shape.

Practical conclusion:
- Use Next.js for the frontend.
- Keep your backend logic in Next.js route handlers/server actions if you want one repo.
- If you prefer a cleaner separation, keep a Node/Express API as a separate service and still use Next.js for the UI.
- For this PRD, Next.js is the better fit.

---

## 6) Suggested production architecture

## Option A — Best fit for this PRD
- Frontend: Next.js
- Backend: Next.js route handlers or separate Node.js API
- Database: Supabase Postgres
- Auth: Supabase Auth or custom JWT/session auth
- File storage: Supabase Storage
- Payments: Stripe
- Email: Resend, SendGrid, or similar
- Hosting: Vercel
- Background jobs: cron / queue / scheduled functions

Why this is strong:
- Fast to deliver
- Great for dashboards and public pages
- Clean fit for admin workflows and server-side validation
- Easier deployment for a sample assignment

## Option B — Classic separated backend
- Frontend: Next.js
- API: Node.js + Express / NestJS
- Database: Postgres or MongoDB
- Auth: JWT + refresh tokens
- Hosting: Vercel + separate API host

Why use this:
- Better if you want to showcase backend engineering depth
- Good if you expect heavy business logic and future mobile app reuse

### My recommendation for this assignment
Use **Next.js + Supabase + Stripe** unless the evaluator explicitly wants a separate API server. This matches the PRD’s delivery constraints and keeps the implementation realistic and fast. fileciteturn0file0

---

## 7) Data model blueprint

### Users
Fields:
- id
- name
- email
- phone
- role: public | subscriber | admin
- status
- selectedCharityId
- charityContributionPercent
- createdAt
- updatedAt

### Subscription
Fields:
- id
- userId
- plan: monthly | yearly
- provider
- providerCustomerId
- providerSubscriptionId
- status
- startDate
- renewalDate
- cancelAtPeriodEnd
- lastPaymentAt
- nextBillingAt

### Scores
Fields:
- id
- userId
- scoreDate
- scoreValue
- createdAt
- updatedAt

Constraints:
- Unique `(userId, scoreDate)`
- Max 5 scores per user
- Ordered by scoreDate desc

### Charity
Fields:
- id
- name
- slug
- description
- images
- category
- featured
- active
- events
- createdAt

### Draw
Fields:
- id
- month
- mode: random | algorithmic
- status: draft | simulated | published
- generatedNumbers
- resultSummary
- jackpotRolledOver
- publishedAt

### Winner
Fields:
- id
- userId
- drawId
- tier: 5 | 4 | 3
- matchCount
- payoutAmount
- verificationStatus: pending | approved | rejected
- payoutStatus: pending | paid
- proofImageUrl
- adminNotes

### Prize pool ledger
Fields:
- id
- month
- activeSubscriberCount
- totalSubscriptionRevenue
- poolAmount
- tier5Amount
- tier4Amount
- tier3Amount
- rolloverAmount

### Notifications
Fields:
- id
- userId
- type
- title
- body
- readAt
- createdAt

---

## 8) Business rules and validation rules

### Subscription rules
- No full access without an active subscription
- Yearly plan should be discounted relative to monthly
- Subscription status should be checked on authenticated requests
- Expired or canceled subscriptions should be blocked from score edits and protected actions

### Score rules
- Only one score per date
- Score range must be 1–45
- Only five scores stored per user
- New score beyond limit removes the oldest one
- Latest by date takes priority, not just creation time

### Draw rules
- Draw happens once per month
- Result should be reproducible or auditable
- Simulation must not publish live results
- Jackpot only rolls over for unclaimed 5-match tier

### Charity rules
- Minimum 10% contribution
- User may increase contribution voluntarily
- User must always have a selected charity unless the spec allows a standalone donation flow
- Donation flow must not interfere with draw winnings

### Winner rules
- Only qualifying winners enter verification
- Admin must approve proof before payout
- Payment state must clearly move from pending to paid

---

## 9) End-to-end flows

### 9.1 Visitor to subscriber flow
1. Open homepage
2. Understand platform and charity impact
3. View charity listings
4. Choose plan
5. Sign up / log in
6. Pay through Stripe
7. Select charity
8. Land in dashboard

### 9.2 Score entry flow
1. Subscriber opens dashboard
2. Adds score with date
3. Server validates uniqueness and range
4. Store score
5. If more than 5 scores exist, remove the oldest
6. Refresh dashboard score list

### 9.3 Monthly draw flow
1. System runs monthly job
2. Pull active subscribers and their score histories
3. Run random or algorithmic logic
4. Simulate and verify results
5. Admin reviews and publishes
6. Winners are generated per tier
7. Notifications are sent

### 9.4 Winner payout flow
1. Winner is notified
2. Winner uploads proof
3. Admin verifies
4. Admin approves or rejects
5. If approved, payout is marked paid

### 9.5 Charity contribution flow
1. User selects charity
2. Contribution percentage is saved
3. Subscription split is calculated
4. Charity totals are tracked separately
5. Admin can report totals by month

---

## 10) API surface you will likely need

### Auth
- Sign up
- Sign in
- Sign out
- Session refresh
- Me / current user

### Subscription
- Create checkout session
- Handle Stripe webhook
- Get subscription status
- Cancel subscription
- Resume subscription if applicable

### Scores
- List scores
- Create score
- Update score
- Delete score
- Enforce rolling max-5 logic

### Charities
- List charities
- Search/filter charities
- Get charity details
- Admin create/update/delete charity

### Draws
- Get current draw
- Run simulation
- Generate result draft
- Publish draw
- Archive past draws

### Winners
- List winners
- Upload proof
- Verify proof
- Approve/reject payout
- Mark paid

### Analytics
- Total users
- Total prize pool
- Charity contribution totals
- Draw stats

---

## 11) UI pages to build

### Public site
- Home
- How it works
- Charities listing
- Charity detail
- Pricing / subscription
- Auth pages
- Terms / privacy

### Subscriber area
- Dashboard
- Score entry
- Score history
- Charity selection
- Participation / winnings
- Notifications
- Profile settings

### Admin area
- Admin dashboard
- Users
- Subscriptions
- Draw management
- Charity management
- Winners / payouts
- Reports

---

## 12) Suggested component structure

- `app/`
- `components/`
- `features/`
- `lib/`
- `server/`
- `db/`
- `types/`
- `emails/`
- `middleware.ts`

Feature-based groupings:
- `features/auth`
- `features/subscription`
- `features/scores`
- `features/charities`
- `features/draws`
- `features/winners`
- `features/admin`
- `features/notifications`

---

## 13) Implementation order

### Phase 1 — foundation
- Project setup
- Database schema
- Auth
- Layout and routing
- Role-based access control

### Phase 2 — monetization
- Stripe plans
- Subscription webhook sync
- Access gating
- Billing state UI

### Phase 3 — score engine
- Score CRUD
- Validation
- Rolling 5-score behavior
- Dashboard score cards

### Phase 4 — charity system
- Charity CRUD
- Search/filter
- Charity selection
- Contribution calculation

### Phase 5 — draw engine
- Monthly job
- Random and algorithmic modes
- Simulation
- Publish flow
- Winner generation

### Phase 6 — verification and payouts
- Proof upload
- Admin review
- Payout status
- Winner notifications

### Phase 7 — admin and analytics
- User management
- Subscription management
- Reports
- Audit logs

### Phase 8 — polish and deployment
- Responsive refinement
- Motion and UX
- Email templates
- Error states
- Production deploy

---

## 14) Edge cases to handle

- User tries to add duplicate score on same date
- User has more than 5 scores
- Subscription expires during a protected action
- Stripe webhook arrives late
- Draw simulation differs from published result
- No winners in 5-match tier
- Multiple winners in same tier
- Winner does not upload proof
- Admin rejects proof
- Charity becomes inactive after user selected it
- User switches charity after already participating
- Network failure during checkout or score save
- Admin publishes draw accidentally without validation

---

## 15) Testing checklist

### Authentication
- Signup
- Login
- Logout
- Role-based access

### Subscription
- Monthly plan
- Yearly plan
- Payment success
- Payment failure
- Renewal
- Cancellation
- Expired subscription gating

### Scores
- Create score
- Edit score
- Delete score
- Duplicate date rejection
- 5-score rolling logic

### Draws
- Random mode
- Algorithmic mode
- Simulation mode
- Publish mode
- Jackpot rollover

### Charity
- Search and filter
- Selection
- Minimum contribution validation
- Donation calculation

### Winners
- Proof upload
- Admin review
- Approve / reject
- Mark paid

### UX
- Mobile responsive
- Desktop responsive
- Loading states
- Empty states
- Error states

---

## 16) Recommended stack for this assignment

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or similar
- React Hook Form + Zod

### Backend / data
- Supabase Postgres
- Supabase Auth or custom auth
- Supabase Storage
- Stripe
- Email service
- Cron or scheduled job runner

### Optional if you want a more backend-heavy showcase
- Node.js + Express or NestJS API
- Prisma ORM
- Postgres

---

## 17) Final recommendation for the choice you asked about

Use **Next.js**, not plain React, for this PRD.

Reason:
- This is not just a UI. It is a full product with auth, payments, dashboards, and server-side business rules.
- Next.js gives you routing, server-backed rendering, and a stronger production structure out of the box. React alone is just the UI layer. citeturn241463search0turn241463search1turn241463search8
- The PRD explicitly needs secure access control, backend validation, admin operations, and scalable deployment, which aligns better with Next.js. fileciteturn0file0

---

## 18) Build goal for Cursor

The first Cursor prompt should be:

> Build a production-ready Next.js full-stack app for the Digital Heroes PRD. Implement role-based auth, subscription billing, rolling golf score storage, charity selection, monthly draw engine, winner verification, admin dashboard, analytics, email notifications, and responsive emotional UI. Use clean modular architecture, typed server validation, and database-backed business rules.

---

## 19) Suggested product positioning

This app should feel like:
- Impact-first
- Modern and premium
- Calm and trustworthy
- Motion-rich but not flashy
- More like a cause-driven fintech/community product than a sports site

Avoid:
- Golf-swing visuals as the main theme
- Plaid backgrounds
- Traditional clubhouse imagery
- Busy sports branding

Lead with:
- Charity
- Monthly participation
- Prize excitement
- Trust and transparency

---

## 20) Summary

This PRD describes a charity-linked golf subscription platform with score tracking, prize draws, and admin-controlled payouts. The build needs subscription logic, rolling score constraints, a monthly draw engine, charity management, winner verification, analytics, and a modern emotional UI. The strongest implementation choice is Next.js on the frontend with Supabase, Stripe, and server-side business logic.

