# LimeSurvey Modern (React + Node.js + Express + PostgreSQL + Prisma)

Modernized LimeSurvey architecture completely migrating the legacy PHP codebase to a clean, scalable JavaScript/TypeScript stack:
- **Frontend**: React 18, Vite, React Router 6, TanStack Query, React Hook Form, Zod, and pure CSS Modules styled with the LimeSurvey `Sea_Green` & `fruity_twentythree` design tokens.
- **Backend API**: Node.js, Express, Prisma ORM, PostgreSQL (unified JSONB responses), bcrypt, JWT in httpOnly cookies, Helmet, CORS, express-rate-limit, and Pino logging.
- **Documentation**: Interactive OpenAPI 3.0 (Swagger UI) at `/api/docs`.
- **Legacy Preservation**: The original PHP codebase is preserved in read-only format under [`/legacy`](./legacy) for reference and audit integrity.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** ≥ 18.x (`node -v`)
- **NPM** ≥ 9.x (`npm -v`)
- **PostgreSQL** ≥ 14.x running locally or via Docker

---

### 1. Installation

Install all root, client, and server dependencies with a single command:

```bash
npm install
```

---

### 2. Environment Variables Configuration

Copy the example environment template to `.env`:

```bash
cp .env.example .env
cp .env server/.env
```

Review and adjust variables in `.env` as needed:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend Express API Port | `5000` |
| `CLIENT_URL` | Frontend client origin (CORS) | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@localhost:5432/limesurvey_modern?schema=public` |
| `LEGACY_DATABASE_URL`| Connection to legacy database for import | `postgresql://user:pass@localhost:5432/limesurvey` |
| `JWT_SECRET` | Secret key for signing auth tokens | *(auto-generated 32+ char key)* |
| `ADMIN_EMAIL` | Initial administrator email | `admin@limesurvey.local` |
| `ADMIN_USERNAME` | Initial administrator username | `admin` |
| `ADMIN_PASSWORD` | Initial administrator password | `AdminPassword123!` |

*(Optional) Start containerized PostgreSQL & pgAdmin:*
```bash
docker compose up -d
```

---

### 3. Database Migration & Automated Seeding

**No web installer required!** Database setup is executed entirely through deterministic CLI commands:

```bash
# Push schema migrations to PostgreSQL
npm run db:migrate

# Seed initial admin user and sample questionnaire
npm run db:seed
```

The seed script creates the first administrator using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`, creates default system parameters, and provisions a demo survey with voter access code `VOTE-DEMO-2026`.

---

### 4. Running the Development Server

Start both the React client and Express API concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Interactive OpenAPI (Swagger)**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🔄 Legacy Database Import

If you have an existing LimeSurvey database (MySQL or PostgreSQL) and wish to migrate users, surveys, questions, and responses:

1. Configure `LEGACY_DATABASE_URL` in `.env`.
2. Run the migration script:
   ```bash
   npm run db:import-legacy
   ```

*Security Note:* Legacy PHP bcrypt password hashes (`$2y$`) are preserved intact. Upon successful first login, the backend automatically verifies and re-hashes them to modern standards without user disruption.

---

## 📐 Project Structure

```text
├── client/                     # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── api/                # Axios API client instance with interceptors
│   │   ├── components/         # Reusable UI (Navbar, SegmentedToggle, ProtectedRoute)
│   │   ├── context/            # AuthContext (JWT) and ToastContext
│   │   ├── pages/              # Landing, Login, Dashboards, Builder, Taking, Stats
│   │   ├── styles/             # design-tokens.css and global.css
│   │   ├── App.jsx             # Router definition
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend API
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL normalized models & JSONB answers
│   │   └── seed.js             # Automated admin and starter survey seeder
│   ├── scripts/
│   │   └── import-legacy.js    # Legacy database importer
│   ├── src/
│   │   ├── config/             # DB, logger, constants
│   │   ├── middleware/         # auth (JWT), role guard, rateLimit, errorHandler
│   │   ├── modules/            # auth, surveys, questions, voters, responses, stats, export
│   │   ├── swagger/            # OpenAPI 3.0 specification
│   │   ├── app.js              # Express app initialization
│   │   └── server.js           # Entry point listening on PORT
│   ├── tests/                  # Vitest + Supertest integration tests
│   └── package.json
│
├── legacy/                     # Original LimeSurvey PHP codebase (read-only reference)
├── e2e/                        # Playwright end-to-end user journeys
├── docker-compose.yml          # Containerized PostgreSQL & pgAdmin
├── design-tokens.md            # Extracted Sea_Green design variables
├── package.json                # Monorepo root workspaces & scripts
└── .env.example                # Canonical environment template
```

---

## 🧪 Testing

Run backend service and API integration tests:
```bash
npm run test:api
```

Run Playwright end-to-end flows:
```bash
npm run test:e2e
```
