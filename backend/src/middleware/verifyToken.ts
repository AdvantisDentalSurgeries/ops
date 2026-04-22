import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { AuthenticatedRequest } from '../types';

export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}
