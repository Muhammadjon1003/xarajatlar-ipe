import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Telefon raqam va parol kiritilishi shart' });
    }

    const employee = await prisma.employee.findUnique({
      where: { phone },
      include: { role: true },
    });

    if (!employee || !employee.isActive || !employee.passwordHash) {
      return res.status(401).json({ error: 'Telefon raqam yoki parol noto‘g‘ri' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Telefon raqam yoki parol noto‘g‘ri' });
    }

    const secret = process.env.JWT_SECRET || 'xarajatlar_ipe_super_secret_jwt_key_2026_uzs';
    const token = jwt.sign(
      { userId: employee.id, roleCode: employee.role.code },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        roleCode: employee.role.code,
        roleDisplayName: employee.role.displayName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Tizimda xatolik yuz berdi' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// GET /api/auth/roles
router.get('/roles', authenticateJWT, async (_req: AuthRequest, res: Response) => {
  const roles = await prisma.role.findMany({
    orderBy: { displayName: 'asc' },
  });
  return res.json(roles);
});

export default router;
