import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../middleware/verifyToken';

vi.mock('../../middleware/verifyToken', () => ({
  verifyToken: vi.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-mgr-1', email: 'mgr@test.com', role: 'OFFICE_MANAGER' };
    next();
  }),
}));

vi.mock('../../models/Appointment', () => ({
  Appointment: {
    countDocuments: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../models/Dentist', () => ({
  Dentist: { findOne: vi.fn() },
}));

vi.mock('../../models/Patient', () => ({
  Patient: { findOne: vi.fn() },
}));

vi.mock('../../models/Bill', () => ({
  Bill: { countDocuments: vi.fn() },
}));

vi.mock('../../models/AppointmentRequest', () => ({
  AppointmentRequest: { create: vi.fn(), find: vi.fn() },
}));

vi.mock('../../services/emailService', () => ({
  sendConfirmationToEmail: vi.fn().mockResolvedValue(undefined),
}));

import { Appointment } from '../../models/Appointment';
import { Dentist } from '../../models/Dentist';
import { Patient } from '../../models/Patient';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFind = Appointment.find as ReturnType<typeof vi.fn>;
const mockCountDocuments = Appointment.countDocuments as ReturnType<typeof vi.fn>;
const mockCreate = Appointment.create as ReturnType<typeof vi.fn>;
const mockFindById = Appointment.findById as ReturnType<typeof vi.fn>;
const mockFindByIdAndUpdate = Appointment.findByIdAndUpdate as ReturnType<typeof vi.fn>;
const mockDentistFindOne = Dentist.findOne as ReturnType<typeof vi.fn>;
const mockPatientFindOne = Patient.findOne as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyToken.mockImplementation((req: any, _res: any, next: any) => {
    req.user = { id: 'user-mgr-1', email: 'mgr@test.com', role: 'OFFICE_MANAGER' };
    next();
  });
});

// ─── GET /api/appointments ───────────────────────────────────────────────────

describe('GET /api/appointments', () => {
  it('returns 200 and an array for OFFICE_MANAGER', async () => {
    const fixture = [{ id: 'appt-1', dentistId: 'd1', patientId: 'p1' }];
    mockFind.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue(fixture),
    });

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fixture);
  });

  it('returns 200 and empty array when there are no appointments', async () => {
    mockFind.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([]),
    });

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 for a DENTIST and filters by their dentistId', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockDentistFindOne.mockResolvedValue({ _id: 'dentist-1' });
    mockFind.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([]),
    });

    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(mockDentistFindOne).toHaveBeenCalledWith({ userId: 'user-dentist-1' });
    expect(mockFind).toHaveBeenCalledWith({ dentistId: 'dentist-1' });
  });

  it('returns 200 and empty array when DENTIST has no profile', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-x', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockDentistFindOne.mockResolvedValue(null);

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

  const populatedFixture = {
    id: 'appt-1',
    dentistId: { surgeryId: {} },
    patientId: { userId: { email: 'p@test.com' } },
  };

  const appointmentFixture = {
    id: 'appt-1',
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    populate: vi.fn().mockResolvedValue(populatedFixture),
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
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'appt-1');
  });

  it('returns 400 with the RangeError message when weekly limit is reached', async () => {
    mockCountDocuments.mockResolvedValue(5);

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Dentist already has 5 appointments this week');
  });

  it('returns 500 when Appointment.create throws unexpectedly', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app).post('/api/appointments').send(validBody);
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/appointments/:id/cancel ───────────────────────────────────────

describe('PUT /api/appointments/:id/cancel', () => {
  const baseAppointment = {
    id: 'appt-1',
    dentistId: { toString: () => 'dentist-1' },
    patientId: { toString: () => 'patient-1' },
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
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(null) }),
    });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });

    const res = await request(app).put('/api/appointments/appt-999/cancel');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Appointment not found');
  });

  it('returns 403 when DENTIST does not own the appointment', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }),
    });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-OTHER' } });

    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Forbidden');
  });

  it('returns 200 when DENTIST cancels their own appointment', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-dentist-1', email: 'd@test.com', role: 'DENTIST' };
      next();
    });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }),
    });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });
    mockFindByIdAndUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'CANCELLED');
  });

  it('returns 200 when PATIENT cancels their own appointment', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-patient-1', email: 'p@test.com', role: 'PATIENT' };
      next();
    });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }),
    });
    mockPatientFindOne.mockResolvedValue({ _id: { toString: () => 'patient-1' } });
    mockFindByIdAndUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    const res = await request(app).put('/api/appointments/appt-1/cancel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'CANCELLED');
  });
});
