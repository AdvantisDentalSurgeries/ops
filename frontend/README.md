# Dental Surgery Operations System Frontend

This frontend is a React + TypeScript single-page application for the Dental Surgery Operations System. It provides separate role-based experiences for office managers, dentists, and patients while relying on the backend API for authentication, business rules, and data persistence.

## Responsibilities

- Render the login flow and role-aware navigation
- Provide protected routes for the three user portals
- Call the backend REST API for appointments, requests, bills, dentists, patients, surgeries, and auth
- Persist the current authenticated session in local storage
- Redirect users to the correct portal based on their role

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 18 + TypeScript |
| Routing | React Router |
| Build Tool | Vite |
| HTTP Client | Axios |
| Styling | Tailwind CSS |

## Portals and Routes

### Office Manager

- `/om`
- `/om/appointments`
- `/om/requests`
- `/om/dentists`
- `/om/patients`
- `/om/surgeries`
- `/om/bills`

### Dentist

- `/dentist`

### Patient

- `/patient`
- `/patient/bills`
- `/patient/request`

Route access is enforced with `ProtectedRoute`, which only allows the roles expected for each section.

## Authentication Behavior

- Login submits credentials to `POST /api/auth/login`
- The returned JWT is stored in `localStorage`
- Axios attaches the token as `Authorization: Bearer <token>` on API requests
- A `401` response clears local auth state and sends the user back to `/login`

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Main route tree for all portals |
| `src/pages/` | Page-level views for office manager, dentist, and patient flows |
| `src/components/` | Shared UI building blocks |
| `src/contexts/` | Auth context and session state |
| `src/api/` | Feature-specific API helpers |
| `src/lib/` | Shared utilities such as Axios setup, navigation, and formatting |
| `src/types/` | Frontend TypeScript types |

## Prerequisites

- Node.js 20+
- Running backend API

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs on the Vite development server, typically `http://localhost:5173`.

## Environment Variables

The frontend reads `VITE_API_BASE_URL` from `.env`.

```bash
VITE_API_BASE_URL=
```

Recommended local setup:

- Leave it empty for local development so requests stay relative and use the Vite proxy
- Set it to a full URL such as `https://api.example.com` when pointing the app at a deployed backend

When `VITE_API_BASE_URL` is empty, Vite proxies `/api` requests to `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production bundle |
| `npm run lint` | Run ESLint on `src/` |

## Working With the Backend

The frontend expects the backend described in [`../backend/README.md`](../backend/README.md) to be running. The most important integration points are:

- `POST /api/auth/login` for sign-in
- protected `/api/*` routes for appointments, requests, bills, dentists, patients, and surgeries
- JWT-based authorization for portal access and API calls

## Related Documentation

- [`../README.md`](../README.md) for the full monolith overview
- [`../backend/README.md`](../backend/README.md) for API setup and backend commands
- [`../analysis.md`](../analysis.md) for functional requirements
- [`../architecture/diagram.md`](../architecture/diagram.md) for system and domain diagrams
