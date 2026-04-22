import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getBillsByPatient, markPaid } from '../services/billService';

export async function getByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { patientId } = req.params;

  // PATIENT role can only view their own bills
  if (req.user!.role === 'PATIENT') {
    const { prisma } = await import('../lib/prisma');
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
    if (!patient || patient.id !== patientId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const bills = await getBillsByPatient(patientId);
  res.json(bills);
}

export async function pay(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const bill = await markPaid(id);
    res.json(bill);
  } catch (err) {
    if (err instanceof Error && err.message === 'Bill not found') {
      res.status(404).json({ error: err.message });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to mark bill as paid' });
    }
  }
}
