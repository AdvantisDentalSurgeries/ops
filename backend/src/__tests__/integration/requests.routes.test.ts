import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { verifyToken } from '../../middleware/verifyToken';

vi.mock('../../middleware/verifyToken', () => ({
  verifyToken: vi.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-pat-1', email: 'p@test.com', role: 'PATIENT' };
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

import { Patient } from '../../models/Patient';
import { Bill } from '../../models/Bill';
import { AppointmentRequest } from '../../models/AppointmentRequest';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockPatientFindOne = Patient.findOne as ReturnType<typeof vi.fn>;
const mockBillCount = Bill.countDocuments as ReturnType<typeof vi.fn>;
const mockRequestCreate = AppointmentRequest.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyToken.mockImplementation((req: any, _res: any, next: any) => {
    req.user = { id: 'user-pat-1', email: 'p@test.com', role: 'PATIENT' };
    next();
  });
});

// ─── POST /api/requests ──────────────────────────────────────────────────────

describe('POST /api/requests', () => {
  const validBody = {
    requestType: 'PHONE',
    requestedDate: '2026-05-15T09:00:00Z',
  };

  const patientFixture = { id: 'patient-1', userId: 'user-pat-1' };
  const requestFixture = {
    id: 'req-1',
    patientId: 'patient-1',
    requestType: 'PHONE',
    requestedDate: new Date('2026-05-15T09:00:00Z'),
    patientId_populated: patientFixture,
  };

  it('returns 403 when user is OFFICE_MANAGER (route requires PATIENT)', async () => {
    mockVerifyToken.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'user-mgr-1', email: 'mgr@test.com', role: 'OFFICE_MANAGER' };
      next();
    });

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 400 when requestType is missing', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({ requestedDate: '2026-05-15T09:00:00Z' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when requestedDate is missing', async () => {
    const res = await request(app).post('/api/requests').send({ requestType: 'PHONE' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when requestType is an invalid value', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({ requestType: 'FAX', requestedDate: '2026-05-15T09:00:00Z' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when no patient profile exists for the user', async () => {
    mockPatientFindOne.mockResolvedValue(null);

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Patient profile not found');
  });

  it('returns 403 with unpaid-bill error when patient has outstanding bills', async () => {
    mockPatientFindOne.mockResolvedValue(patientFixture);
    mockBillCount.mockResolvedValue(1);

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      'error',
      'Cannot request appointment: outstanding unpaid bill'
    );
  });

  it('returns 201 and the created request when all conditions are met', async () => {
    mockPatientFindOne.mockResolvedValue(patientFixture);
    mockBillCount.mockResolvedValue(0);
    const createdReq = {
      id: 'req-1',
      patientId: 'patient-1',
      requestType: 'PHONE',
      populate: vi.fn().mockResolvedValue({ id: 'req-1', patientId: 'patient-1', requestType: 'PHONE' }),
    };
    mockRequestCreate.mockResolvedValue(createdReq);

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'req-1');
    expect(res.body).toHaveProperty('patientId', 'patient-1');
  });
});
