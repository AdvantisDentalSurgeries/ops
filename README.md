# Dental Surgery Operations System

Dental surgery operations app with an Express + MongoDB backend and a React frontend for office managers, dentists, and patients.

## Project layout

- `backend/` — Express API, Mongoose models, services, and tests
- `frontend/` — React SPA for the three user roles
- `analysis.md` — Functional requirements (FR1-FR16)
- `architecture/architecture.md` — Technical architecture and implementation notes
- `architecture/diagram.md` — Mermaid diagrams
- `docs/uml.md` — PlantUML domain model

## Demo seed data

The backend includes a demo seed script that creates:

- 1 office manager
- 3 surgeries
- 4 dentists
- 6 patients
- 10 appointments
- 4 appointment requests
- 3 bills

It also sets up a few useful demo scenarios:

- one dentist already at the 5-appointments-per-week limit
- one patient with an unpaid bill
- one patient with a pending online request

Run it from `backend/` after setting `MONGO_DB_URL` in your environment:

```bash
npm run seed:demo
```

The script only removes previously seeded demo users in the `@demo.dental.local` domain and their related records before recreating them.

## Frontend API base URL

The frontend reads its API base URL from `frontend/.env` using `VITE_API_BASE_URL`.

Use `frontend/.env.example` as a starting point:

```bash
VITE_API_BASE_URL=
```

Leave it empty for local development with the Vite `/api` proxy, or set it to a full backend URL such as `https://api.example.com`.
