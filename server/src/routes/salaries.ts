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
      where: {
        ...whereClause,
        // Only show EMPLOYEE and MANAGER roles in salary sections
        employee: {
          role: { code: { in: ['EMPLOYEE', 'MANAGER'] } },
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            defaultBaseSalary: true,
            role: { select: { displayName: true, code: true } },
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

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      // Only calculate payroll for EMPLOYEE and MANAGER roles
      const employees = await prisma.employee.findMany({
        where: {
          isActive: true,
          role: { code: { in: ['EMPLOYEE', 'MANAGER'] } },
        },
        include: { role: true },
      });

      const results = [];

      for (const emp of employees) {
        // Base salary uses emp.defaultBaseSalary (last updated salary or 0 if null)
        const baseSalary = emp.defaultBaseSalary ? Number(emp.defaultBaseSalary) : 0;

        const coveringShifts = await prisma.oneTimeShift.aggregate({
          where: {
            coveringEmployeeId: emp.id,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        const totalAdditions = Number(coveringShifts._sum.amount || 0);

        const absentShifts = await prisma.oneTimeShift.aggregate({
          where: {
            absentEmployeeId: emp.id,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        const totalShiftDeductions = Number(absentShifts._sum.amount || 0);

        const advances = await prisma.salaryAdvance.aggregate({
          where: {
            employeeId: emp.id,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        const totalAdvanceDeductions = Number(advances._sum.amount || 0);

        const finalPayout = Math.max(
          0,
          baseSalary + totalAdditions - totalShiftDeductions - totalAdvanceDeductions
        );

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

// PUT /api/salaries/:id (Update base salary for a specific month - AUTOMATICALLY UPDATES LAST SALARY on Employee)
router.put(
  '/:id',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { baseSalary } = req.body;

      if (baseSalary === undefined || isNaN(Number(baseSalary))) {
        return res.status(400).json({ error: 'Oylik maosh summasi kiritilishi shart' });
      }

      const newBaseSalary = Number(baseSalary);

      const existingSalary = await prisma.monthlySalary.findUnique({
        where: { id },
      });

      if (!existingSalary) {
        return res.status(404).json({ error: 'Oylik qaydi topilmadi' });
      }

      const finalPayout = Math.max(
        0,
        newBaseSalary +
          Number(existingSalary.totalAdditions) -
          Number(existingSalary.totalShiftDeductions) -
          Number(existingSalary.totalAdvanceDeductions)
      );

      // 1. Update MonthlySalary record
      const salary = await prisma.monthlySalary.update({
        where: { id },
        data: {
          baseSalary: newBaseSalary,
          finalPayout,
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // 2. AUTOMATICALLY UPDATE EMPLOYEE'S LAST SALARY (defaultBaseSalary)
      await prisma.employee.update({
        where: { id: existingSalary.employeeId },
        data: { defaultBaseSalary: newBaseSalary },
      });

      return res.json(salary);
    } catch (error) {
      console.error('Update salary error:', error);
      return res.status(500).json({ error: 'Oylik summasini yangilashda xatolik' });
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
