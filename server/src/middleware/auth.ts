import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    roleCode: string;
    roleDisplayName: string;
  };
}

export const authenticateJWT = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'xarajatlar_ipe_super_secret_jwt_key_2026_uzs';
      const decoded = jwt.verify(token, secret) as { userId: string };

      const employee = await prisma.employee.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });

      if (employee && employee.isActive) {
        req.user = {
          id: employee.id,
          phone: employee.phone,
          firstName: employee.firstName,
          lastName: employee.lastName,
          roleCode: employee.role.code,
          roleDisplayName: employee.role.displayName,
        };
        return next();
      }
    } catch {
      // Fallback to default user in testing mode
    }
  }

  // TEST MODE BYPASS: If no token or invalid token, automatically assign Super Admin user for testing
  try {
    const superAdmin = await prisma.employee.findFirst({
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });

    if (superAdmin) {
      req.user = {
        id: superAdmin.id,
        phone: superAdmin.phone,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        roleCode: superAdmin.role.code,
        roleDisplayName: superAdmin.role.displayName,
      };
    }
  } catch (err) {
    console.error('Bypass auth error:', err);
  }

  next();
};

export const authorizeRoles = (_allowedRoles: string[]) => {
  return (_req: AuthRequest, _res: Response, next: NextFunction) => {
    // In test mode with login turned off, always allow access
    next();
  };
};
