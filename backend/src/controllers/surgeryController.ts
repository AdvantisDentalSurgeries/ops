import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types';

export async function list(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const surgeries = await prisma.surgery.findMany({ orderBy: { name: 'asc' } });
  res.json(surgeries);
}

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, address, phone } = req.body as {
    name: string;
    address: string;
    phone: string;
  };

  if (!name || !address || !phone) {
    res.status(400).json({ error: 'name, address, and phone are required' });
    return;
  }

  const surgery = await prisma.surgery.create({ data: { name, address, phone } });
  res.status(201).json(surgery);
}
