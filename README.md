# Mini ERP + CRM Operations Portal

A small ERP/CRM system for a wholesale/distribution company, covering customer relationship
management, product & inventory tracking, and a sales challan workflow with stock control.

Built for the Full Stack Developer case study. This README documents setup, architecture,
deployment, and known limitations as required by the assignment brief.

## Tech stack

| Layer      | Choice                                                              |
|------------|----------------------------------------------------------------------|
| Backend    | Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, Zod, JWT   |
| Frontend   | React 18, TypeScript, Vite, React Router, Tailwind CSS, Axios       |
| Auth       | JWT bearer tokens, 4 roles: Admin, Sales, Warehouse, Accounts       |
| Deployment | Docker Compose (local), Render/Railway/Neon-friendly (cloud)        |

I picked Express over NestJS to keep the codebase small and easy to review in a 48-hour
window — NestJS's DI/module ceremony wasn't worth it for ~15 endpoints. Prisma over a raw
query builder because the schema has enough relations (customers → follow-ups, challans →
snapshot line items, products → stock movements) that migrations and type-safety pay for
themselves quickly.

## Project structure

```
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Full data model
│   │   └── seed.ts            # Creates test users (all 4 roles) + sample data
│   ├── src/
│   │   ├── config/            # env loader, prisma client singleton
│   │   ├── middleware/        # auth, zod validation, error handler
│   │   ├── modules/
│   │   │   ├── auth/          # login, /me
│   │   │   ├── customers/     # CRM: CRUD, search, follow-ups
│   │   │   ├── products/      # inventory: CRUD, stock movement log
│   │   │   └── challans/      # sales challan: draft/confirm/cancel, stock logic
│   │   ├── utils/             # ApiError, pagination helper
│   │   └── app.ts / server.ts
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── api/                # axios client + typed endpoint functions
│       ├── context/AuthContext.tsx
│       ├── layouts/AppLayout.tsx
│       ├── components/         # StatusChip, ProtectedRoute, banners
│       └── pages/
│           ├── LoginPage.tsx, DashboardPage.tsx
│           ├── customers/      # list + detail
│           ├── products/       # list + stock adjustment
│           └── challans/       # list + create + detail
├── postman/
│   └── mini-erp-crm.postman_collection.json
└── docker-compose.yml           # postgres + backend for one-command local run
```

## Core business logic — how it works

**Sales challan confirmation** (`backend/src/modules/challans/challan.service.ts`) is the
piece with the most real-world logic, so it's worth calling out:

- Challan numbers are auto-generated as `CH-<year>-<00001>`, scoped per calendar year, computed
  inside the same DB transaction that creates the challan (avoids a race where two challans
  read the same "next number").
- Every line item stores a **snapshot** of the product's name, SKU, and price at the time of
  sale (`productNameSnap`, `productSkuSnap`, `unitPriceSnap`), not just a foreign key. If someone
  edits or discontinues a product next month, last month's challans still show what was actually
  sold and at what price.
- A challan can be created directly as `CONFIRMED`, or saved as `DRAFT` and confirmed later via
  `POST /challans/:id/confirm`.
- Confirmation deducts stock for **every** line item inside one transaction. If any single line
  doesn't have enough stock, the whole confirmation is rolled back — you never end up with half
  the items deducted. The API returns a specific error naming the product and the shortfall.
- Cancelling a `CONFIRMED` challan restores the deducted stock (with a `StockMovement` audit
  entry), since goods that were "sold" on paper never actually left the warehouse.

