import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { hasUnpaidBills } from '../../services/patientService';
import { createRequest } from '../../services/requestService';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    appointmentRequest: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('../../services/patientService', () => ({
  hasUnpaidBills: vi.fn(),
}));

const mockHasUnpaidBills = hasUnpaidBills as ReturnType<typeof vi.fn>;
const mockRequestCreate = prisma.appointmentRequest.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createRequest', () => {
  const validInput = {
    patientId: 'patient-1',
    requestType: 'PHONE' as const,
    requestedDate: new Date('2026-05-01'),
  };

  it('throws UNPAID_BILL error when patient has unpaid bills', async () => {
    mockHasUnpaidBills.mockResolvedValue(true);
    await expect(createRequest(validInput)).rejects.toThrow('UNPAID_BILL');
  });

  it('does not call prisma.appointmentRequest.create when patient has unpaid bills', async () => {
    mockHasUnpaidBills.mockResolvedValue(true);
    await expect(createRequest(validInput)).rejects.toThrow();
    expect(mockRequestCreate).not.toHaveBeenCalled();
  });

  it('creates the request with correct data when no unpaid bills', async () => {
    mockHasUnpaidBills.mockResolvedValue(false);
    const fixture = { id: 'req-1', ...validInput, patient: {} };
    mockRequestCreate.mockResolvedValue(fixture);

    await createRequest(validInput);

    expect(mockRequestCreate).toHaveBeenCalledWith({
      data: validInput,
      include: { patient: true },
    });
  });

  it('returns the created request on success', async () => {
    mockHasUnpaidBills.mockResolvedValue(false);
    const fixture = { id: 'req-1', ...validInput, patient: {} };
    mockRequestCreate.mockResolvedValue(fixture);

    const result = await createRequest(validInput);
    expect(result).toEqual(fixture);
  });

  it('accepts ONLINE as a valid requestType', async () => {
    mockHasUnpaidBills.mockResolvedValue(false);
    const input = { ...validInput, requestType: 'ONLINE' as const };
    const fixture = { id: 'req-2', ...input, patient: {} };
    mockRequestCreate.mockResolvedValue(fixture);

    const result = await createRequest(input);
    expect(result).toEqual(fixture);
    expect(mockRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ requestType: 'ONLINE' }) })
    );
  });
});
