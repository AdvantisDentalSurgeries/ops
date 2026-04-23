# Dental Surgery Operations System

Dental Surgery Operations System is a full-stack monolith for managing day-to-day operations across dental surgeries. It combines a React single-page app with an Express REST API so office managers, dentists, and patients can work from the same system while the backend enforces the core business rules.

## What This Project Covers

- Office manager workflows for surgeries, dentists, patients, appointments, requests, and billing
- Dentist workflows for viewing schedules and managing appointment changes
- Patient workflows for viewing appointments, checking bills, and submitting appointment requests
- Server-side enforcement of key rules such as:
  - a dentist may have at most 5 non-cancelled appointments in a week
  - a patient with an unpaid bill cannot create a new appointment request

## Monolith Overview

This repository keeps the whole application in one codebase:

- [`backend/`](backend/README.md) contains the Express + TypeScript API, MongoDB models, business logic, tests, seed scripts, and Swagger docs
- [`frontend/`](frontend/README.md) contains the React + TypeScript SPA for the three user portals
- top-level documentation captures the original requirements, analysis, UML, and architecture notes used to design the system

The frontend and backend are developed separately but live together in the same repository and represent one application.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, React Router, Vite, Axios, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Data | MongoDB with Mongoose |
| Auth | Custom JWT authentication with role-based route protection |
| Email | Nodemailer (SMTP) |
| API Docs | Swagger UI |
| Testing | Vitest and Supertest on the backend |

## User Roles

| Role | Main Responsibilities |
| --- | --- |
| `OFFICE_MANAGER` | Register users, manage surgeries, coordinate appointments, review requests, manage bills |
| `DENTIST` | View schedules, cancel appointments, reschedule appointments |
| `PATIENT` | View appointments, review bills, submit appointment requests |

## Repository Map

| Path | Purpose |
| --- | --- |
| [`backend/`](backend/README.md) | Backend application, API, models, tests, and seed script |
| [`frontend/`](frontend/README.md) | Frontend SPA, role-based routes, UI components, and API clients |
| [`analysis.md`](analysis.md) | Functional requirements and domain analysis |
| [`architecture/architecture.md`](architecture/architecture.md) | Architecture notes and implementation planning |
| [`architecture/diagram.md`](architecture/diagram.md) | Mermaid system and domain diagrams |
| [`docs/uml.md`](docs/uml.md) | UML source for the domain model |
| [`spec.md`](spec.md) | Original project problem statement |

## Quick Start

This repo is not configured as a root workspace package, so install dependencies separately in `backend/` and `frontend/`.

### Prerequisites

- Node.js 20+
- MongoDB instance (Atlas or local)

### 1. Start the Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend defaults to `http://localhost:3000`.

### 2. Start the Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on Vite's local dev server, typically `http://localhost:5173`.

By default, leave `frontend/.env` with an empty `VITE_API_BASE_URL` so the frontend uses the Vite proxy for `/api` requests and forwards them to `http://localhost:3000`.

## Development Commands

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run the compiled backend |
| `npm test` | Run unit and integration tests |
| `npm run seed:demo` | Seed demo users and sample operational data |

See [`backend/README.md`](backend/README.md) for backend-specific details.

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the production bundle |
| `npm run lint` | Run frontend linting |

See [`frontend/README.md`](frontend/README.md) for frontend-specific details.

## Local Environment

### Backend Environment Variables

Defined in [`backend/.env.example`](backend/.env.example):

- `MONGO_DB_URL`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `PORT`

### Frontend Environment Variables

Defined in [`frontend/.env.example`](frontend/.env.example):

- `VITE_API_BASE_URL`

Leave it blank for local development with the built-in Vite proxy, or set it to a full backend URL for deployed environments.

## API and App Entry Points

- Backend API base: `http://localhost:3000/api`
- Backend health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`
- Swagger JSON: `http://localhost:3000/api-docs.json`
- Frontend app: `http://localhost:5173`

## Demo Data

The backend includes a demo seed script that creates surgeries, dentists, patients, appointments, requests, and bills for local testing.

Run it from `backend/`:

```bash
npm run seed:demo
```

The script recreates only demo records in the `@demo.dental.local` domain, then prints sample credentials such as:

- `office.manager@demo.dental.local / DemoPass123!`
- a dentist account for testing schedule workflows
- patient accounts for unpaid-bill and pending-request scenarios

It also sets up demo stories including:

- a dentist already at the weekly appointment limit
- a patient blocked by an unpaid bill
- a patient with an existing pending request

## Where To Go Next

- Start with [`backend/README.md`](backend/README.md) if you want to run or extend the API
- Start with [`frontend/README.md`](frontend/README.md) if you want to run or extend the SPA
- Read [`analysis.md`](analysis.md) and [`spec.md`](spec.md) for the original requirements
- Use [`architecture/diagram.md`](architecture/diagram.md) and [`docs/uml.md`](docs/uml.md) for system and domain references
