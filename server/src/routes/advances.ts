import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/advances
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, status } = req.query;

    const whereClause: any = {};
    if (employeeId && typeof employeeId === 'string') {
      whereClause.employeeId = employeeId;
    }
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const advances = await prisma.salaryAdvance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json(advances);
  } catch (error) {
    return res.status(500).json({ error: 'Avanslarni yuklashda xatolik' });
  }
});

// POST /api/advances
router.post(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT', 'EMPLOYEE']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, date, reason, employeeId } = req.body;

      // If user is EMPLOYEE role, they can only request for themselves
      const targetEmployeeId =
        req.user?.roleCode === 'EMPLOYEE' ? req.user.id : employeeId || req.user?.id;

      if (!amount || !date || !targetEmployeeId) {
        return res.status(400).json({ error: 'Summa, sana va xodim kiritilishi shart' });
      }

      const advance = await prisma.salaryAdvance.create({
        data: {
          amount: Number(amount),
          date: new Date(date),
          reason: reason ? reason.trim() : null,
          status: 'PENDING',
          isDeducted: false,
          employeeId: targetEmployeeId,
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return res.status(201).json(advance);
    } catch (error) {
      console.error('Create advance error:', error);
      return res.status(500).json({ error: 'Avans so‘rovini yaratishda xatolik' });
    }
  }
);

// PUT /api/advances/:id/status (Approve or Reject)
router.put(
  '/:id/status',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'APPROVED' or 'REJECTED'

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Yaroqsiz status' });
      }

      const advance = await prisma.salaryAdvance.update({
        where: { id },
        data: {
          status,
          approvedById: status === 'APPROVED' ? req.user?.id : null,
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return res.json(advance);
    } catch (error) {
      return res.status(500).json({ error: 'Avans statusini o‘zgartirishda xatolik' });
    }
  }
);

// DELETE /api/advances/:id
router.delete(
  '/:id',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.salaryAdvance.delete({ where: { id } });
      return res.json({ message: 'Avans o‘chirildi' });
    } catch (error) {
      return res.status(500).json({ error: 'Avansni o‘chirishda xatolik' });
    }
  }
);

export default router;