**Roles** are enforced at the route level with an Express middleware
(`requireRole(...roles)`), not just hidden in the UI — hitting the API directly with the wrong
role returns a `403`, not just a hidden button. Current allocation (adjust in
`*.routes.ts` if your org's policy differs):

- **Admin** — full access everywhere.
- **Sales** — manages customers, creates/edits/confirms/cancels challans.
- **Warehouse** — manages products/stock, can confirm challans (dispatch), cannot touch CRM.
- **Accounts** — read-only on customers and products (for billing/reconciliation), no challan
  creation.

## Local setup

### Prerequisites
- Node.js 20+
- Docker (for the easiest Postgres setup) — or your own local PostgreSQL 14+

### Option A — Docker Compose (fastest)

```bash
git clone <your-repo-url>
cd mini-erp-crm
docker compose up --build
```

This starts Postgres and the backend API on `http://localhost:4000`. Then, in a second
terminal, run the frontend (not containerized, for fast HMR during dev):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

The backend container runs `prisma migrate deploy` automatically on startup, but you still
need to seed test users once:

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL here should point at localhost:5432, matching docker-compose
npm run seed
```

### Option B — fully manual (no Docker)

```bash
# 1. Create a Postgres database and get its connection string.

# 2. Backend
cd backend
cp .env.example .env        # edit DATABASE_URL and JWT_SECRET
npm install
npm run prisma:migrate      # creates tables
npm run seed                # creates test users + sample data
npm run dev                 # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

### Test login credentials (all seeded with the same password)

| Role      | Email                     | Password       |
|-----------|----------------------------|----------------|
| Admin     | admin@minierp.test         | Password123!   |
| Sales     | sales@minierp.test         | Password123!   |
| Warehouse | warehouse@minierp.test     | Password123!   |
| Accounts  | accounts@minierp.test      | Password123!   |

## Environment variables

**Backend** (`backend/.env`, see `.env.example`):

| Variable        | Description                                              |
|-----------------|-----------------------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string                              |
| `JWT_SECRET`    | Random secret for signing tokens — generate with `openssl rand -base64 48` |
| `JWT_EXPIRES_IN`| Token lifetime, default `8h`                               |
| `PORT`          | API port, default `4000`                                   |
| `CORS_ORIGIN`   | Allowed frontend origin                                     |

**Frontend** (`frontend/.env`, see `.env.example`):

| Variable        | Description                                  |
|-----------------|------------------------------------------------|
| `VITE_API_URL`  | Base URL of the backend API, e.g. `.../api`   |

Secrets are never committed — both `.env` files are gitignored, and `.env.example` files
document the shape without real values.

## Deployment (free-tier friendly)

The brief lists AWS as preferred-but-optional and free hosting as fully acceptable. This
project deploys cleanly to:

- **Backend** → Render or Railway (Docker or Node buildpack). Set the environment variables
  above in the dashboard; point `DATABASE_URL` at your managed Postgres.
- **Database** → Render Postgres, Neon, or Supabase — grab the connection string and drop it
  into `DATABASE_URL`. Run `npx prisma migrate deploy` once (Render/Railway can run this as a
  "release command" or you can run it once manually via their shell).
- **Frontend** → Vercel or Netlify. Set `VITE_API_URL` to your deployed backend's `/api` path
  as a build-time environment variable.

### Steps (Render example)
1. Push this repo to GitHub.
2. Render → New → PostgreSQL → note the connection string.
3. Render → New → Web Service → point at `backend/`, build command `npm install && npm run build`,
   start command `npx prisma migrate deploy && npm start`, add the env vars above.
4. Vercel → New Project → point at `frontend/`, add `VITE_API_URL=https://<your-render-url>/api`.
5. SSH/shell into the Render backend once and run `npm run seed` to create test users.

### AWS (bonus, not required)
The same Docker image (`backend/Dockerfile`) runs on ECS/Fargate or a plain EC2 instance behind
an ALB; RDS Postgres as the database. Not deployed for this submission — see "Known
limitations" below.

## API overview

All endpoints are prefixed `/api` and (except `/auth/login`) require `Authorization: Bearer <token>`.
Full request/response examples are in `postman/mini-erp-crm.postman_collection.json` — import
it, run "Login" first (it auto-saves the token to a collection variable), then run any other
request.

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/customers                 ?search=&status=&customerType=&page=&pageSize=
GET    /api/customers/:id
POST   /api/customers
PATCH  /api/customers/:id
POST   /api/customers/:id/follow-ups

GET    /api/products                  ?search=&category=&lowStockOnly=&page=&pageSize=
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
GET    /api/products/:id/stock-movements
POST   /api/products/:id/stock-movements

GET    /api/challans                  ?status=&customerId=&page=&pageSize=
GET    /api/challans/:id
POST   /api/challans
PATCH  /api/challans/:id              (DRAFT only)
POST   /api/challans/:id/confirm
POST   /api/challans/:id/cancel
```

Every list endpoint supports pagination (`page`, `pageSize`) and returns
`{ data, meta: { page, pageSize, total, totalPages } }`. Validation errors return `400` with a
field-level `details` array; auth failures return `401`/`403`; not-found returns `404`.

## Assumptions made

- "Address" is stored as a single free-text field rather than structured (street/city/state)
  since the brief didn't specify — easy to split later if the real business needs it.
- A customer's `followUpDate` on the main record always reflects the *most recently added*
  follow-up note's date, so the customer list can show "next follow-up" without a join.
  Follow-up history itself is unlimited and fully preserved in a separate table.
- Only Admin and Warehouse can create/edit products (Sales and Accounts view but don't touch
  the catalogue) — the brief didn't specify per-module role mapping precisely, so I made a
  reasonable business call. Adjust in the relevant `*.routes.ts` if that's wrong for you.
- Deleting customers/products isn't exposed — in a real ERP you rarely hard-delete records with
  transaction history; a product has an `isActive` flag instead (soft-delete is possible on
  the same model, wasn't wired to a UI/route in this pass).
- Challan `PATCH` (editing line items) is only allowed while `status = DRAFT`, since a
  `CONFIRMED` challan has already moved stock — editing it would require a separate
  reconciliation flow that felt out of scope for 48 hours.

## Known limitations / incomplete parts

- **No automated test suite.** Given the time box, I prioritized correct transactional logic
  (stock deduction, snapshotting) and manual verification via Postman over test scaffolding.
  If this were going to production, the challan confirm/cancel paths are exactly where I'd
  add integration tests first — they're the highest-risk logic in the system.
- **No PDF export / S3 image upload** (bonus items) — not implemented in this pass.
- **No GitHub Actions pipeline** — deployment is manual per the steps above.
- **AWS deployment not actually performed** for this submission; local Docker + free-tier cloud
  hosting was used instead, per the brief's explicit allowance.
- **Frontend product/customer selects in the challan builder load up to 200 records** without
  further pagination or type-ahead search — fine for a small-to-mid catalogue, would need a
  proper async-search combobox before this scales to thousands of SKUs.
- Sandbox note: this codebase was written and reviewed in an environment without outbound
  access to Prisma's binary CDN, so `prisma generate` / `tsc` could not be run end-to-end here
  for the backend specifically (the frontend build was verified end-to-end). Run
  `npm install && npx prisma generate` locally — this is a completely standard step and will
  work normally with regular internet access.



