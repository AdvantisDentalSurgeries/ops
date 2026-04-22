import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendConfirmationToEmail } from '../../services/emailService';
import {
  isWeeklyLimitReached,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from '../../services/appointmentService';

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

vi.mock('../../services/emailService', () => ({
  sendConfirmationToEmail: vi.fn().mockResolvedValue(undefined),
}));

import { Appointment } from '../../models/Appointment';
import { Dentist } from '../../models/Dentist';
import { Patient } from '../../models/Patient';

const mockCountDocuments = Appointment.countDocuments as ReturnType<typeof vi.fn>;
const mockCreate = Appointment.create as ReturnType<typeof vi.fn>;
const mockFindById = Appointment.findById as ReturnType<typeof vi.fn>;
const mockFindByIdAndUpdate = Appointment.findByIdAndUpdate as ReturnType<typeof vi.fn>;
const mockDentistFindOne = Dentist.findOne as ReturnType<typeof vi.fn>;
const mockPatientFindOne = Patient.findOne as ReturnType<typeof vi.fn>;
const mockSendEmail = sendConfirmationToEmail as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── isWeeklyLimitReached ────────────────────────────────────────────────────

describe('isWeeklyLimitReached', () => {
  it('returns false when dentist has 4 appointments in the week', async () => {
    mockCountDocuments.mockResolvedValue(4);
    expect(await isWeeklyLimitReached('dentist-1', new Date('2026-04-23'))).toBe(false);
  });

  it('returns true when dentist has exactly 5 appointments in the week', async () => {
    mockCountDocuments.mockResolvedValue(5);
    expect(await isWeeklyLimitReached('dentist-1', new Date('2026-04-23'))).toBe(true);
  });

  it('returns true when dentist has more than 5 appointments in the week', async () => {
    mockCountDocuments.mockResolvedValue(6);
    expect(await isWeeklyLimitReached('dentist-1', new Date('2026-04-23'))).toBe(true);
  });

  it('queries with ISO week bounds (Mon 00:00:00 UTC to Sun 23:59:59.999 UTC) for a Wednesday', async () => {
    mockCountDocuments.mockResolvedValue(0);
    // Wednesday 2026-04-22
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-22T12:00:00Z'));

    const call = mockCountDocuments.mock.calls[0][0];
    const { $gte: gte, $lte: lte } = call.dateTime;

    expect(gte.getUTCDay()).toBe(1); // Monday
    expect(gte.getUTCHours()).toBe(0);
    expect(gte.getUTCMinutes()).toBe(0);
    expect(gte.getUTCSeconds()).toBe(0);
    expect(lte.getUTCDay()).toBe(0); // Sunday
    expect(lte.getUTCHours()).toBe(23);
    expect(lte.getUTCMinutes()).toBe(59);
    expect(lte.getUTCSeconds()).toBe(59);
    expect(lte.getUTCMilliseconds()).toBe(999);
  });

  it('handles a Sunday date (daysToMonday = -6)', async () => {
    mockCountDocuments.mockResolvedValue(0);
    // Sunday 2026-04-26
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-26T10:00:00Z'));

    const call = mockCountDocuments.mock.calls[0][0];
    const { $gte: gte } = call.dateTime;
    // Week containing this Sunday starts on Mon 2026-04-20
    expect(gte.getUTCFullYear()).toBe(2026);
    expect(gte.getUTCMonth()).toBe(3); // April = 3
    expect(gte.getUTCDate()).toBe(20);
  });

  it('handles a Monday date (daysToMonday = 0)', async () => {
    mockCountDocuments.mockResolvedValue(0);
    // Monday 2026-04-27
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-27T08:00:00Z'));

    const call = mockCountDocuments.mock.calls[0][0];
    const { $gte: gte } = call.dateTime;
    expect(gte.getUTCDate()).toBe(27);
  });

  it('excludes CANCELLED appointments in the count query', async () => {
    mockCountDocuments.mockResolvedValue(0);
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-22'));

    const call = mockCountDocuments.mock.calls[0][0];
    expect(call.status).toEqual({ $ne: 'CANCELLED' });
  });
});

// ─── bookAppointment ─────────────────────────────────────────────────────────

describe('bookAppointment', () => {
  const validInput = {
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    dateTime: new Date('2026-05-01T09:00:00Z'),
    notes: 'Checkup',
  };

  const populatedFixture = {
    id: 'appt-1',
    ...validInput,
    patientId: { userId: { email: 'patient@test.com' } },
    dentistId: { surgeryId: {} },
  };

  const appointmentFixture = {
    id: 'appt-1',
    ...validInput,
    populate: vi.fn().mockResolvedValue(populatedFixture),
  };

  it('throws RangeError when the weekly limit is reached', async () => {
    mockCountDocuments.mockResolvedValue(5);
    await expect(bookAppointment(validInput)).rejects.toThrow(RangeError);
    await expect(bookAppointment(validInput)).rejects.toThrow(
      'Dentist already has 5 appointments this week'
    );
  });

  it('does not call Appointment.create when weekly limit is reached', async () => {
    mockCountDocuments.mockResolvedValue(5);
    await expect(bookAppointment(validInput)).rejects.toThrow();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls Appointment.create with correct data when limit is not reached', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment(validInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        dentistId: 'dentist-1',
        patientId: 'patient-1',
        dateTime: validInput.dateTime,
        notes: 'Checkup',
      })
    );
  });

  it('returns the populated appointment on success', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    const result = await bookAppointment(validInput);
    expect(result).toEqual(populatedFixture);
  });

  it('fires sendConfirmationToEmail with the patient email after booking', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment(validInput);

    expect(mockSendEmail).toHaveBeenCalledWith('patient@test.com', populatedFixture);
  });

  it('does not throw when sendConfirmationToEmail rejects (fire-and-forget)', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP failure'));

    await expect(bookAppointment(validInput)).resolves.toEqual(populatedFixture);
  });

  it('includes appointmentRequestId in create payload when requestId is provided', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment({ ...validInput, requestId: 'req-1' });

    const call = mockCreate.mock.calls[0][0];
    expect(call.appointmentRequestId).toBe('req-1');
  });

  it('omits appointmentRequestId when requestId is not provided', async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment(validInput);

    const call = mockCreate.mock.calls[0][0];
    expect(call.appointmentRequestId).toBeUndefined();
  });
});

