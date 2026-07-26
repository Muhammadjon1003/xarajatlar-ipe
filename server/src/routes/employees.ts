import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/employees
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        defaultBaseSalary: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            code: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ error: 'Xodimlarni yuklashda xatolik' });
  }
});

// POST /api/employees
router.post(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { firstName, lastName, phone, password, roleId, defaultBaseSalary } = req.body;

      if (!firstName || !lastName || !roleId) {
        return res.status(400).json({ error: 'Ism, familiya va rol kiritilishi shart' });
      }

      if (phone) {
        const existing = await prisma.employee.findUnique({ where: { phone: phone.trim() } });
        if (existing) {
          return res.status(400).json({ error: 'Ushbu telefon raqamli xodim allaqachon mavjud' });
        }
      }

      const passwordHash = password ? await bcrypt.hash(password, 10) : null;

      const employee = await prisma.employee.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : null,
          passwordHash,
          roleId,
          defaultBaseSalary: defaultBaseSalary !== undefined ? Number(defaultBaseSalary) : null,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          defaultBaseSalary: true,
          createdAt: true,
          role: true,
        },
      });

      return res.status(201).json(employee);
    } catch (error) {
      console.error('Create employee error:', error);
      return res.status(500).json({ error: 'Xodim qo‘shishda xatolik' });
    }
  }
);

// PUT /api/employees/:id
router.put(
  '/:id',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, password, roleId, defaultBaseSalary, isActive } = req.body;

      const dataToUpdate: any = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        roleId,
        defaultBaseSalary: defaultBaseSalary !== undefined ? Number(defaultBaseSalary) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      };

      if (phone !== undefined) {
        dataToUpdate.phone = phone ? phone.trim() : null;
      }

      if (password) {
        dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
      }

      const employee = await prisma.employee.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          defaultBaseSalary: true,
          updatedAt: true,
          role: true,
        },
      });

      return res.json(employee);
    } catch (error) {
      return res.status(500).json({ error: 'Xodim ma’lumotlarini tahrirlashda xatolik' });
    }
  }
);

// DELETE /api/employees/:id (Soft-deactivate)
router.delete(
  '/:id',
  authorizeRoles(['SUPER_ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.employee.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({ message: 'Xodim nofaol holatga o‘tkazildi' });
    } catch (error) {
      return res.status(500).json({ error: 'Xodimni o‘chirishda xatolik' });
    }
  }
);

export default router;
