import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  getAppointments,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from '../services/appointmentService';

export async function list(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id, role } = req.user!;
  const appointments = await getAppointments(id, role);
  res.json(appointments);
}

export async function book(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { dentistId, patientId, dateTime, notes, requestId } = req.body as {
    dentistId: string;
    patientId: string;
    dateTime: string;
    notes?: string;
    requestId?: string;
  };

  if (!dentistId || !patientId || !dateTime) {
    res.status(400).json({ error: 'dentistId, patientId, and dateTime are required' });
    return;
  }

  try {
    const appointment = await bookAppointment({
      dentistId,
      patientId,
      dateTime: new Date(dateTime),
      notes,
      requestId,
    });
    res.status(201).json(appointment);
  } catch (err) {
    if (err instanceof RangeError) {
      res.status(400).json({ error: err.message });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  }
}

export async function cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id: appointmentId } = req.params;
  const { id: userId, role } = req.user!;

  try {
    const appointment = await cancelAppointment(appointmentId, userId, role);
    res.json(appointment);
  } catch (err) {
    if (err instanceof Error && err.message === 'Appointment not found') {
      res.status(404).json({ error: err.message });
    } else if (err instanceof Error && err.message === 'Forbidden') {
      res.status(403).json({ error: err.message });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
}

export async function reschedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id: appointmentId } = req.params;
  const { id: userId, role } = req.user!;
  const { dateTime } = req.body as { dateTime: string };

  if (!dateTime) {
    res.status(400).json({ error: 'dateTime is required' });
    return;
  }

  try {
    const appointment = await rescheduleAppointment(
      appointmentId,
      new Date(dateTime),
      userId,
      role
    );
    res.json(appointment);
  } catch (err) {
    if (err instanceof Error && err.message === 'Appointment not found') {
      res.status(404).json({ error: err.message });
    } else if (err instanceof Error && err.message === 'Forbidden') {
      res.status(403).json({ error: err.message });
    } else if (err instanceof RangeError) {
      res.status(400).json({ error: err.message });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
  }
}
