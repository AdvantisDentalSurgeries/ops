import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasUnpaidBills } from '../../services/patientService';

vi.mock('../../models/Bill', () => ({
  Bill: { countDocuments: vi.fn() },
}));

vi.mock('../../models/Patient', () => ({
  Patient: {
    find: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

import { Bill } from '../../models/Bill';

const mockBillCount = Bill.countDocuments as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('hasUnpaidBills', () => {
  it('returns false when the patient has no unpaid bills', async () => {
    mockBillCount.mockResolvedValue(0);
    expect(await hasUnpaidBills('patient-1')).toBe(false);
  });

  it('returns true when the patient has one unpaid bill', async () => {
    mockBillCount.mockResolvedValue(1);
    expect(await hasUnpaidBills('patient-1')).toBe(true);
  });

  it('returns true when the patient has multiple unpaid bills', async () => {
    mockBillCount.mockResolvedValue(3);
    expect(await hasUnpaidBills('patient-1')).toBe(true);
  });

  it('queries with correct patientId and isPaid: false filter', async () => {
    mockBillCount.mockResolvedValue(0);
    await hasUnpaidBills('patient-42');
    expect(mockBillCount).toHaveBeenCalledWith({ patientId: 'patient-42', isPaid: false });
  });
});
