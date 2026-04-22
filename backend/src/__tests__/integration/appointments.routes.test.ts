import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { verifyToken } from '../../middleware/verifyToken';

vi.mock('../../middleware/verifyToken', () => ({
  verifyToken: vi.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-mgr-1', email: 'mgr@test.com', role: 'OFFICE_MANAGER' };
    next();
  }),
}));

vi.mock('../../lib/prisma', () => ({
  prisma: {
    appointment: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    dentist: { findUnique: vi.fn() },
    patient: { findUnique: vi.fn() },
    bill: { count: vi.fn() },
    appointmentRequest: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('../../services/emailService', () => ({
  sendConfirmationToEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.appointment.findMany as ReturnType<typeof vi.fn>;
const mockCount = prisma.appointment.count as ReturnType<typeof vi.fn>;
const mockCreate = prisma.appointment.create as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.appointment.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.appointment.update as ReturnType<typeof vi.fn>;
const mockDentistFindUnique = prisma.dentist.findUnique as ReturnType<typeof vi.fn>;
const mockPatientFindUnique = prisma.patient.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  // Reset verifyToken to default OFFICE_MANAGER identity
  mockVerifyToken.mockImplementation((req: any, _res: any, next: any) => {
    req.user = { id: 'user-mgr-1', email: 'mgr@test.com', role: 'OFFICE_MANAGER' };
    next();
  });
});

// ─── GET /api/appointments ───────────────────────────────────────────────────

describe('GET /api/appointments', () => {
  it('returns 200 and an array for OFFICE_MANAGER', async () => {
    const fixture = [{ id: 'appt-1', dentistId: 'd1', patientId: 'p1' }];
    mockFindMany.mockResolvedValue(fixture);

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fixture);
  });

  it('returns 200 and empty array when there are no appointments', async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 for a DENTIST and filters by their dentistId', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    mockFindMany.mockResolvedValue([]);

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(mockDentistFindUnique).toHaveBeenCalledWith({
      where: { userId: 'user-dentist-1' },
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dentistId: 'dentist-1' } })
    );
  });

  it('returns 200 and empty array when DENTIST has no profile', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-x', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockDentistFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── POST /api/appointments ──────────────────────────────────────────────────

describe('POST /api/appointments', () => {
  const validBody = {
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    dateTime: '2026-05-01T09:00:00Z',
  };

  const appointmentFixture = {
    id: 'appt-1',
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    patient: { user: { email: 'p@test.com' } },
    dentist: { surgery: {} },
  };

  it('returns 400 when dentistId is missing', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ patientId: 'p1', dateTime: '2026-05-01T09:00:00Z' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when patientId is missing', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ dentistId: 'd1', dateTime: '2026-05-01T09:00:00Z' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when dateTime is missing', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ dentistId: 'd1', patientId: 'p1' });
    expect(res.status).toBe(400);
  });

  it('returns 403 when user role is PATIENT', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-pat-1', email: 'p@test.com', role: 'PATIENT' };
      next();
    });

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 201 and the appointment when booking succeeds', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'appt-1');
  });

  it('returns 400 with the RangeError message when weekly limit is reached', async () => {
    mockCount.mockResolvedValue(5);

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Dentist already has 5 appointments this week');
  });

  it('returns 500 when prisma.appointment.create throws unexpectedly', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/appointments/:id/cancel ───────────────────────────────────────

describe('PUT /api/appointments/:id/cancel', () => {
  const baseAppointment = {
    id: 'appt-1',
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    dentist: { id: 'dentist-1' },
    patient: { id: 'patient-1' },
  };

  it('returns 403 when user is OFFICE_MANAGER (route requires DENTIST or PATIENT)', async () => {
    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(403);
  });

  it('returns 404 when appointment does not exist', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockFindUnique.mockResolvedValue(null);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });

    const res = await request(app).put('/api/appointments/appt-999/cancel');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Appointment not found');
  });

  it('returns 403 when DENTIST does not own the appointment', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-OTHER' });

    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 200 when DENTIST cancels their own appointment', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    mockUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'CANCELLED');
  });

  it('returns 200 when PATIENT cancels their own appointment', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-patient-1', email: 'p@test.com', role: 'PATIENT' };
      next();
    });
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockPatientFindUnique.mockResolvedValue({ id: 'patient-1' });
    mockUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'CANCELLED');
  });
});
