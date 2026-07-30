import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

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

// POST /api/shifts (All authenticated roles can report a shift swap!)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date, amount, description, absentEmployeeId } = req.body;
    let coveringEmployeeId = req.body.coveringEmployeeId || req.user?.id;

    if (!date || amount === undefined || !coveringEmployeeId || !absentEmployeeId) {
      return res.status(400).json({ error: 'Sana, summa va xodimlar kiritilishi shart' });
    }

    if (coveringEmployeeId === absentEmployeeId) {
      return res.status(400).json({ error: 'Smenaga chiqqan va kelmagan xodim bir xil bo‘lishi mumkin emas' });
    }

    const isManagerOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'].includes(req.user?.roleCode || '');

    const shift = await prisma.oneTimeShift.create({
      data: {
        date: new Date(date),
        amount: Number(amount),
        description: description ? description.trim() : null,
        coveringEmployeeId,
        absentEmployeeId,
        status: isManagerOrAdmin ? 'APPROVED' : 'PENDING', // Pending if reported by employee/teacher
        approvedById: isManagerOrAdmin ? req.user?.id : null,
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
});

// PUT /api/shifts/:id/status (Absent employee, covering employee, or manager/admin can update status!)
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Yaroqsiz status' });
    }

    const existingShift = await prisma.oneTimeShift.findUnique({ where: { id } });
    if (!existingShift) {
      return res.status(404).json({ error: 'Smena topilmadi' });
    }

    const isManagerOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'].includes(req.user?.roleCode || '');
    const isParticipant = req.user?.id === existingShift.absentEmployeeId || req.user?.id === existingShift.coveringEmployeeId;

    if (!isManagerOrAdmin && !isParticipant) {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
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
});

// DELETE /api/shifts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingShift = await prisma.oneTimeShift.findUnique({ where: { id } });
    if (!existingShift) {
      return res.status(404).json({ error: 'Smena topilmadi' });
    }

    const isManagerOrAdmin = ['SUPER_ADMIN', 'MANAGER'].includes(req.user?.roleCode || '');
    const isCreator = req.user?.id === existingShift.coveringEmployeeId && existingShift.status === 'PENDING';

    if (!isManagerOrAdmin && !isCreator) {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
    }

    await prisma.oneTimeShift.delete({ where: { id } });
    return res.json({ message: 'Smena almashtirish o‘chirildi' });
  } catch (error) {
    return res.status(500).json({ error: 'Smenani o‘chirishda xatolik' });
  }
});

export default router;
