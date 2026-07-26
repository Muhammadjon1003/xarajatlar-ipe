import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/salaries?month=7&year=2026
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, employeeId } = req.query;

    const whereClause: any = {};
    if (month) whereClause.month = Number(month);
    if (year) whereClause.year = Number(year);
    if (employeeId && typeof employeeId === 'string') whereClause.employeeId = employeeId;

    const salaries = await prisma.monthlySalary.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            defaultBaseSalary: true,
            role: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return res.json(salaries);
  } catch (error) {
    return res.status(500).json({ error: 'Oyliklarni yuklashda xatolik' });
  }
});

// POST /api/salaries/calculate (Generate or refresh payroll calculations for a target month & year)
router.post(
  '/calculate',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { month, year } = req.body;

      if (!month || !year) {
        return res.status(400).json({ error: 'Oylik va yil ko‘rsatilishi shart' });
      }

      const targetMonth = Number(month);
      const targetYear = Number(year);

      // Get start and end of month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      // Get all active employees
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
      });

      const results = [];

      for (const emp of employees) {
        const baseSalary = Number(emp.defaultBaseSalary || 0);

        // Sum additions from covering shifts in this month
        const coveringShifts = await prisma.oneTimeShift.aggregate({
          where: {
            coveringEmployeeId: emp.id,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        const totalAdditions = Number(coveringShifts._sum.amount || 0);

        // Sum deductions from absent shifts in this month
        const absentShifts = await prisma.oneTimeShift.aggregate({
          where: {
            absentEmployeeId: emp.id,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        const totalShiftDeductions = Number(absentShifts._sum.amount || 0);

        // Sum advance deductions in this month
        const advances = await prisma.salaryAdvance.aggregate({
          where: {
            employeeId: emp.id,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        const totalAdvanceDeductions = Number(advances._sum.amount || 0);

        // Calculate final payout
        const finalPayout = Math.max(
          0,
          baseSalary + totalAdditions - totalShiftDeductions - totalAdvanceDeductions
        );

        // Upsert MonthlySalary record
        const salary = await prisma.monthlySalary.upsert({
          where: {
            employeeId_month_year: {
              employeeId: emp.id,
              month: targetMonth,
              year: targetYear,
            },
          },
          update: {
            baseSalary,
            totalAdditions,
            totalShiftDeductions,
            totalAdvanceDeductions,
            finalPayout,
          },
          create: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear,
            baseSalary,
            totalAdditions,
            totalShiftDeductions,
            totalAdvanceDeductions,
            finalPayout,
            isPaid: false,
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: { select: { displayName: true } },
              },
            },
          },
        });

        results.push(salary);
      }

      return res.json({ message: `${results.length} ta xodim uchun oylik hisoblandi`, salaries: results });
    } catch (error) {
      console.error('Calculate payroll error:', error);
      return res.status(500).json({ error: 'Oyliklarni hisoblashda xatolik' });
    }
  }
);

// PUT /api/salaries/:id/pay (Mark payout as completed)
router.put(
  '/:id/pay',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isPaid } = req.body;

      const salary = await prisma.monthlySalary.update({
        where: { id },
        data: {
          isPaid: Boolean(isPaid),
          paidAt: isPaid ? new Date() : null,
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return res.json(salary);
    } catch (error) {
      return res.status(500).json({ error: 'Oylik to‘lov holatini o‘zgartirishda xatolik' });
    }
  }
);

export default router;
