import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

// GET /api/admin-probniy?administratorId=&month=&year=
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { administratorId, month, year } = req.query;

    const where: any = {};
    if (administratorId) where.administratorId = String(administratorId);
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const records = await prisma.administratorProbniy.findMany({ where });
    return res.json(records);
  } catch (err) {
    return res.status(500).json({ error: 'Probniy ma\'lumotlarini yuklashda xatolik' });
  }
});

// POST /api/admin-probniy — upsert probniy record for admin/month/year
// Body: { administratorId, salaryRecordId, month, year, probniyCount, probniyPrice, baseSalary }
router.post(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { administratorId, salaryRecordId, month, year, probniyCount, probniyPrice, baseSalary } = req.body;

      if (!administratorId || !month || !year) {
        return res.status(400).json({ error: 'administratorId, month va year shart' });
      }

      const base = Number(baseSalary || 0);
      const count = Number(probniyCount || 0);
      const price = Number(probniyPrice || 0);
      const totalSalary = base + count * price;

      const record = await prisma.administratorProbniy.upsert({
        where: {
          administratorId_month_year: {
            administratorId,
            month: Number(month),
            year: Number(year),
          },
        },
        update: { probniyCount: count, probniyPrice: price, baseSalary: base, totalSalary },
        create: {
          administratorId,
          month: Number(month),
          year: Number(year),
          probniyCount: count,
          probniyPrice: price,
          baseSalary: base,
          totalSalary,
        },
      });

      // Update the MonthlySalary record
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
      console.error('Admin probniy save error:', err);
      return res.status(500).json({ error: 'Probniy ma\'lumotlarini saqlashda xatolik' });
    }
  }
);

export default router;
