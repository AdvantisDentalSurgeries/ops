# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Status

This project is currently at the **design/architecture stage** — no implementation code exists yet. All source files are documentation (requirements, domain analysis, architecture plans, UML diagrams). Implementation has not started.

See `architecture/architecture.md` for the full technical plan and intended implementation order.

## Planned Commands

Once implementation begins, the project will use a `backend/` and `frontend/` monorepo layout with these commands:

**Backend** (`backend/`)

```bash
npm run dev          # start Express server with tsx (hot reload)
npm run build        # tsc compile
npm run test         # vitest
npm run test -- path/to/file.test.ts   # run a single test file
```

**Frontend** (`frontend/`)

```bash
npm run dev    # Vite dev server
npm run build  # production build
npm run lint   # ESLint
```

## Architecture Overview

**Pattern**: Layered monolith (REST API + SPA), no microservices.

**Stack**:
| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + React Router |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB via Mongoose |
| Auth | Custom JWT (bcryptjs + jsonwebtoken) validated in Express middleware |
| Email | Nodemailer (SMTP) or Resend |

**Three user roles**: `OFFICE_MANAGER`, `DENTIST`, `PATIENT` — each gets its own frontend portal with separate route guards enforced via `AuthContext` (JWT role claim).

**Request lifecycle**:

1. User authenticates via `POST /api/auth/login` → receives JWT signed with `JWT_SECRET`
2. Frontend sends JWT as `Authorization: Bearer <token>` on all API requests
3. Express middleware verifies JWT, extracts role, attaches to `req.user`
4. Route handler delegates to a service function
5. Service enforces business rules, then calls Mongoose for DB operations
6. Email service fires on appointment confirmation/cancellation

## Domain Model & Business Rules

Six core entities: `User`, `Surgery`, `Dentist`, `Patient`, `Appointment`, `AppointmentRequest`, `Bill`.

Key relationships:

- `User` → `Dentist` or `Patient` (1:1 via `userId`)
- `Surgery` → `Dentist` (1:many)
- `Dentist` → `Appointment` (1:many)
- `Appointment` → `Bill` (1:1, optional)

**Critical business constraints** (must be enforced in the service layer, not just the DB):

- A dentist may have at most **5 appointments per week** (FR15)
- A patient with an **unpaid bill** cannot make a new appointment request (FR16)

Mongoose models live at `backend/src/models/`. See `analysis.md` (FR1–FR16) for the full functional requirements and `architecture/diagram.md` for Mermaid ER and sequence diagrams.

## Key Documentation Files

| File                           | Contents                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `spec.md`                      | Original problem statement                                        |
| `analysis.md`                  | Functional requirements (FR1–FR16) and domain class descriptions  |
| `architecture/architecture.md` | Tech stack rationale, API design, auth flow, implementation order |
| `architecture/diagram.md`      | Mermaid diagrams: system overview, request sequence, ER diagram   |
| `docs/uml.md`                  | PlantUML source for domain UML class diagram                      |

## Planned API Surface

All routes prefixed `/api/`.

| Method | Path                               | Roles                   |
| ------ | ---------------------------------- | ----------------------- |
| POST   | `/api/auth/register`               | OFFICE_MANAGER          |
| GET    | `/api/dentists`                    | OFFICE_MANAGER          |
| GET    | `/api/patients`                    | OFFICE_MANAGER          |
| GET    | `/api/appointments`                | all                     |
| POST   | `/api/appointments`                | OFFICE_MANAGER          |
| PUT    | `/api/appointments/:id/cancel`     | DENTIST, PATIENT        |
| PUT    | `/api/appointments/:id/reschedule` | DENTIST, PATIENT        |
| POST   | `/api/requests`                    | PATIENT                 |
| GET    | `/api/bills/:patientId`            | PATIENT, OFFICE_MANAGER |
| PUT    | `/api/bills/:id/pay`               | OFFICE_MANAGER          |

## Environment Variables

The backend requires a `.env` (not committed) — see `backend/.env.example`. Key variables:

- `MONGO_DB_URL` — MongoDB connection string (Atlas or local)
- `JWT_SECRET` — secret used to sign/verify JWTs
- `SMTP_*` / `EMAIL_FROM` — email delivery credentials
- `PORT` — server port (default 3000)
