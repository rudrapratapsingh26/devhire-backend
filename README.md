# DevHire — Backend

Full-stack AI-powered hiring platform. Companies post jobs, candidates apply with AI-scored resumes, and an admin layer approves companies and oversees the platform.

This is the backend API: Node.js + Express + PostgreSQL (Prisma) + JWT/Google auth + Groq-powered AI features.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Setup](#setup)
- [Authentication](#authentication)
- [AI Integration](#ai-integration)
- [File Uploads](#file-uploads)
- [API Reference](#api-reference)
- [Seed Data](#seed-data)
- [Known Issues Fixed](#known-issues-fixed-build-log)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js (ESM — `import`/`export` throughout) |
| Framework | Express |
| Database | PostgreSQL, hosted on Neon |
| ORM | Prisma v7 (driver adapter pattern — `@prisma/adapter-pg`) |
| Auth | JWT (access + refresh rotation) + Google OAuth via Passport.js |
| AI | Groq API — `llama-3.1-8b-instant` (resume scoring, cover letters) |
| File storage | Cloudinary (resumes as raw PDFs, company logos as images) |
| Email | Resend (password reset emails) |
| PDF parsing | `unpdf` (ESM-native, replaced `pdf-parse`) |
| Dev tooling | nodemon |

---

## Project Structure

```
devhire-backend/
├── app.js                      # Express app: middleware, routes, error handler
├── index.js                    # Server entry point (listens on PORT)
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── candidate.controller.js
│   │   ├── company.controller.js
│   │   ├── admin.controller.js
│   │   ├── job.controller.js
│   │   ├── application.controller.js
│   │   └── bookmark.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── candidate.routes.js
│   │   ├── company.routes.js
│   │   ├── admin.routes.js
│   │   ├── job.routes.js
│   │   ├── application.routes.js
│   │   └── bookmark.routes.js
│   ├── middleware/
│   │   ├── verifyJWT.js         # Validates Bearer token, attaches req.user
│   │   └── checkRole.js         # Role gate (CANDIDATE / COMPANY / ADMIN)
│   ├── database/
│   │   └── db.js                # Prisma client (adapter pattern). Exports default + named { db }
│   └── utils/
│       ├── api-errors.js        # ApiError class
│       ├── api-response.js      # ApiResponse class — (statusCode, data, message)
│       ├── async-handler.js     # asyncHandler wrapper for controllers
│       ├── gemini.js            # AI calls (currently routed through Groq SDK)
│       ├── cloudinary.js        # Multer storage configs (disk → Cloudinary)
│       ├── email.js             # Resend integration
│       └── passport.js          # Google OAuth strategy
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js                  # Dummy data: 2 companies, 10 jobs, 4 test accounts
└── package.json
```

**Conventions used throughout the codebase:**
- All controllers import the Prisma client as `db`, not `prisma` — `import { db } from "../database/db.js"`
- Every controller wraps logic in `asyncHandler`, throws `ApiError(statusCode, message)`, and returns `new ApiResponse(statusCode, data, message)`
- Commits follow Conventional Commits — `feat`, `fix`, `chore`, `docs`, `refactor`

---

## Database Schema

Defined in `prisma/schema.prisma`, PostgreSQL via Neon.

**User**
`id`, `fullName`, `email`, `password` (hashed), `role` (`ADMIN` / `COMPANY` / `CANDIDATE`), `googleId`, `resetToken`, `resetTokenExpiry`, `createdAt`

**Company**
`id`, `userId`, `name`, `description`, `industry`, `size`, `website`, `logoUrl`, `status` (`PENDING` / `APPROVED` / `REJECTED`), `createdAt`

**CandidateProfile**
`id`, `userId`, `headline`, `location`, `bio`, `skills` (`String[]`), `experience` (`Json`), `education` (`Json`), `resumeUrl`, `resumeFileName`, `updatedAt`

**Job**
`id`, `companyId`, `title`, `description`, `requirements`, `location`, `salaryRange`, `jobType` (`FULL_TIME` / `PART_TIME` / `CONTRACT` / `REMOTE` / `INTERNSHIP`), `experienceLevel` (`ENTRY` / `JUNIOR` / `MID` / `SENIOR`), `deadline`, `status` (e.g. `ACTIVE`), `createdAt`

**Application**
`id`, `jobId`, `candidateId`, `resumeUrl`, `coverLetter`, `aiScore`, `status` (`APPLIED` / `REVIEWING` / `ACCEPTED` / `REJECTED`), `appliedAt`

**BookmarkedJob**
`id`, `userId`, `jobId`, `createdAt` — unique on `(userId, jobId)`

**RefreshToken**
`id`, `userId`, `token`, `expiresAt`, `createdAt` — unique on `token`; old tokens for a user are deleted before a new one is issued (rotation)

---

## Environment Variables

```env
# Database
DATABASE_URL=your_neon_postgres_connection_string

# JWT
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=7d

# Sessions (required by passport)
SESSION_SECRET=your_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI — Groq
GROQ_API_KEY=your_groq_key

# File storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Email
RESEND_API_KEY=your_resend_key

# CORS / redirects
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

PORT=8000
```

> In production (Render), set `CLIENT_URL` and `FRONTEND_URL` to the deployed Vercel URL — CORS is configured with `credentials: true`, so the origin must be explicit, never `*`.

---

## Setup

```bash
# install dependencies
npm install

# push schema to your database (use this over migrate during early development)
npx prisma db push

# optional — seed dummy companies, jobs, and test accounts
node prisma/seed.js

# run dev server with nodemon
npm run dev
```

Server runs on `http://localhost:8000`. Health check at `GET /health`.

---

## Authentication

- **Register/Login** issue an access token (short-lived, default `1d`) and a refresh token (default `7d`, stored in the `RefreshToken` table).
- **Token rotation**: on refresh, the old token is deleted and a new pair is issued. On login, any existing refresh tokens for that user are deleted first (single active session per user).
- **Protected routes**: `verifyJWT` middleware reads the `Authorization: Bearer <token>` header, verifies it, and fetches the user via `db.user.findUnique` with a `select` limited to `id, fullName, email, role`. This is attached to `req.user`.
- **Role gating**: `checkRole("CANDIDATE")` (or `"COMPANY"` / `"ADMIN"`) runs after `verifyJWT` to restrict a route to one role.
- **Google OAuth**: handled via Passport's Google strategy (`src/utils/passport.js`). On success, the user is redirected to `${FRONTEND_URL}/auth/google/success` with the access token and user object in the query string.
- **Forgot/reset password**: a random token + 1-hour expiry is stored on the user record, and a reset link is emailed via Resend.

---

## AI Integration

AI calls live in `src/utils/gemini.js` (filename kept for historical reasons — internals now call the **Groq** SDK with `llama-3.1-8b-instant`, after Gemini's free-tier quota proved too restrictive for active testing).

Two functions:
- `scoreResume(resumeText, jobDescription)` → returns `{ score, strengths, weaknesses, summary }` as parsed JSON
- `generateCoverLetter(resumeText, jobDescription, companyName)` → returns a 3-paragraph cover letter string

Resume text is extracted server-side from the uploaded PDF using `unpdf` (`extractText`) before being passed to either function.

---

## File Uploads

Two Multer configurations are used depending on the route:

- **`uploadResume` (Cloudinary storage)** — used for profile resume uploads (`/candidate/profile`), where the file should persist and be linked from `CandidateProfile.resumeUrl`.
- **`memoryUpload` (memory storage)** — used for the resume scorer (`/candidate/score-resume`), since that file is only parsed in-memory for AI scoring and never needs to be saved.

Company logos are uploaded as images to Cloudinary; resumes are uploaded as `resource_type: raw` PDFs.

---

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | – | Register (`fullName`, `email`, `password`, `role?`) |
| POST | `/login` | – | Login → `{ user, accessToken, refreshToken }` |
| POST | `/logout` | – | Invalidate a refresh token |
| POST | `/refresh` | – | Exchange refresh token for new access/refresh pair |
| POST | `/forgot-password` | – | Send reset link via email |
| POST | `/reset-password` | – | Reset password with token |
| GET | `/google` | – | Begin Google OAuth flow |
| GET | `/google/callback` | – | OAuth callback → redirects to frontend with token |

### Candidate — `/candidate` (role: CANDIDATE)

| Method | Path | Description |
|---|---|---|
| POST | `/profile` | Create candidate profile (multipart, optional resume) |
| GET | `/profile` | Get current user's profile |
| PUT | `/profile` | Update profile (multipart, optional resume replace) |
| POST | `/score-resume` | Upload PDF (memory) + optional `jobDescription` → AI score |
| POST | `/generate-cover-letter` | `{ jobTitle, company, jobDescription }` → AI cover letter |

### Jobs — `/jobs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | – | List jobs. Query: `title`, `location`, `jobType`, `experienceLevel`, `status`, `page`, `limit` |
| GET | `/:id` | – | Single job with company details |
| POST | `/` | COMPANY | Create a job under the authenticated company |
| PUT | `/:id` | COMPANY (owner) | Update a job |
| DELETE | `/:id` | COMPANY (owner) | Delete a job |
| GET | `/company/mine` | COMPANY | Jobs posted by the authenticated company, with applicant counts |

### Applications — `/applications`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/:jobId/apply` | CANDIDATE | Apply with resume PDF (multipart). Triggers AI scoring; optional `generateCover: "true"` for an AI cover letter |
| GET | `/my` | CANDIDATE | All applications for the current candidate |
| GET | `/job/:jobId` | COMPANY (owner) | Applicants for a job, sorted by AI score descending |
| PATCH | `/:id/status` | COMPANY (owner) | Update status — `APPLIED` / `REVIEWING` / `ACCEPTED` / `REJECTED` |
| DELETE | `/:id` | CANDIDATE (owner) | Withdraw an application (also removes the resume from Cloudinary) |

### Bookmarks — `/bookmarks` (role: CANDIDATE)

| Method | Path | Description |
|---|---|---|
| GET | `/` | List bookmarked jobs with job + company details |
| POST | `/:jobId` | Bookmark a job |
| DELETE | `/:jobId` | Remove a bookmark |

### Company — `/company` (role: COMPANY)

Registration, profile, logo upload, and settings for the authenticated company account.

### Admin — `/admin` (role: ADMIN)

Platform dashboard stats, and management views for companies (approve/reject), candidates, and jobs.

**Response shape** — every endpoint returns `ApiResponse`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": { "...": "payload" },
  "message": "..."
}
```
Errors return:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "..."
}
```

---

## Seed Data

`node prisma/seed.js` wipes existing data and creates 2 approved companies, 10 jobs split across them, 1 admin, and 1 candidate with a profile.

| Role | Email | Password |
|---|---|---|
| Admin | admin@devhire.com | admin123 |
| Company | hr@techcorp.com | company123 |
| Company | hr@startupxyz.com | company123 |
| Candidate | candidate@devhire.com | candidate123 |

---

## Known Issues Fixed (build log)

A running log of real bugs hit during development — kept here since they tend to resurface after refactors:

- **CORS blocked with credentials** — `cors()` defaulting to `Access-Control-Allow-Origin: *` is incompatible with `withCredentials: true` on the frontend. Fixed by setting an explicit `origin` (via `CLIENT_URL`) and `credentials: true`.
- **`verifyJWT` selecting `name` instead of `fullName`** — silently broke every protected route with a Prisma validation error, since the schema field is `fullName`.
- **`import prisma from db.js` instead of `import { db }`** — `db.js` only exports a named `db` (plus a default), so several controllers (`job`, `bookmark`, `application`) using a default `prisma` import were calling Prisma methods on the wrong object.
- **`pdf-parse` incompatible with ESM** — `import pdfParse from "pdf-parse"` throws `does not provide an export named 'default'` under Node's ESM loader. Replaced entirely with `unpdf`, which is ESM-native.
- **`company.companyName` vs `company.name`** — the schema field is `name`; several `select`/`include` blocks across `job`, `application`, and `bookmark` controllers referenced a nonexistent `companyName` field.
- **Job `status` enum mismatch** — seed script used `"OPEN"`, schema enum expects `"ACTIVE"`.
- **Refresh token unique constraint violations** — fixed by deleting existing refresh tokens for a user before creating a new one (`db.refreshToken.deleteMany({ where: { userId } })`).
- **Prisma migration enum conflicts** — resolved during early schema iteration with `prisma db push --force-reset` (development only — destructive).
- **Gemini free-tier quota (`429 Too Many Requests`, limit: 0)** — the free tier was unusable for iterative testing. Replaced with Groq (`llama-3.1-8b-instant`), which has a much more workable free rate limit.

---

## Deployment

- **Backend** → Render. Set all environment variables above in the Render dashboard; set `CLIENT_URL` / `FRONTEND_URL` to the deployed Vercel URL.
- **Database** → Neon (PostgreSQL), already cloud-hosted — no separate deployment step.
- **Frontend** → Vercel (see frontend README).

After deploying, update the frontend's `VITE_API_URL` to the Render backend URL, and re-deploy the frontend.
