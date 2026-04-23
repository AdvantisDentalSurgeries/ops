# dental-surgery-ops — Backend

![Tests](https://github.com/AdvantisDentalSurgeries/ops/actions/workflows/backend-ci.yml/badge.svg)
![Build](https://github.com/AdvantisDentalSurgeries/ops/actions/workflows/backend-build.yml/badge.svg)

Express + TypeScript REST API backed by MongoDB. Serves the office manager, dentist, and patient portals via JWT-authenticated routes.

## Prerequisites

- Node.js 20+
- MongoDB (Atlas or local)

## Setup

```bash
cp .env.example .env   # fill in values (see Environment variables below)
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output from `dist/` |
| `npm test` | Run unit and integration tests (vitest) |
| `npm run seed:demo` | Seed the database with demo data |

## Environment variables

Copy `.env.example` and set the following:

| Variable | Description |
|----------|-------------|
| `MONGO_DB_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app password |
| `EMAIL_FROM` | From address used in outgoing emails |
| `PORT` | Server port (default `3000`) |

## API documentation

Interactive API docs are served by Swagger UI at `http://localhost:<PORT>/api-docs/` (e.g. `http://localhost:3030/api-docs/` with the default `.env`).

The raw OpenAPI 3.0 spec is available as JSON at `/api-docs.json`.

## API

All routes are prefixed `/api/`.

| Method | Path | Roles |
|--------|------|-------|
| POST | `/api/auth/register` | OFFICE_MANAGER |
| GET | `/api/dentists` | OFFICE_MANAGER |
| GET | `/api/patients` | OFFICE_MANAGER |
| GET | `/api/appointments` | all |
| POST | `/api/appointments` | OFFICE_MANAGER |
| PUT | `/api/appointments/:id/cancel` | DENTIST, PATIENT |
| PUT | `/api/appointments/:id/reschedule` | DENTIST, PATIENT |
| POST | `/api/requests` | PATIENT |
| GET | `/api/bills/:patientId` | PATIENT, OFFICE_MANAGER |
| PUT | `/api/bills/:id/pay` | OFFICE_MANAGER |
