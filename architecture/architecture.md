# Architecture: Dental Surgery Ops System

## Pattern

Layered (n-tier) monolith with REST API. A monolith is appropriate here — the domain is well-bounded, the team is small, and microservices complexity is not justified at this scale.

All requests route through Express rather than hitting Supabase directly, so business rules (5 appointments/week limit, unpaid bill blocking) are enforced server-side in one place.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + TypeScript + React Router | Role-based SPA, TypeScript consistency across stack |
| Backend | Node.js + Express + TypeScript | Lightweight, same language as frontend |
| Auth | Supabase Auth + JWT middleware | Managed user accounts, JWT issued by Supabase |
| Database | Supabase (PostgreSQL) | Managed, no infra to maintain |
| ORM | Prisma | TypeScript-native, typed queries, migration management |
| Email | Nodemailer + SMTP or Resend | Appointment confirmation emails |
| Build | tsx (backend dev), Vite (frontend) | Fast dev experience |
| Dev env | Supabase CLI (local) or hosted Supabase project | |

---

## Project Structure

```
dental-surgery-ops/
├── backend/
│   ├── src/
│   │   ├── routes/           # Express routers: appointments.ts, dentists.ts, etc.
│   │   ├── controllers/      # Request/response handlers
│   │   ├── services/         # Business logic (scheduling rules, bill checks)
│   │   ├── middleware/       # verifyToken.ts (validates Supabase JWT + extracts role)
│   │   ├── lib/              # prisma.ts (Prisma client singleton), supabase.ts
│   │   └── types/            # Shared TypeScript interfaces/types
│   ├── prisma/
│   │   └── schema.prisma     # Database schema + migrations
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── src/
│       ├── pages/            # OfficeManagerDashboard, DentistPortal, PatientPortal
│       ├── components/       # Shared UI components
│       ├── services/         # Axios API clients (calls Express backend)
│       └── contexts/         # AuthContext (wraps Supabase session + role)
├── architecture/
│   ├── architecture.md       # This file
│   └── diagram.md            # Architecture diagram
├── .env.example
└── README.md
```

---

## Auth Flow

1. **Login**: Frontend calls `supabase.auth.signInWithPassword()` → Supabase returns JWT
2. **API calls**: Frontend attaches JWT as `Authorization: Bearer <token>` on every request
3. **Middleware**: Express `verifyToken.ts` validates the JWT using the Supabase JWT secret, extracts `user_id` and `role` from claims
4. **Role metadata**: Stored in Supabase `user_metadata` at registration time (set by Office Manager), read in middleware

---

## Domain Model → Prisma Schema

The 6 UML entities map directly to Prisma models and Postgres tables:

```prisma
model User {
  id        String   @id @default(uuid())  // mirrors Supabase auth.users id
  email     String   @unique
  role      Role
  dentist   Dentist?
  patient   Patient?
}

enum Role { OFFICE_MANAGER DENTIST PATIENT }

model Surgery {
  id       String    @id @default(uuid())
  name     String
  address  String
  phone    String
  dentists Dentist[]
}

model Dentist {
  id             String        @id @default(uuid())
  userId         String        @unique
  user           User          @relation(fields: [userId], references: [id])
  specialization String
  surgeryId      String
  surgery        Surgery       @relation(fields: [surgeryId], references: [id])
  appointments   Appointment[]
}

model Patient {
  id           String               @id @default(uuid())
  userId       String               @unique
  user         User                 @relation(fields: [userId], references: [id])
  dateOfBirth  DateTime
  address      String
  appointments Appointment[]
  requests     AppointmentRequest[]
}

model Appointment {
  id        String            @id @default(uuid())
  dentistId String
  dentist   Dentist           @relation(fields: [dentistId], references: [id])
  patientId String
  patient   Patient           @relation(fields: [patientId], references: [id])
  dateTime  DateTime
  status    AppointmentStatus @default(SCHEDULED)
  notes     String?
  bill      Bill?
}

enum AppointmentStatus { SCHEDULED CANCELLED COMPLETED }

model AppointmentRequest {
  id            String      @id @default(uuid())
  patientId     String
  patient       Patient     @relation(fields: [patientId], references: [id])
  requestType   RequestType
  requestedDate DateTime
}

enum RequestType { PHONE ONLINE }

model Bill {
  id            String      @id @default(uuid())
  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  amount        Decimal
  isPaid        Boolean     @default(false)
  dueDate       DateTime
}
```

---

## Key Business Logic (Service Layer)

Business rules live in the service layer — never in controllers.

| Rule | Implementation |
|------|---------------|
| Max 5 appointments/week per dentist | `appointmentService.checkWeeklyLimit(dentistId, date)` — counts Prisma records in ISO week |
| Unpaid bill blocks new requests | `patientService.hasUnpaidBills(patientId)` — checked before creating AppointmentRequest |
| Email on confirmation | `emailService.sendConfirmation(appointment)` — called after appointment saved |
| Role-based route protection | `verifyToken` middleware + `requireRole('OFFICE_MANAGER')` guard function |

---

## API Design (REST)

| Method | Endpoint | Role | FR |
|--------|----------|------|----|
| POST | `/api/auth/register` | OfficeManager | FR1, FR3 |
| GET | `/api/dentists` | OfficeManager | FR2 |
| GET | `/api/patients` | OfficeManager | FR4 |
| GET | `/api/appointments` | All | FR5 |
| POST | `/api/appointments` | OfficeManager | FR7 |
| PUT | `/api/appointments/:id/cancel` | Dentist, Patient | FR9 |
| PUT | `/api/appointments/:id/reschedule` | Dentist, Patient | FR10 |
| POST | `/api/requests` | Patient | FR6 |
| GET | `/api/bills/:patientId` | Patient, OfficeManager | FR14 |
| PUT | `/api/bills/:id/pay` | OfficeManager | FR15 |

---

## Verification Plan

1. **Unit tests**: Vitest + mocked Prisma client for service layer (weekly limit, unpaid bill check)
2. **Integration tests**: Supertest against the Express app with a dedicated test Supabase project
3. **API tests**: Postman/Thunder Client collection covering all endpoints for all 3 roles
4. **Manual E2E**: Register dentist → enroll patient → book appointment → receive confirmation email → cancel → view bill
5. **Constraint tests**: Book 6th appointment in a week (expect 400); request with unpaid bill (expect 403)

---

## Implementation Order

1. Supabase project setup + Prisma schema + `prisma migrate dev`
2. Express app scaffold (TypeScript config, routes wired up, `verifyToken` middleware)
3. Auth flow (Supabase Auth on frontend, JWT verification on backend)
4. Office Manager APIs (dentist/patient registration)
5. Appointment booking + business rule enforcement
6. Email service (Nodemailer)
7. Frontend (auth flow → dashboards → booking UI)
8. Bill management
