import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/shifts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, status } = req.query;

    const whereClause: any = {};
    if (employeeId && typeof employeeId === 'string') {
      whereClause.OR = [
        { coveringEmployeeId: employeeId },
        { absentEmployeeId: employeeId },
      ];
    }
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const shifts = await prisma.oneTimeShift.findMany({
      where: whereClause,
      include: {
        coveringEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
        absentEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json(shifts);
  } catch (error) {
    return res.status(500).json({ error: 'Smenalarni yuklashda xatolik' });
  }
});

// POST /api/shifts
router.post(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { date, amount, description, coveringEmployeeId, absentEmployeeId } = req.body;

      if (!date || amount === undefined || !coveringEmployeeId || !absentEmployeeId) {
        return res.status(400).json({ error: 'Sana, summa va xodimlar kiritilishi shart' });
      }

      if (coveringEmployeeId === absentEmployeeId) {
        return res.status(400).json({ error: 'Smenaga chiqqan va kelmagan xodim bir xil bo‘lishi mumkin emas' });
      }

      const shift = await prisma.oneTimeShift.create({
        data: {
          date: new Date(date),
          amount: Number(amount),
          description: description ? description.trim() : null,
          coveringEmployeeId,
          absentEmployeeId,
          status: 'APPROVED', // Default approved when created by manager/admin
          approvedById: req.user?.id,
        },
        include: {
          coveringEmployee: { select: { id: true, firstName: true, lastName: true } },
          absentEmployee: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return res.status(201).json(shift);
    } catch (error) {
      console.error('Create shift error:', error);
      return res.status(500).json({ error: 'Bir martalik smenani saqlashda xatolik' });
    }
  }
);

// PUT /api/shifts/:id/status
router.put(
  '/:id/status',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Yaroqsiz status' });
      }

      const shift = await prisma.oneTimeShift.update({
        where: { id },
        data: {
          status,
          approvedById: status === 'APPROVED' ? req.user?.id : null,
        },
        include: {
          coveringEmployee: { select: { id: true, firstName: true, lastName: true } },
          absentEmployee: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return res.json(shift);
    } catch (error) {
      return res.status(500).json({ error: 'Smena statusini o‘zgartirishda xatolik' });
    }
  }
);

// DELETE /api/shifts/:id
router.delete(
  '/:id',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.oneTimeShift.delete({ where: { id } });
      return res.json({ message: 'Smena almashtirish o‘chirildi' });
    } catch (error) {
      return res.status(500).json({ error: 'Smenani o‘chirishda xatolik' });
    }
  }
);

export default router;
