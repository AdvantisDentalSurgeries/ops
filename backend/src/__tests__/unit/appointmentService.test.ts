import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { sendConfirmationToEmail } from '../../services/emailService';
import {
  isWeeklyLimitReached,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from '../../services/appointmentService';

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
  },
}));

vi.mock('../../services/emailService', () => ({
  sendConfirmationToEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockCount = prisma.appointment.count as ReturnType<typeof vi.fn>;
const mockCreate = prisma.appointment.create as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.appointment.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.appointment.update as ReturnType<typeof vi.fn>;
const mockDentistFindUnique = prisma.dentist.findUnique as ReturnType<typeof vi.fn>;
const mockPatientFindUnique = prisma.patient.findUnique as ReturnType<typeof vi.fn>;
const mockSendEmail = sendConfirmationToEmail as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── isWeeklyLimitReached ────────────────────────────────────────────────────

describe('isWeeklyLimitReached', () => {
  it('returns false when dentist has 4 appointments in the week', async () => {
    mockCount.mockResolvedValue(4);
    expect(await isWeeklyLimitReached('dentist-1', new Date('2026-04-23'))).toBe(false);
  });

  it('returns true when dentist has exactly 5 appointments in the week', async () => {
    mockCount.mockResolvedValue(5);
    expect(await isWeeklyLimitReached('dentist-1', new Date('2026-04-23'))).toBe(true);
  });

  it('returns true when dentist has more than 5 appointments in the week', async () => {
    mockCount.mockResolvedValue(6);
    expect(await isWeeklyLimitReached('dentist-1', new Date('2026-04-23'))).toBe(true);
  });

  it('queries with ISO week bounds (Mon 00:00:00 UTC to Sun 23:59:59.999 UTC) for a Wednesday', async () => {
    mockCount.mockResolvedValue(0);
    // Wednesday 2026-04-22
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-22T12:00:00Z'));

    const call = mockCount.mock.calls[0][0];
    const { gte, lte } = call.where.dateTime;

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
    mockCount.mockResolvedValue(0);
    // Sunday 2026-04-26
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-26T10:00:00Z'));

    const call = mockCount.mock.calls[0][0];
    const { gte } = call.where.dateTime;
    // Week containing this Sunday starts on Mon 2026-04-20
    expect(gte.getUTCFullYear()).toBe(2026);
    expect(gte.getUTCMonth()).toBe(3); // April = 3
    expect(gte.getUTCDate()).toBe(20);
  });

  it('handles a Monday date (daysToMonday = 0)', async () => {
    mockCount.mockResolvedValue(0);
    // Monday 2026-04-27
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-27T08:00:00Z'));

    const call = mockCount.mock.calls[0][0];
    const { gte } = call.where.dateTime;
    expect(gte.getUTCDate()).toBe(27);
  });

  it('excludes CANCELLED appointments in the count query', async () => {
    mockCount.mockResolvedValue(0);
    await isWeeklyLimitReached('dentist-1', new Date('2026-04-22'));

    const call = mockCount.mock.calls[0][0];
    expect(call.where.status).toEqual({ not: 'CANCELLED' });
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

  const appointmentFixture = {
    id: 'appt-1',
    ...validInput,
    patient: { user: { email: 'patient@test.com' } },
    dentist: { surgery: {} },
  };

  it('throws RangeError when the weekly limit is reached', async () => {
    mockCount.mockResolvedValue(5);
    await expect(bookAppointment(validInput)).rejects.toThrow(RangeError);
    await expect(bookAppointment(validInput)).rejects.toThrow(
      'Dentist already has 5 appointments this week'
    );
  });

  it('does not call prisma.appointment.create when weekly limit is reached', async () => {
    mockCount.mockResolvedValue(5);
    await expect(bookAppointment(validInput)).rejects.toThrow();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls prisma.appointment.create with correct data when limit is not reached', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment(validInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dentistId: 'dentist-1',
          patientId: 'patient-1',
          dateTime: validInput.dateTime,
          notes: 'Checkup',
        }),
      })
    );
  });

  it('returns the created appointment on success', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    const result = await bookAppointment(validInput);
    expect(result).toEqual(appointmentFixture);
  });

  it('fires sendConfirmationToEmail with the patient email after booking', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment(validInput);

    expect(mockSendEmail).toHaveBeenCalledWith('patient@test.com', appointmentFixture);
  });

  it('does not throw when sendConfirmationToEmail rejects (fire-and-forget)', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP failure'));

    await expect(bookAppointment(validInput)).resolves.toEqual(appointmentFixture);
  });

  it('includes request connect in create payload when requestId is provided', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment({ ...validInput, requestId: 'req-1' });

    const call = mockCreate.mock.calls[0][0];
    expect(call.data.request).toEqual({ connect: { id: 'req-1' } });
  });

  it('omits the request key when requestId is not provided', async () => {
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue(appointmentFixture);

    await bookAppointment(validInput);

    const call = mockCreate.mock.calls[0][0];
    expect(call.data.request).toBeUndefined();
  });
});

