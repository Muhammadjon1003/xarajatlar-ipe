import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

// GET /api/admin-aktiv?administratorId=&month=&year=
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { administratorId, month, year } = req.query;

    const where: any = {};
    if (administratorId) where.administratorId = String(administratorId);
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const records = await prisma.administratorAktiv.findMany({ where });
    return res.json(records);
  } catch (err) {
    console.error('Fetch admin-aktiv fallback:', err);
    return res.json([]);
  }
});

// POST /api/admin-aktiv — upsert aktiv record for admin/month/year
router.post(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { administratorId, salaryRecordId, month, year, aktivCount, aktivPrice, baseSalary } = req.body;

      if (!administratorId || !month || !year) {
        return res.status(400).json({ error: 'administratorId, month va year shart' });
      }

      const base = Number(baseSalary || 0);
      const count = Number(aktivCount || 0);
      const price = Number(aktivPrice || 0);
      const totalSalary = base + count * price;

      const record = await prisma.administratorAktiv.upsert({
        where: {
          administratorId_month_year: {
            administratorId,
            month: Number(month),
            year: Number(year),
          },
        },
        update: { aktivCount: count, aktivPrice: price, baseSalary: base, totalSalary },
        create: {
          administratorId,
          month: Number(month),
          year: Number(year),
          aktivCount: count,
          aktivPrice: price,
          baseSalary: base,
          totalSalary,
        },
      });

      if (salaryRecordId) {
        const existing = await prisma.monthlySalary.findUnique({ where: { id: salaryRecordId } });
        if (existing) {
          const finalPayout = Math.max(
            0,
            totalSalary +
              Number(existing.totalAdditions) -
              Number(existing.totalShiftDeductions) -
              Number(existing.totalAdvanceDeductions)
          );
          await prisma.monthlySalary.update({
            where: { id: salaryRecordId },
            data: { baseSalary: totalSalary, finalPayout },
          });
          await prisma.employee.update({
            where: { id: administratorId },
            data: { defaultBaseSalary: totalSalary },
          });
        }
      }

      return res.status(201).json({ record, totalSalary });
    } catch (err) {
      console.error('Admin aktiv save error:', err);
      return res.status(500).json({ error: 'Aktiv ma’lumotlarini saqlashda xatolik' });
    }
  }
);

export default router;
