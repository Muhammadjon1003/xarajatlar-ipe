import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

// GET /api/employees
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.roleCode === 'SUPER_ADMIN';

    const whereClause: any = {};
    if (!isSuperAdmin) {
      // Hide SUPER_ADMIN (Direktor) accounts from Manager & other roles
      whereClause.role = {
        code: { not: 'SUPER_ADMIN' },
      };
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
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
      const { firstName, lastName, username, phone, password, roleId, defaultBaseSalary } = req.body;
      const loginInput = String(username || phone || '').trim();

      if (!firstName || !lastName || !roleId) {
        return res.status(400).json({ error: 'Ism, familiya va rol kiritilishi shart' });
      }

      // Non-superadmin cannot assign SUPER_ADMIN role
      const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (targetRole?.code === 'SUPER_ADMIN' && req.user?.roleCode !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Faqat Direktorgina Direktor lavozimini tayinlashi mumkin' });
      }

      if (loginInput) {
        const existing = await prisma.employee.findFirst({
          where: {
            OR: [
              { username: loginInput },
              { phone: loginInput },
            ],
          },
        });
        if (existing) {
          return res.status(400).json({ error: 'Ushbu login yoki telefon raqamli xodim allaqachon mavjud' });
        }
      }

      const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);

      const employee = await prisma.employee.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: loginInput || null,
          phone: phone ? phone.trim() : loginInput || null,
          passwordHash,
          roleId,
          defaultBaseSalary: defaultBaseSalary !== undefined ? Number(defaultBaseSalary) : null,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
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
      const { firstName, lastName, username, phone, password, roleId, defaultBaseSalary, isActive } = req.body;
      const loginInput = String(username || phone || '').trim();

      const existingEmp = await prisma.employee.findUnique({
        where: { id },
        include: { role: true },
      });

      if (!existingEmp) {
        return res.status(404).json({ error: 'Xodim topilmadi' });
      }

      // Non-superadmin cannot edit a SUPER_ADMIN account
      if (existingEmp.role.code === 'SUPER_ADMIN' && req.user?.roleCode !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Faqat Direktorgina Direktor profilini tahrirlashi mumkin' });
      }

      if (roleId) {
        const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
        if (targetRole?.code === 'SUPER_ADMIN' && req.user?.roleCode !== 'SUPER_ADMIN') {
          return res.status(403).json({ error: 'Faqat Direktorgina Direktor lavozimini tayinlashi mumkin' });
        }
      }

      const dataToUpdate: any = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        roleId,
        defaultBaseSalary: defaultBaseSalary !== undefined ? Number(defaultBaseSalary) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      };

      if (loginInput) {
        dataToUpdate.username = loginInput;
        dataToUpdate.phone = phone ? phone.trim() : loginInput;
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
          username: true,
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