// ─── cancelAppointment ───────────────────────────────────────────────────────

describe('cancelAppointment', () => {
  const baseAppointment = {
    id: 'appt-1',
    dentistId: { toString: () => 'dentist-1' },
    patientId: { toString: () => 'patient-1' },
    populate: vi.fn(),
  };

  it('throws "Appointment not found" when appointment does not exist', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(null) }) });
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow(
      'Appointment not found'
    );
  });

  it('does not call findByIdAndUpdate when appointment is not found', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(null) }) });
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow();
    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('throws Forbidden when DENTIST profile is not found', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue(null);
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow('Forbidden');
  });

  it('throws Forbidden when DENTIST does not own the appointment', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-OTHER' } });
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow('Forbidden');
  });

  it('calls findByIdAndUpdate with CANCELLED status when DENTIST owns the appointment', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });
    mockFindByIdAndUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    await cancelAppointment('appt-1', 'user-dentist', 'DENTIST');

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('appt-1', { status: 'CANCELLED' }, { new: true });
  });

  it('throws Forbidden when PATIENT does not own the appointment', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockPatientFindOne.mockResolvedValue({ _id: { toString: () => 'patient-OTHER' } });
    await expect(cancelAppointment('appt-1', 'user-1', 'PATIENT')).rejects.toThrow('Forbidden');
  });

  it('calls findByIdAndUpdate with CANCELLED status when PATIENT owns the appointment', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockPatientFindOne.mockResolvedValue({ _id: { toString: () => 'patient-1' } });
    mockFindByIdAndUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    await cancelAppointment('appt-1', 'user-patient', 'PATIENT');

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('appt-1', { status: 'CANCELLED' }, { new: true });
  });

  it('returns the updated appointment from findByIdAndUpdate', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });
    const updated = { ...baseAppointment, status: 'CANCELLED' };
    mockFindByIdAndUpdate.mockResolvedValue(updated);

    const result = await cancelAppointment('appt-1', 'user-dentist', 'DENTIST');
    expect(result).toEqual(updated);
  });
});

// ─── rescheduleAppointment ───────────────────────────────────────────────────

describe('rescheduleAppointment', () => {
  const baseAppointment = {
    id: 'appt-1',
    dentistId: { toString: () => 'dentist-1' },
    patientId: { toString: () => 'patient-1' },
  };
  const newDateTime = new Date('2026-05-10T10:00:00Z');

  it('throws "Appointment not found" when appointment does not exist', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(null) }) });
    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-1', 'DENTIST')
    ).rejects.toThrow('Appointment not found');
  });

  it('throws Forbidden when DENTIST does not own the appointment', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-OTHER' } });
    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-1', 'DENTIST')
    ).rejects.toThrow('Forbidden');
  });

  it('throws Forbidden when PATIENT does not own the appointment', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockPatientFindOne.mockResolvedValue({ _id: { toString: () => 'patient-OTHER' } });
    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-1', 'PATIENT')
    ).rejects.toThrow('Forbidden');
  });

  it('throws RangeError when weekly limit is reached for newDateTime', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });
    // count returns 5 → limit reached for the new week
    mockCountDocuments.mockResolvedValue(5);

    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-dentist', 'DENTIST')
    ).rejects.toThrow(RangeError);
  });

  it('performs the weekly limit check against newDateTime, not the original dateTime', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });
    mockCountDocuments.mockResolvedValue(0);
    mockFindByIdAndUpdate.mockResolvedValue({ ...baseAppointment, dateTime: newDateTime });

    await rescheduleAppointment('appt-1', newDateTime, 'user-dentist', 'DENTIST');

    const countCall = mockCountDocuments.mock.calls[0][0];
    const { $gte: gte } = countCall.dateTime;
    // newDateTime is 2026-05-10 (Sunday) → week starts Mon 2026-05-04
    expect(gte.getUTCDate()).toBe(4);
    expect(gte.getUTCMonth()).toBe(4); // May = 4
  });

  it('calls findByIdAndUpdate with newDateTime on success', async () => {
    mockFindById.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(baseAppointment) }) });
    mockDentistFindOne.mockResolvedValue({ _id: { toString: () => 'dentist-1' } });
    mockCountDocuments.mockResolvedValue(0);
    mockFindByIdAndUpdate.mockResolvedValue({ ...baseAppointment, dateTime: newDateTime });

    await rescheduleAppointment('appt-1', newDateTime, 'user-dentist', 'DENTIST');

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'appt-1',
      { dateTime: newDateTime },
      { new: true }
    );
  });
});
