import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/analytics/dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Total expenses this month
    const totalExpensesMonth = await prisma.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { value: true },
      _count: { id: true },
    });

    // 2. Total salaries paid this month
    const totalSalariesPaidMonth = await prisma.monthlySalary.aggregate({
      where: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isPaid: true,
      },
      _sum: { finalPayout: true },
      _count: { id: true },
    });

    // 3. Pending Advances
    const pendingAdvances = await prisma.salaryAdvance.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 4. Active Employees count
    const activeEmployeesCount = await prisma.employee.count({
      where: { isActive: true },
    });

    // 5. Category Breakdown for current month
    const categoryStats = await prisma.expenseCategory.findMany({
      select: {
        id: true,
        name: true,
        expenses: {
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          select: { value: true },
        },
      },
    });

    const categoryBreakdown = categoryStats
      .map((cat) => {
        const total = cat.expenses.reduce((sum, e) => sum + Number(e.value), 0);
        return { id: cat.id, name: cat.name, total };
      })
      .filter((cat) => cat.total > 0)
      .sort((a, b) => b.total - a.total);

    // 6. Branch Breakdown for current month
    const branchStats = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        expenses: {
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          select: { value: true },
        },
      },
    });

    const branchBreakdown = branchStats.map((b) => {
      const total = b.expenses.reduce((sum, e) => sum + Number(e.value), 0);
      return { id: b.id, name: b.name, total };
    });

    // 7. Recent Expenses (last 5)
    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        branch: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return res.json({
      summary: {
        totalExpensesThisMonth: Number(totalExpensesMonth._sum.value || 0),
        expenseCountThisMonth: totalExpensesMonth._count.id,
        totalSalariesPaidThisMonth: Number(totalSalariesPaidMonth._sum.finalPayout || 0),
        salariesPaidCountThisMonth: totalSalariesPaidMonth._count.id,
        pendingAdvancesAmount: Number(pendingAdvances._sum.amount || 0),
        pendingAdvancesCount: pendingAdvances._count.id,
        activeEmployeesCount,
      },
      categoryBreakdown,
      branchBreakdown,
      recentExpenses,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Statistikalarni yuklashda xatolik' });
  }
});

export default router;
