import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { verifyToken } from '../../middleware/verifyToken';

vi.mock('../../middleware/verifyToken', () => ({
  verifyToken: vi.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-pat-1', email: 'p@test.com', role: 'PATIENT' };
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

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockPatientFindUnique = prisma.patient.findUnique as ReturnType<typeof vi.fn>;
const mockBillCount = prisma.bill.count as ReturnType<typeof vi.fn>;
const mockRequestCreate = prisma.appointmentRequest.create as ReturnType<typeof vi.fn>;

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
    patient: patientFixture,
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
    mockPatientFindUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Patient profile not found');
  });

  it('returns 403 with unpaid-bill error when patient has outstanding bills', async () => {
    mockPatientFindUnique.mockResolvedValue(patientFixture);
    mockBillCount.mockResolvedValue(1);

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      'error',
      'Cannot request appointment: outstanding unpaid bill'
    );
  });

  it('returns 201 and the created request when all conditions are met', async () => {
    mockPatientFindUnique.mockResolvedValue(patientFixture);
    mockBillCount.mockResolvedValue(0);
    mockRequestCreate.mockResolvedValue(requestFixture);

    const res = await request(app).post('/api/requests').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'req-1');
    expect(res.body).toHaveProperty('patientId', 'patient-1');
  });
});