// ─── cancelAppointment ───────────────────────────────────────────────────────

describe('cancelAppointment', () => {
  const baseAppointment = {
    id: 'appt-1',
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    dentist: { id: 'dentist-1' },
    patient: { id: 'patient-1' },
  };

  it('throws "Appointment not found" when appointment does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow(
      'Appointment not found'
    );
  });

  it('does not call update when appointment is not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws Forbidden when DENTIST profile is not found', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue(null);
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow('Forbidden');
  });

  it('throws Forbidden when DENTIST does not own the appointment', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-OTHER' });
    await expect(cancelAppointment('appt-1', 'user-1', 'DENTIST')).rejects.toThrow('Forbidden');
  });

  it('calls update with CANCELLED status when DENTIST owns the appointment', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    mockUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    await cancelAppointment('appt-1', 'user-dentist', 'DENTIST');

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'appt-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('throws Forbidden when PATIENT does not own the appointment', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockPatientFindUnique.mockResolvedValue({ id: 'patient-OTHER' });
    await expect(cancelAppointment('appt-1', 'user-1', 'PATIENT')).rejects.toThrow('Forbidden');
  });

  it('calls update with CANCELLED status when PATIENT owns the appointment', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockPatientFindUnique.mockResolvedValue({ id: 'patient-1' });
    mockUpdate.mockResolvedValue({ ...baseAppointment, status: 'CANCELLED' });

    await cancelAppointment('appt-1', 'user-patient', 'PATIENT');

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'appt-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('returns the updated appointment from prisma.update', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    const updated = { ...baseAppointment, status: 'CANCELLED' };
    mockUpdate.mockResolvedValue(updated);

    const result = await cancelAppointment('appt-1', 'user-dentist', 'DENTIST');
    expect(result).toEqual(updated);
  });
});

// ─── rescheduleAppointment ───────────────────────────────────────────────────

describe('rescheduleAppointment', () => {
  const baseAppointment = {
    id: 'appt-1',
    dentistId: 'dentist-1',
    patientId: 'patient-1',
    dentist: { id: 'dentist-1' },
    patient: { id: 'patient-1' },
  };
  const newDateTime = new Date('2026-05-10T10:00:00Z');

  it('throws "Appointment not found" when appointment does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-1', 'DENTIST')
    ).rejects.toThrow('Appointment not found');
  });

  it('throws Forbidden when DENTIST does not own the appointment', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-OTHER' });
    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-1', 'DENTIST')
    ).rejects.toThrow('Forbidden');
  });

  it('throws Forbidden when PATIENT does not own the appointment', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockPatientFindUnique.mockResolvedValue({ id: 'patient-OTHER' });
    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-1', 'PATIENT')
    ).rejects.toThrow('Forbidden');
  });

  it('throws RangeError when weekly limit is reached for newDateTime', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    // count returns 5 → limit reached for the new week
    mockCount.mockResolvedValue(5);

    await expect(
      rescheduleAppointment('appt-1', newDateTime, 'user-dentist', 'DENTIST')
    ).rejects.toThrow(RangeError);
  });

  it('performs the weekly limit check against newDateTime, not the original dateTime', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    mockCount.mockResolvedValue(0);
    mockUpdate.mockResolvedValue({ ...baseAppointment, dateTime: newDateTime });

    await rescheduleAppointment('appt-1', newDateTime, 'user-dentist', 'DENTIST');

    const countCall = mockCount.mock.calls[0][0];
    const { gte } = countCall.where.dateTime;
    // newDateTime is 2026-05-10 (Sunday) → week starts Mon 2026-05-04
    expect(gte.getUTCDate()).toBe(4);
    expect(gte.getUTCMonth()).toBe(4); // May = 4
  });

  it('calls update with newDateTime on success', async () => {
    mockFindUnique.mockResolvedValue(baseAppointment);
    mockDentistFindUnique.mockResolvedValue({ id: 'dentist-1' });
    mockCount.mockResolvedValue(0);
    mockUpdate.mockResolvedValue({ ...baseAppointment, dateTime: newDateTime });

    await rescheduleAppointment('appt-1', newDateTime, 'user-dentist', 'DENTIST');

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'appt-1' },
      data: { dateTime: newDateTime },
    });
  });
});
