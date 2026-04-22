import { Response } from 'express';
import { RequestType } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { createRequest, getRequests } from '../services/requestService';
import { prisma } from '../lib/prisma';

export async function list(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const requests = await getRequests();
  res.json(requests);
}

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { requestType, requestedDate } = req.body as {
    requestType: RequestType;
    requestedDate: string;
  };

  if (!requestType || !requestedDate) {
    res.status(400).json({ error: 'requestType and requestedDate are required' });
    return;
  }

  if (!Object.values(RequestType).includes(requestType)) {
    res.status(400).json({ error: 'requestType must be PHONE or ONLINE' });
    return;
  }

  const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
  if (!patient) {
    res.status(404).json({ error: 'Patient profile not found' });
    return;
  }

  try {
    const request = await createRequest({
      patientId: patient.id,
      requestType,
      requestedDate: new Date(requestedDate),
    });
    res.status(201).json(request);
  } catch (err) {
    if (err instanceof Error && err.message === 'UNPAID_BILL') {
      res.status(403).json({ error: 'Cannot request appointment: outstanding unpaid bill' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to create request' });
    }
  }
}
